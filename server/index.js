import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { PORT, ROOT, IS_PROD, BRAND, PLANS, PLAN_PRIORITY, LIMITS, OWNER_EMAILS, publicPlans } from './config.js';
import { migrate, query, one, closeDb } from './db.js';
import { initStorage, tmpDir, putFile, removeFiles, sendFile } from './storage.js';
import { probe } from './media.js';
import {
  loadUser, requireUser, rateLimit, setSession, clearSession, normEmail, validEmail,
  hashPassword, checkPassword, entitlement, usedThisPeriod, seedOwners,
} from './auth.js';
import { billingReady, subscribe, portal, handleWebhook, syncCustomer } from './billing.js';
import { startWorker } from './worker.js';
import { engineReady, engineName } from './engine.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Stripe needs the raw body, so this route is registered before express.json.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(loadUser);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, status, error, extra = {}) => res.status(status).json({ error, ...extra });

// ---- public ----------------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true, engine: engineName(), billing: billingReady() }));
app.get('/api/config', (_req, res) => res.json({ brand: BRAND, plans: publicPlans(), billingReady: billingReady(), engineReady: engineReady() }));

// ---- auth ------------------------------------------------------------------
async function mePayload(user) {
  const ent = entitlement(user);
  const used = ent.active ? await usedThisPeriod(user.id, ent.periodStart) : 0;
  return {
    user: { id: user.id, email: user.email, name: user.name, hasBilling: !!user.stripe_customer_id },
    subscription: ent.active
      ? {
          active: true, comp: ent.comp, plan: ent.plan, planName: ent.planName,
          limit: ent.limit, used, remaining: ent.limit === null ? null : Math.max(0, ent.limit - used),
          maxSeconds: ent.maxSeconds, resetsAt: ent.periodEnd, cancelAtPeriodEnd: !!ent.cancelAtPeriodEnd,
        }
      : { active: false, status: user.status },
  };
}

app.post('/api/auth/signup', rateLimit(10, 15 * 60 * 1000), wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  const name = String(req.body.name || '').trim().slice(0, 80);
  const password = String(req.body.password || '');
  if (!validEmail(email)) return bad(res, 400, 'Enter a valid email address.');
  if (password.length < 8 || password.length > 200) return bad(res, 400, 'Password must be at least 8 characters.');
  if (OWNER_EMAILS.includes(email)) return bad(res, 400, 'That address is reserved. Sign in instead.');
  if (await one('SELECT 1 FROM users WHERE email=$1', [email])) return bad(res, 409, 'An account with that email already exists. Sign in instead.');
  const id = crypto.randomUUID();
  await query('INSERT INTO users (id, email, name, password_hash) VALUES ($1,$2,$3,$4)', [id, email, name, await hashPassword(password)]);
  setSession(res, id);
  res.json(await mePayload(await one('SELECT * FROM users WHERE id=$1', [id])));
}));

app.post('/api/auth/login', rateLimit(20, 15 * 60 * 1000), wrap(async (req, res) => {
  const user = await one('SELECT * FROM users WHERE email=$1', [normEmail(req.body.email)]);
  const ok = user && await checkPassword(String(req.body.password || ''), user.password_hash);
  if (!ok) return bad(res, 401, 'Wrong email or password.');
  setSession(res, user.id);
  res.json(await mePayload(user));
}));

