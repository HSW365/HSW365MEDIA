# SYNC365

AI lip sync on flat monthly subscriptions. Three tiers, each with a hard cap on
projects per billing month. No credits.

## What is in here

| Part | Where |
|---|---|
| Plans, prices, monthly caps, max length | `server/config.js` |
| Signup / login, owner accounts, monthly cap logic | `server/auth.js` |
| Stripe subscriptions, plan switching, webhook, auto setup | `server/billing.js` |
| Owner-entered keys (encrypted) | `server/settings.js` |
| Lip sync engine (fal.ai) | `server/engine.js` |
| Render queue | `server/worker.js` |
| Landing, pricing, studio, library | `public/` |

## Go live

Deployed on Render from the `Dockerfile` (ffmpeg included). Host env vars:
`JWT_SECRET`, `OWNER_PASSWORD`, `DATABASE_URL`, `DB_SCHEMA`.

Everything else is done in the app: sign in with an owner email, open
**Plan -> Platform setup**, paste the fal.ai key and the Stripe secret key.
The app then creates the three monthly prices, the webhook and the billing
portal by itself, and stores the keys encrypted in the database.

Owner accounts (`OWNER_EMAILS`) are created at boot with `OWNER_PASSWORD`: full
access, no cap, never billed. Those addresses cannot be registered publicly.

Finished videos are stored in the database. To move them to Supabase Storage
set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

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
