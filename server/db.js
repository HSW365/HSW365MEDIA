// Postgres in production (Supabase / Render / any DATABASE_URL).
// With no DATABASE_URL it runs an embedded Postgres (PGlite) on disk so the
// app boots with zero setup. Same SQL either way.
import fs from 'node:fs';
import path from 'node:path';
import { DATABASE_URL, DATA_DIR } from './config.js';

let run;
let shutdown = async () => {};

if (DATABASE_URL) {
  const { default: pg } = await import('pg');
  const local = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5, ssl: local ? false : { rejectUnauthorized: false } });
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
];

export async function migrate() {
  for (const stmt of SCHEMA) await run(stmt, []);
}
