// Postgres in production (Supabase / Render / any DATABASE_URL).
// With no DATABASE_URL it runs an embedded Postgres (PGlite) on disk so the
// app boots with zero setup. Same SQL either way.
import fs from 'node:fs';
import path from 'node:path';
import { DATABASE_URL, DATA_DIR, DB_SCHEMA } from './config.js';

let run;
let shutdown = async () => {};

if (DATABASE_URL) {
  const { default: pg } = await import('pg');
  let pool = null;
  // Try each candidate connection string until one answers.
  for (const url of DATABASE_URL.split('|').map((u) => u.trim()).filter(Boolean)) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    const candidate = new pg.Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 10000, ssl: local ? false : { rejectUnauthorized: false } });
    if (DB_SCHEMA) candidate.on('connect', (c) => { c.query(`SET search_path TO "${DB_SCHEMA.replace(/"/g, '')}"`).catch(() => {}); });
    try {
      await candidate.query('SELECT 1');
      pool = candidate;
      console.log('[db] connected to', new URL(url).host);
      break;
    } catch (e) {
      console.warn('[db] could not reach', new URL(url).host, '-', e.message);
      await candidate.end().catch(() => {});
    }
  }
  if (!pool) throw new Error('No database connection could be established');
  pool.on('error', (e) => console.error('[db] pool error', e.message));
  run = async (text, params) => (await pool.query(text, params)).rows;
  shutdown = () => pool.end();
} else {
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.join(DATA_DIR, 'pgdata');
  fs.mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  run = async (text, params) => (await db.query(text, params)).rows;
  shutdown = () => db.close();
  console.log('[db] using embedded Postgres at', dir);
}

export const usingExternalDb = !!DATABASE_URL;
export const closeDb = () => shutdown();
export const query = (text, params = []) => run(text, params);
export const one = async (text, params = []) => (await run(text, params))[0] || null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    plan TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    comp BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    source_key TEXT,
    audio_key TEXT,
    output_key TEXT,
    thumb_key TEXT,
    duration_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'queued',
    stage TEXT,
    error TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    counted BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    engine_model TEXT,
    engine_request_id TEXT,
    cost_est DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS projects_user_created ON projects (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS projects_status ON projects (status)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS files (key TEXT PRIMARY KEY, content_type TEXT NOT NULL, size INTEGER NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
];

export async function migrate() {
  for (const stmt of SCHEMA) await run(stmt, []);
}
