// Render queue. State lives in the database, so a restart resumes cleanly:
// queued projects get picked up again and in-flight renders keep being polled.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { query, one } from './db.js';
import { tmpDir, getToFile, putFile, removeFiles } from './storage.js';
import { probe, toMp3, toJpeg, stillClip, normalizeVideo, thumbnail } from './media.js';
import { pickModel, estimateCost, submit, check, engineReady } from './engine.js';
import { LIMITS } from './config.js';

let busy = false;

const workDir = (id) => path.join(tmpDir, `job-${id}`);
const cleanup = (id) => fs.promises.rm(workDir(id), { recursive: true, force: true }).catch(() => {});

function friendly(message = '') {
  const m = String(message);
  if (/face/i.test(m)) return 'We could not find a clear face in your source. Use a front-facing shot with the whole face visible and good light.';
  if (/not configured|unauthorized|forbidden|credential|balance|exhausted|locked|quota/i.test(m)) return 'Rendering is temporarily unavailable. Please try again shortly.';
  if (/timed out/i.test(m)) return 'This render took too long and was stopped.';
  return 'The render did not complete. Try a clearer face shot or a different audio file.';
}

async function fail(p, err) {
  console.error(`[worker] project ${p.id} failed:`, err?.message || err);
  // A failed render never costs the customer one of their monthly projects.
  await query(
    `UPDATE projects SET status='failed', stage=NULL, counted=FALSE, error=$2, completed_at=now() WHERE id=$1`,
    [p.id, friendly(err?.message || err)],
  );
  await removeFiles([p.source_key, p.audio_key]);
  await cleanup(p.id);
}

async function finalize(p, resultPath) {
  const dir = workDir(p.id);
  const thumb = path.join(dir, 'thumb.jpg');
  const info = await probe(resultPath);
  if (!info.hasVideo) throw new Error('engine output has no video stream');
  await thumbnail(resultPath, thumb).catch(() => {});
  const outKey = `${p.user_id}/${p.id}/output.mp4`;
  const thumbKey = fs.existsSync(thumb) ? `${p.user_id}/${p.id}/thumb.jpg` : null;
  await putFile(outKey, resultPath, 'video/mp4');
  if (thumbKey) await putFile(thumbKey, thumb, 'image/jpeg');
  await query(
    `UPDATE projects SET status='done', stage=NULL, output_key=$2, thumb_key=$3, duration_sec=$4,
       source_key=NULL, audio_key=NULL, completed_at=now() WHERE id=$1`,
    [p.id, outKey, thumbKey, info.duration || p.duration_sec],
  );
  await removeFiles([p.source_key, p.audio_key]);
  await cleanup(p.id);
  console.log(`[worker] project ${p.id} done`);
}

async function start(p) {
  const dir = workDir(p.id);
  await fs.promises.mkdir(dir, { recursive: true });
  await query(`UPDATE projects SET status='processing', stage='preparing', started_at=now() WHERE id=$1`, [p.id]);

  const rawSource = path.join(dir, 'source.raw');
  const rawAudio = path.join(dir, 'audio.raw');
  await Promise.all([getToFile(p.source_key, rawSource), getToFile(p.audio_key, rawAudio)]);

  const audio = path.join(dir, 'audio.mp3');
  await toMp3(rawAudio, audio);
  const seconds = Math.max(LIMITS.minSeconds, (await probe(audio)).duration || p.duration_sec);

  const { model, input } = pickModel(p.source_kind, p.plan);
  let visual;
  if (p.source_kind === 'image') {
    const jpg = path.join(dir, 'face.jpg');
    await toJpeg(rawSource, jpg);
    if (input === 'image') visual = jpg;
    else { visual = path.join(dir, 'face.mp4'); await stillClip(jpg, visual); }
  } else {
    visual = path.join(dir, 'source.mp4');
    await normalizeVideo(rawSource, visual, seconds);
  }

  const outPath = path.join(dir, 'result.mp4');
  const job = await submit({ model, input, visualPath: visual, audioPath: audio, seconds, outPath });
  await query(
    `UPDATE projects SET stage='rendering', engine_model=$2, engine_request_id=$3, cost_est=$4 WHERE id=$1`,
    [p.id, model, job.requestId || null, estimateCost(model, seconds)],
  );
  if (job.localResult) await finalize(p, job.localResult);
}

async function poll(p) {
  if (Date.now() - new Date(p.started_at).getTime() > LIMITS.jobTimeoutMs) return fail(p, new Error('render timed out'));
  const r = await check(p.engine_model, p.engine_request_id);
  if (r.state === 'pending') return;
  if (r.state === 'failed') return fail(p, new Error(r.error));
  const dir = workDir(p.id);
  await fs.promises.mkdir(dir, { recursive: true });
  const out = path.join(dir, 'result.mp4');
  const res = await fetch(r.url);
  if (!res.ok) throw new Error(`could not download engine output (${res.status})`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(out));
  await finalize(p, out);
}

async function tick() {
  if (busy || !engineReady()) return;
  busy = true;
  try {
    const rendering = await query(`SELECT * FROM projects WHERE status='processing' AND engine_request_id IS NOT NULL ORDER BY started_at`);
    for (const p of rendering) await poll(p).catch((e) => fail(p, e));

    // Higher tiers render first; within a tier it is first come, first served.
    const next = await one(
      `SELECT p.*, CASE WHEN u.comp THEN 'elite' ELSE u.plan END AS plan
         FROM projects p JOIN users u ON u.id = p.user_id
        WHERE p.status='queued' ORDER BY p.priority DESC, p.created_at ASC LIMIT 1`,
    );
    if (next) await start(next).catch((e) => fail(next, e));
  } catch (e) {
    console.error('[worker] tick error', e.message);
  } finally {
    busy = false;
  }
}

export async function startWorker() {
  // Anything interrupted mid-prepare by a restart goes back in the queue.
  await query(`UPDATE projects SET status='queued', stage=NULL WHERE status='processing' AND engine_request_id IS NULL`);
  setInterval(tick, 3000).unref();
  tick();
}
