// Central configuration. Plans live here so the pricing page, the quota
// enforcement and the Stripe setup script can never drift apart.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

const env = process.env;
export const IS_PROD = env.NODE_ENV === 'production';
export const PORT = Number(env.PORT || 3000);
export const APP_URL = (env.APP_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
export const DATA_DIR = path.resolve(env.DATA_DIR || path.join(ROOT, 'data'));
export const DATABASE_URL = env.DATABASE_URL || ''; // several candidates may be separated with |
export const DB_SCHEMA = env.DB_SCHEMA || '';

export const JWT_SECRET = env.JWT_SECRET || (IS_PROD ? '' : 'dev-only-secret-change-me');
if (!JWT_SECRET) throw new Error('JWT_SECRET is required in production');

export const BRAND = {
  name: 'SYNC365',
  company: 'HSW365 Media LLC',
  supportEmail: 'hsw365media@gmail.com',
};

// ---------------------------------------------------------------------------
// PLANS  -  flat monthly price, a hard cap on projects per billing month and a
// cap on how long each project can run. No credits anywhere.
// Change a price here, then re-run `npm run stripe:setup` to mint new Stripe
// prices and update the STRIPE_PRICE_* env vars.
// ---------------------------------------------------------------------------
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 20,
    projects: 15,
    maxSeconds: 30,
    tagline: 'For creators testing the waters.',
    features: ['15 projects every month', 'Up to 30 seconds per project', 'Photo or video source', 'HD MP4 downloads, no watermark', 'Commercial use'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 45,
    projects: 50,
    maxSeconds: 90,
    featured: true,
    tagline: 'For people posting every day.',
    features: ['50 projects every month', 'Up to 90 seconds per project', 'Photo or video source', 'HD MP4 downloads, no watermark', 'Commercial use', 'Priority in the render queue'],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 99,
    projects: 120,
    maxSeconds: 120,
    tagline: 'For agencies, labels and brands.',
    features: ['120 projects every month', 'Up to 2 minutes per project', 'Photo or video source', 'HD MP4 downloads, no watermark', 'Commercial use', 'Front of the render queue'],
  },
};
export const PLAN_ORDER = ['starter', 'pro', 'elite'];
export const PLAN_PRIORITY = { starter: 0, pro: 1, elite: 2 };

// Owner / comp accounts: never pay, never expire, no monthly cap.
export const OWNER_EMAILS = (env.OWNER_EMAILS || 'hsw365media@gmail.com,hoodstarent365@gmail.com')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
export const OWNER_PASSWORD = env.OWNER_PASSWORD || '';
export const COMP_LIMITS = { projects: null, maxSeconds: 600 };

// Stripe and fal.ai keys are read through server/settings.js (env var or owner setup).
export const FAL_MODEL_VIDEO = env.FAL_MODEL_VIDEO || 'fal-ai/latentsync';
// Optional premium photo-to-performance model (e.g. "veed/fabric-1.0").
// Leave empty to animate photos through the video model (far cheaper).
export const FAL_MODEL_PHOTO = env.FAL_MODEL_PHOTO || '';
export const FAL_PHOTO_PLANS = (env.FAL_PHOTO_PLANS || 'elite').split(',').map((s) => s.trim());
export const FAL_PHOTO_RESOLUTION = env.FAL_PHOTO_RESOLUTION || '480p';

// Optional durable file storage (Supabase Storage). Falls back to local disk.
export const SUPABASE_URL = (env.SUPABASE_URL || '').replace(/\/$/, '');
export const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || '';
export const SUPABASE_BUCKET = env.SUPABASE_BUCKET || 'sync365';

export const LIMITS = {
  faceBytes: 150 * 1024 * 1024,
  audioBytes: 40 * 1024 * 1024,
  minSeconds: 1,
  jobTimeoutMs: 30 * 60 * 1000,
};

export function publicPlans() {
  return PLAN_ORDER.map((id) => {
    const { name, price, projects, maxSeconds, tagline, features, featured } = PLANS[id];
    return { id, name, price, projects, maxSeconds, tagline, features, featured: !!featured };
  });
}
