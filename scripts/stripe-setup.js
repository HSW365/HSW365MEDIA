// One-time Stripe setup: creates the three monthly subscription products and
// prices from server/config.js and prints the env vars to paste into your host.
//   STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup
import Stripe from 'stripe';
import { PLANS, PLAN_ORDER, BRAND } from '../server/config.js';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('Set STRIPE_SECRET_KEY first.'); process.exit(1); }
const stripe = new Stripe(key);

const out = [];
for (const id of PLAN_ORDER) {
  const plan = PLANS[id];
  const lookup = `sync365_${id}_monthly_${plan.price}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookup], limit: 1 });
  let price = existing.data[0];
  if (!price) {
    const product = await stripe.products.create({
      name: `${BRAND.name} ${plan.name}`,
      description: `${plan.projects} lip sync projects per month, up to ${plan.maxSeconds}s each.`,
      metadata: { sync365_plan: id },
    });
    price = await stripe.prices.create({
      product: product.id, currency: 'usd', unit_amount: plan.price * 100,
      recurring: { interval: 'month' }, lookup_key: lookup,
    });
  }
  out.push(`STRIPE_PRICE_${id.toUpperCase()}=${price.id}`);
  console.log(`${plan.name}: $${plan.price}/mo -> ${price.id}`);
}
console.log('\nAdd these to your environment:\n' + out.join('\n'));
console.log('\nThen in Stripe: add a webhook endpoint at <APP_URL>/api/stripe/webhook for');
console.log('checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed');
console.log('and set STRIPE_WEBHOOK_SECRET to its signing secret. Turn on the Customer Portal in Billing settings.');