app.post('/api/auth/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });

app.post('/api/auth/password', requireUser, rateLimit(10, 15 * 60 * 1000), wrap(async (req, res) => {
  const next = String(req.body.next || '');
  if (!await checkPassword(String(req.body.current || ''), req.user.password_hash)) return bad(res, 401, 'Current password is wrong.');
  if (next.length < 8 || next.length > 200) return bad(res, 400, 'New password must be at least 8 characters.');
  await query('UPDATE users SET password_hash=$2 WHERE id=$1', [req.user.id, await hashPassword(next)]);
  res.json({ ok: true });
}));

app.get('/api/me', requireUser, wrap(async (req, res) => res.json(await mePayload(req.user))));

// ---- billing ---------------------------------------------------------------
app.post('/api/billing/subscribe', requireUser, wrap(async (req, res) => res.json(await subscribe(req.user, String(req.body.plan || '')))));
app.post('/api/billing/portal', requireUser, wrap(async (req, res) => res.json(await portal(req.user))));
app.post('/api/billing/sync', requireUser, wrap(async (req, res) => {
  await syncCustomer(req.user);
  res.json(await mePayload(await one('SELECT * FROM users WHERE id=$1', [req.user.id])));
}));

// ---- projects --------------------------------------------------------------
const upload = multer({
  storage: multer.diskStorage({
    destination: tmpDir,
    filename: (_req, _file, cb) => cb(null, `up-${crypto.randomUUID()}`),
  }),
  limits: { fileSize: LIMITS.faceBytes, files: 2, fields: 10 },
}).fields([{ name: 'face', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);

const view = (p) => ({
  id: p.id, title: p.title, status: p.status, stage: p.stage, error: p.error,
  sourceKind: p.source_kind, duration: p.duration_sec, counted: p.counted,
  createdAt: p.created_at, completedAt: p.completed_at,
  videoUrl: p.output_key ? `/api/projects/${p.id}/video` : null,
  thumbUrl: p.thumb_key ? `/api/projects/${p.id}/thumb` : null,
});

// Checks plan and monthly cap. Run before the upload is accepted, and again
// inside the per-user lock right before the project is written.
async function gate(user) {
  const ent = entitlement(user);
  if (!ent.active) return { status: 402, error: 'Choose a plan to start creating.', code: 'no_plan' };
  if (ent.limit !== null) {
    const used = await usedThisPeriod(user.id, ent.periodStart);
    if (used >= ent.limit) {
      const when = ent.periodEnd ? new Date(ent.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'your next billing date';
      return { status: 403, code: 'limit_reached', error: `You have used all ${ent.limit} projects on ${ent.planName} this month. Your count resets ${when}, or upgrade to keep creating now.` };
    }
  }
  return { ent };
}

const locks = new Map();
async function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(fn);
  locks.set(key, run);
  try { return await run; } finally { if (locks.get(key) === run) locks.delete(key); }
}

app.get('/api/projects', requireUser, wrap(async (req, res) => {
  const rows = await query('SELECT * FROM projects WHERE user_id=$1 AND deleted=FALSE ORDER BY created_at DESC LIMIT 300', [req.user.id]);
  res.json({ projects: rows.map(view) });
}));

app.post('/api/projects', requireUser,
  wrap(async (req, res, next) => {
    if (!engineReady()) return bad(res, 503, 'Rendering is not available yet. Please try again shortly.');
    const g = await gate(req.user);
    if (g.error) return bad(res, g.status, g.error, { code: g.code });
    next();
  }),
  (req, res, next) => upload(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large (150 MB max).' : 'Upload failed. Please try again.';
    bad(res, 400, msg);
  }),
  wrap(async (req, res) => {
    const face = req.files?.face?.[0];
    const audio = req.files?.audio?.[0];
    const drop = () => Promise.all([face, audio].filter(Boolean).map((f) => fs.promises.rm(f.path, { force: true })));
    try {
      if (!face || !audio) return bad(res, 400, 'Add both a face (photo or video) and an audio file.');
      if (req.body.rights !== 'true') return bad(res, 400, 'Confirm you have the rights to this face and voice.');
      if (audio.size > LIMITS.audioBytes) return bad(res, 400, 'Audio file is too large (40 MB max).');

      const [fInfo, aInfo] = await Promise.all([probe(face.path).catch(() => null), probe(audio.path).catch(() => null)]);
      if (!fInfo?.hasVideo) return bad(res, 400, 'The face file must be a photo (JPG, PNG, WEBP) or a video (MP4, MOV, WEBM).');
      if (!aInfo?.hasAudio) return bad(res, 400, 'We could not read any sound in that audio file. Use MP3, WAV, M4A or a recording.');
      if (aInfo.duration < LIMITS.minSeconds) return bad(res, 400, 'Audio must be at least 1 second long.');

      const sourceKind = fInfo.isImage ? 'image' : 'video';
      const title = String(req.body.title || '').trim().slice(0, 80) || 'Untitled project';

      const result = await withLock(req.user.id, async () => {
        const user = await one('SELECT * FROM users WHERE id=$1', [req.user.id]);
        const g = await gate(user);
        if (g.error) return g;
        const { ent } = g;
        if (aInfo.duration > ent.maxSeconds + 0.5) {
          return { status: 400, code: 'too_long', error: `Your audio is ${Math.ceil(aInfo.duration)}s. ${ent.planName} covers up to ${ent.maxSeconds}s per project. Trim it or upgrade.` };
        }
        const id = crypto.randomUUID();
        const sourceKey = `${user.id}/${id}/source`;
        const audioKey = `${user.id}/${id}/audio`;
        await putFile(sourceKey, face.path, face.mimetype || 'application/octet-stream');
        await putFile(audioKey, audio.path, audio.mimetype || 'application/octet-stream');
        await query(
          `INSERT INTO projects (id, user_id, title, source_kind, source_key, audio_key, duration_sec, priority)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [id, user.id, title, sourceKind, sourceKey, audioKey, aInfo.duration, PLAN_PRIORITY[ent.plan] ?? 0],
        );
        return { project: await one('SELECT * FROM projects WHERE id=$1', [id]) };
      });
      if (result.error) return bad(res, result.status, result.error, { code: result.code });
      res.status(201).json({ project: view(result.project) });
    } finally {
      await drop();
    }
  }),
);

const ownProject = (req) => one('SELECT * FROM projects WHERE id=$1 AND user_id=$2 AND deleted=FALSE', [req.params.id, req.user.id]);

app.get('/api/projects/:id', requireUser, wrap(async (req, res) => {
  const p = await ownProject(req);
  if (!p) return bad(res, 404, 'Project not found.');
  res.json({ project: view(p) });
}));

app.get('/api/projects/:id/video', requireUser, wrap(async (req, res) => {
  const p = await ownProject(req);
  if (!p?.output_key) return bad(res, 404, 'Video not found.');
  const name = `${p.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'sync365'}.mp4`;
  await sendFile(req, res, p.output_key, { contentType: 'video/mp4', downloadName: req.query.download ? name : null });
}));

app.get('/api/projects/:id/thumb', requireUser, wrap(async (req, res) => {
  const p = await ownProject(req);
  if (!p?.thumb_key) return bad(res, 404, 'Thumbnail not found.');
  await sendFile(req, res, p.thumb_key, { contentType: 'image/jpeg' });
}));

// Deleting frees the files but not the monthly slot: the cap is on projects
// created per month, not projects kept.
app.delete('/api/projects/:id', requireUser, wrap(async (req, res) => {
  const p = await ownProject(req);
  if (!p) return bad(res, 404, 'Project not found.');
  if (p.status === 'queued' || p.status === 'processing') return bad(res, 409, 'This project is still rendering. Delete it once it finishes.');
  await query('UPDATE projects SET deleted=TRUE, output_key=NULL, thumb_key=NULL WHERE id=$1', [p.id]);
  await removeFiles([p.output_key, p.thumb_key, p.source_key, p.audio_key]);
  res.json({ ok: true });
}));

// ---- pages -----------------------------------------------------------------
const pub = path.join(ROOT, 'public');
const page = (name) => (_req, res) => res.sendFile(path.join(pub, name));
app.get(['/login', '/signup'], page('auth.html'));
app.get('/app', page('app.html'));
app.get('/terms', page('terms.html'));
app.use(express.static(pub, { extensions: ['html'], maxAge: IS_PROD ? '1h' : 0 }));
app.use('/api', (_req, res) => bad(res, 404, 'Not found.'));
app.use((_req, res) => res.status(404).sendFile(path.join(pub, 'index.html')));

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const hide = status >= 500 && status !== 503;
  if (hide) console.error('[server]', err);
  res.status(status).json({ error: hide ? 'Something went wrong on our side. Please try again.' : err.message });
});

await migrate();
await initStorage();
await seedOwners();
await startWorker();
const server = app.listen(PORT, () => console.log(`[server] ${BRAND.name} on :${PORT} | engine=${engineName()} | billing=${billingReady() ? 'ready' : 'not configured'}`));

// Clean shutdown so deploys and restarts never interrupt a database write.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.once(sig, () => {
    server.close();
    closeDb().catch(() => {}).finally(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
