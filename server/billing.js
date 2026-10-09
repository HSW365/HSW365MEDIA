// Stripe subscriptions: Checkout for new subscribers, in-place plan switches
// for existing ones, the customer portal for cards/cancellation, and a webhook
// that keeps the user's plan and billing month in sync.
import Stripe from 'stripe';
import { one, query } from './db.js';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICES, APP_URL, PLANS } from './config.js';

export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
export const billingReady = () => !!stripe && Object.values(STRIPE_PRICES).every(Boolean);

const planForPrice = (priceId) => Object.keys(STRIPE_PRICES).find((k) => STRIPE_PRICES[k] === priceId) || null;
const ts = (sec) => (sec ? new Date(sec * 1000) : null);
const LIVE = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];

export async function syncSubscription(sub) {
  const item = sub.items?.data?.[0];
  const plan = item ? planForPrice(item.price.id) : null;
  const ended = ['canceled', 'incomplete_expired'].includes(sub.status);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // Newer Stripe API versions report the billing period on the item.
  const start = item?.current_period_start ?? sub.current_period_start;
  const end = item?.current_period_end ?? sub.current_period_end;
  await query(
    `UPDATE users SET plan=$2, status=$3, stripe_subscription_id=$4, period_start=$5, period_end=$6, cancel_at_period_end=$7
      WHERE stripe_customer_id=$1 AND comp=FALSE`,
    [customerId, ended ? null : plan, sub.status, ended ? null : sub.id, ts(start), ts(end), !!sub.cancel_at_period_end],
  );
}

// Pull the truth straight from Stripe (used after checkout, and as a safety
// net if a webhook is ever missed).
export async function syncCustomer(user) {
  if (!stripe || !user.stripe_customer_id || user.comp) return;
  const subs = await stripe.subscriptions.list({ customer: user.stripe_customer_id, status: 'all', limit: 10 });
  const current = subs.data.find((s) => LIVE.includes(s.status)) || subs.data[0];
  if (current) await syncSubscription(current);
}

async function ensureCustomer(user) {
  if (user.stripe_customer_id) return user.stripe_customer_id;
  const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { user_id: user.id } });
  await query('UPDATE users SET stripe_customer_id=$2 WHERE id=$1', [user.id, customer.id]);
  return customer.id;
}

// -> { url } to redirect to Checkout, or { switched: true } for a plan change.
export async function subscribe(user, planId) {
  if (!PLANS[planId]) throw Object.assign(new Error('Unknown plan.'), { status: 400 });
  if (user.comp) throw Object.assign(new Error('This account already has full access.'), { status: 400 });
  if (!billingReady()) throw Object.assign(new Error('Billing is not configured yet.'), { status: 503 });
  const price = STRIPE_PRICES[planId];

  if (user.stripe_subscription_id && ['active', 'trialing'].includes(user.status)) {
    const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    const updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: sub.items.data[0].id, price }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
    });
    await syncSubscription(updated);
    return { switched: true };
  }

  const customer = await ensureCustomer(user);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${APP_URL}/app?checkout=success`,
    cancel_url: `${APP_URL}/app?tab=plan`,
  });
  return { url: session.url };
}

export async function portal(user) {
  if (!stripe || !user.stripe_customer_id) throw Object.assign(new Error('No billing profile yet.'), { status: 400 });
  const session = await stripe.billingPortal.sessions.create({ customer: user.stripe_customer_id, return_url: `${APP_URL}/app?tab=plan` });
  return { url: session.url };
}

export async function handleWebhook(req, res) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(503).send('billing not configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`signature check failed: ${e.message}`);
  }
  try {
    const obj = event.data.object;
    if (event.type.startsWith('customer.subscription.')) {
      await syncSubscription(obj);
    } else if (event.type === 'checkout.session.completed' && obj.subscription) {
      if (obj.client_reference_id) {
        await query('UPDATE users SET stripe_customer_id=$2 WHERE id=$1 AND stripe_customer_id IS NULL', [obj.client_reference_id, obj.customer]);
      }
      await syncSubscription(await stripe.subscriptions.retrieve(obj.subscription));
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const user = await one('SELECT * FROM users WHERE stripe_customer_id=$1', [obj.customer]);
      if (user) await syncCustomer(user);
    }
    res.json({ received: true });
  } catch (e) {
    console.error('[billing] webhook error', event.type, e.message);
    res.status(500).send('webhook handler error');
  }
}
