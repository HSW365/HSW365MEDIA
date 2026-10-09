// Platform secrets the owner can enter from the app instead of a hosting
// dashboard. Stored encrypted (AES-256-GCM, key derived from JWT_SECRET).
// An environment variable of the same name always wins.
import crypto from 'node:crypto';
import { query } from './db.js';
import { JWT_SECRET } from './config.js';

const KEY = crypto.scryptSync(JWT_SECRET, 'sync365-settings', 32);
const cache = new Map();

function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const body = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64');
}
function open(blob) {
  const raw = Buffer.from(blob, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
}

export async function loadSettings() {
  for (const row of await query('SELECT key, value FROM settings')) {
    try { cache.set(row.key, open(row.value)); } catch { console.warn('[settings] could not decrypt', row.key); }
  }
}

export const setting = (name) => process.env[name] || cache.get(name) || '';

export async function saveSetting(name, value) {
  cache.set(name, value);
  await query(
    `INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
    [name, seal(value)],
  );
}
