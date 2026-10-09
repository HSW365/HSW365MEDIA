import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { one, query } from './db.js';
import { JWT_SECRET, IS_PROD, OWNER_EMAILS, OWNER_PASSWORD, PLANS, COMP_LIMITS } from './config.js';

const COOKIE = 'sync365_session';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
export const hashPassword = (pw) => bcrypt.hash(pw, 11);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: MAX_AGE, path: '/' });
}
export const clearSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export async function loadUser(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { sub } = jwt.verify(token, JWT_SECRET);
      req.user = await one('SELECT * FROM users WHERE id=$1', [sub]);
    } catch { /* expired or tampered: treated as signed out */ }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in.' });
  next();
}

// Simple in-memory limiter for the auth endpoints.
const hits = new Map();
export function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const rec = hits.get(key);
    if (!rec || rec.reset < now) hits.set(key, { n: 1, reset: now + windowMs });
    else if (++rec.n > max) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, 60000).unref();

// ---- entitlement -----------------------------------------------------------
// Returns what this user may do right now, and where they are in the month.
export function entitlement(user) {
  if (user.comp) {
    const d = new Date();
    return {
      active: true, comp: true, plan: 'elite', planName: 'Owner access',
      limit: COMP_LIMITS.projects, maxSeconds: COMP_LIMITS.maxSeconds,
      periodStart: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)),
      periodEnd: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
    };
  }
  const plan = PLANS[user.plan];
  const live = ['active', 'trialing'].includes(user.status);
  const inPeriod = !user.period_end || new Date(user.period_end).getTime() > Date.now() - 24 * 3600 * 1000;
  if (!plan || !live || !inPeriod) return { active: false, comp: false, plan: null, status: user.status };
  return {
    active: true, comp: false, plan: plan.id, planName: plan.name,
    limit: plan.projects, maxSeconds: plan.maxSeconds,
    periodStart: new Date(user.period_start || user.created_at),
    periodEnd: user.period_end ? new Date(user.period_end) : null,
    cancelAtPeriodEnd: !!user.cancel_at_period_end,
  };
}

export async function usedThisPeriod(userId, periodStart) {
  const row = await one('SELECT count(*)::int AS n FROM projects WHERE user_id=$1 AND counted AND created_at >= $2', [userId, periodStart]);
  return row.n;
}

// Owner accounts are created here, never through public signup, so nobody
// else can register one of those addresses and inherit free access.
export async function seedOwners() {
  for (const email of OWNER_EMAILS) {
    const existing = await one('SELECT id FROM users WHERE email=$1', [email]);
    if (existing) {
      await query(`UPDATE users SET comp=TRUE, plan='elite', status='active' WHERE id=$1`, [existing.id]);
    } else if (OWNER_PASSWORD) {
      await query(
        `INSERT INTO users (id, email, name, password_hash, comp, plan, status) VALUES ($1,$2,$3,$4,TRUE,'elite','active')`,
        [crypto.randomUUID(), email, 'Owner', await hashPassword(OWNER_PASSWORD)],
      );
      console.log('[auth] owner account ready:', email);
    } else {
      console.warn(`[auth] set OWNER_PASSWORD to create the owner account for ${email}`);
    }
  }
}
