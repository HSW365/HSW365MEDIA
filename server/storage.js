// File storage behind one small interface: local disk by default, Supabase
// Storage when SUPABASE_URL + SUPABASE_SERVICE_KEY are set (use that on hosts
// with an ephemeral disk such as Render's free tier).
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { query, one, usingExternalDb } from './db.js';
import { DATA_DIR, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET } from './config.js';

const remote = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
// Without a bucket but with a real database, finished videos and thumbnails
// are kept in the database so they survive restarts on hosts with no disk.
// Uploaded inputs are short-lived and stay on local disk.
const inDb = (key) => !remote && usingExternalDb && !/\/(source|audio)$/.test(key);
const filesDir = path.join(DATA_DIR, 'files');
export const tmpDir = path.join(DATA_DIR, 'tmp');
fs.mkdirSync(filesDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

const headers = () => ({ Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, apikey: SUPABASE_SERVICE_KEY });
const objectUrl = (key) => `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;
const localPath = (key) => {
  const p = path.join(filesDir, key);
  if (!p.startsWith(filesDir + path.sep)) throw new Error('bad storage key');
  return p;
};

export async function initStorage() {
  if (!remote) return console.log(usingExternalDb ? '[storage] finished videos in database, uploads on local disk' : `[storage] local disk at ${filesDir}`);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: SUPABASE_BUCKET, name: SUPABASE_BUCKET, public: false }),
  });
  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    if (!/already exists|Duplicate/i.test(body)) console.error('[storage] bucket check failed:', res.status, body);
  }
  console.log('[storage] Supabase bucket', SUPABASE_BUCKET);
}

export async function putFile(key, srcPath, contentType) {
  if (inDb(key)) {
    const data = await fs.promises.readFile(srcPath);
    await query(`INSERT INTO files (key, content_type, size, data) VALUES ($1,$2,$3,$4)
      ON CONFLICT (key) DO UPDATE SET content_type=EXCLUDED.content_type, size=EXCLUDED.size, data=EXCLUDED.data`, [key, contentType, data.length, data]);
    return;
  }
  if (!remote) {
    const dest = localPath(key);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(srcPath, dest);
    return;
  }
  const { size } = await fs.promises.stat(srcPath);
  const res = await fetch(objectUrl(key), {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': contentType, 'Content-Length': String(size), 'x-upsert': 'true' },
    body: Readable.toWeb(fs.createReadStream(srcPath)),
    duplex: 'half',
  });
  if (!res.ok) throw new Error(`storage upload failed (${res.status}): ${await res.text()}`);
}

export async function getToFile(key, destPath) {
  if (inDb(key)) {
    const row = await one('SELECT data FROM files WHERE key=$1', [key]);
    if (!row) throw new Error('file not found');
    return fs.promises.writeFile(destPath, row.data);
  }
  if (!remote) return fs.promises.copyFile(localPath(key), destPath);
  const res = await fetch(objectUrl(key), { headers: headers() });
  if (!res.ok) throw new Error(`storage download failed (${res.status})`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(destPath));
}

export async function removeFiles(keys) {
  const list = keys.filter(Boolean);
  if (!list.length) return;
  const dbKeys = list.filter(inDb);
  if (dbKeys.length) await query('DELETE FROM files WHERE key = ANY($1)', [dbKeys]);
  if (!remote) {
    await Promise.all(list.map((k) => fs.promises.rm(localPath(k), { force: true })));
    return;
  }
  await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}`, {
    method: 'DELETE',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: list }),
  }).catch((e) => console.error('[storage] delete failed', e.message));
}

// Stream a stored file to an HTTP response with Range support (video seeking).
export async function sendFile(req, res, key, { contentType, downloadName } = {}) {
  if (downloadName) res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  if (inDb(key)) {
    const meta = await one('SELECT size, content_type FROM files WHERE key=$1', [key]);
    if (!meta) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Type', contentType || meta.content_type);
    res.setHeader('Accept-Ranges', 'bytes');
    let start = 0;
    let end = meta.size - 1;
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      if (m[1]) { start = Number(m[1]); if (m[2]) end = Math.min(end, Number(m[2])); }
      else start = Math.max(0, meta.size - Number(m[2]));
      if (start > end || start >= meta.size) return res.status(416).setHeader('Content-Range', `bytes */${meta.size}`).end();
      end = Math.min(end, start + 4 * 1024 * 1024 - 1); // serve ranges in 4 MB pieces
      res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${meta.size}`);
    }
    const row = await one('SELECT substring(data FROM $2::int FOR $3::int) AS chunk FROM files WHERE key=$1', [key, start + 1, end - start + 1]);
    res.setHeader('Content-Length', row.chunk.length);
    return res.end(row.chunk);
  }
  if (!remote) {
    const p = localPath(key);
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'File not found' });
    if (contentType) res.type(contentType);
    return res.sendFile(p);
  }
  const h = headers();
  if (req.headers.range) h.Range = req.headers.range;
  const up = await fetch(objectUrl(key), { headers: h });
  if (!up.ok && up.status !== 206) return res.status(404).json({ error: 'File not found' });
  res.status(up.status);
  for (const name of ['content-length', 'content-range', 'accept-ranges']) {
    const v = up.headers.get(name);
    if (v) res.setHeader(name, v);
  }
  res.setHeader('Content-Type', contentType || up.headers.get('content-type') || 'application/octet-stream');
  if (!up.headers.get('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
  await pipeline(Readable.fromWeb(up.body), res).catch(() => {});
}
