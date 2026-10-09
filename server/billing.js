// Stripe subscriptions: Checkout for new subscribers, in-place plan switches
// for existing ones, the customer portal for cards/cancellation, and a webhook
// that keeps the user's plan and billing month in sync.
import Stripe from 'stripe';
import { one, query } from './db.js';
import { APP_URL, PLANS, PLAN_ORDER, BRAND } from './config.js';
import { setting, saveSetting } from './settings.js';

let cached = { key: '', client: null };
function stripeClient() {
  const key = setting('STRIPE_SECRET_KEY');
  if (!key) return null;
  if (cached.key !== key) cached = { key, client: new Stripe(key) };
  return cached.client;
}
const priceFor = (plan) => setting(`STRIPE_PRICE_${plan.toUpperCase()}`);
export const billingReady = () => !!stripeClient() && PLAN_ORDER.every(priceFor);
export const billingMode = () => (setting('STRIPE_SECRET_KEY').startsWith('sk_live_') ? 'live' : setting('STRIPE_SECRET_KEY') ? 'test' : null);

const planForPrice = (priceId) => PLAN_ORDER.find((k) => priceFor(k) === priceId) || null;

// Everything Stripe needs, from one secret key: the three monthly prices, the
// webhook endpoint and a customer portal configuration.
export async function setupStripe(secretKey) {
  const s = new Stripe(secretKey);
  await s.balance.retrieve(); // throws on a bad key
  const prices = {};
  for (const id of PLAN_ORDER) {
    const plan = PLANS[id];
    const lookup = `sync365_${id}_monthly_${plan.price}`;
    let price = (await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0];
    if (!price) {
      const product = await s.products.create({
        name: `${BRAND.name} ${plan.name}`,
        description: `${plan.projects} lip sync projects per month, up to ${plan.maxSeconds}s each.`,
        metadata: { sync365_plan: id },
      });
      price = await s.prices.create({ product: product.id, currency: 'usd', unit_amount: plan.price * 100, recurring: { interval: 'month' }, lookup_key: lookup });
    }
    prices[id] = price.id;
  }
  const url = `${APP_URL}/api/stripe/webhook`;
  for (const ep of (await s.webhookEndpoints.list({ limit: 100 })).data) {
    if (ep.url === url) await s.webhookEndpoints.del(ep.id);
  }
  const endpoint = await s.webhookEndpoints.create({
    url,
    enabled_events: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed'],
  });
  const portals = await s.billingPortal.configurations.list({ active: true, limit: 1 });
  if (!portals.data.length) {
    await s.billingPortal.configurations.create({
      business_profile: { headline: `${BRAND.name} billing` },
      features: {
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
        subscription_cancel: { enabled: true, mode: 'at_period_end' },
      },
    }).catch((e) => console.warn('[billing] portal config not created:', e.message));
  }
  await saveSetting('STRIPE_SECRET_KEY', secretKey);
  await saveSetting('STRIPE_WEBHOOK_SECRET', endpoint.secret);
  for (const id of PLAN_ORDER) await saveSetting(`STRIPE_PRICE_${id.toUpperCase()}`, prices[id]);
  return { prices, webhook: url };
}
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
  const stripe = stripeClient();
  if (!stripe || !user.stripe_customer_id || user.comp) return;
  const subs = await stripe.subscriptions.list({ customer: user.stripe_customer_id, status: 'all', limit: 10 });
  const current = subs.data.find((s) => LIVE.includes(s.status)) || subs.data[0];
  if (current) await syncSubscription(current);
}

async function ensureCustomer(user) {
  const stripe = stripeClient();
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
  const price = priceFor(planId);
  const stripe = stripeClient();

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
  const stripe = stripeClient();
  if (!stripe || !user.stripe_customer_id) throw Object.assign(new Error('No billing profile yet.'), { status: 400 });
  const session = await stripe.billingPortal.sessions.create({ customer: user.stripe_customer_id, return_url: `${APP_URL}/app?tab=plan` });
  return { url: session.url };
}

export async function handleWebhook(req, res) {
  const stripe = stripeClient();
  const STRIPE_WEBHOOK_SECRET = setting('STRIPE_WEBHOOK_SECRET');
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
