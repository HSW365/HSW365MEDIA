# SYNC365

AI lip sync on flat monthly subscriptions. Three tiers, each with a hard cap on
projects per billing month. No credits.

## What is in here

| Part | Where |
|---|---|
| Plans, prices, monthly caps, max length | `server/config.js` |
| Signup / login, owner accounts, monthly cap logic | `server/auth.js` |
| Stripe subscriptions, plan switching, webhook | `server/billing.js` |
| Lip sync engine (fal.ai) | `server/engine.js` |
| Render queue | `server/worker.js` |
| Landing, pricing, studio, library | `public/` |

## Go live

1. **Engine** - create a key at fal.ai and set `FAL_KEY`.
2. **Stripe** - `STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup` creates the
   three monthly prices and prints the `STRIPE_PRICE_*` values. Add a webhook to
   `<APP_URL>/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`. Turn on the
   Customer Portal in Stripe billing settings.
3. **Database and files** - set `DATABASE_URL` (Supabase Postgres connection
   string) plus `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` so accounts and videos
   survive restarts. Tables and the storage bucket are created on first boot.
4. **Deploy** - push to GitHub and create a Render web service from the
   `Dockerfile` (ffmpeg is included). `render.yaml` lists every env var.
   Set `APP_URL`, `JWT_SECRET` and `OWNER_PASSWORD`.

Owner accounts (`OWNER_EMAILS`) are created at boot with `OWNER_PASSWORD`: full
access, no cap, never billed. Those addresses cannot be registered publicly.

## Run locally

```
npm install
OWNER_PASSWORD=choose-one LIPSYNC_ENGINE=mock npm start
```

With no `DATABASE_URL` it uses an embedded database under `./data`. The `mock`
engine only joins the picture and the audio so you can click through the flow;
it is blocked in production.

## What a render costs you

Default engine `fal-ai/latentsync`: $0.20 per video up to 40s, then $0.005 per
extra second. Worst case if every subscriber uses every project at full length:

| Plan | Price | Projects | Max length | Worst-case engine cost |
|---|---|---|---|---|
| Starter | $20 | 15 | 30s | $3.00 |
| Pro | $45 | 50 | 90s | $22.50 |
| Elite | $99 | 120 | 2 min | $72.00 |

`FAL_MODEL_PHOTO=veed/fabric-1.0` switches photo projects on the plans in
`FAL_PHOTO_PLANS` to a full head-and-body performance model. It costs $0.08 to
$0.15 per second, so a 2 minute Elite video is $9.60+. Leave it off unless the
caps for that plan are lowered to match.
