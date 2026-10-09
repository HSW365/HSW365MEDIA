// Lip sync engine adapter. Production runs on fal.ai (one key, many models).
// LIPSYNC_ENGINE=mock is a development stand-in that never runs in production.
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE, FAL_KEY, FAL_MODEL_VIDEO, FAL_MODEL_PHOTO, FAL_PHOTO_PLANS, FAL_PHOTO_RESOLUTION, IS_PROD } from './config.js';
import { mockRender } from './media.js';

let fal = null;
if (ENGINE === 'fal') {
  ({ fal } = await import('@fal-ai/client'));
  fal.config({ credentials: FAL_KEY });
}
if (ENGINE === 'mock' && IS_PROD) throw new Error('LIPSYNC_ENGINE=mock is not allowed in production');

export const engineReady = () => ENGINE === 'fal' || ENGINE === 'mock';
export const engineName = () => ENGINE;

// Photo sources go to the premium photo model only for plans that include it.
export function pickModel(sourceKind, plan) {
  if (sourceKind === 'image' && FAL_MODEL_PHOTO && FAL_PHOTO_PLANS.includes(plan)) return { model: FAL_MODEL_PHOTO, input: 'image' };
  return { model: FAL_MODEL_VIDEO, input: 'video' };
}

// What a render costs the platform, from the engines' published rates.
export function estimateCost(model, seconds) {
  if (ENGINE !== 'fal') return 0;
  if (model.includes('fabric')) return +(seconds * (FAL_PHOTO_RESOLUTION === '720p' ? 0.15 : 0.08)).toFixed(3);
  if (model.includes('latentsync')) return +(0.2 + Math.max(0, seconds - 40) * 0.005).toFixed(3);
  return null;
}

async function upload(file, type) {
  const blob = await fs.openAsBlob(file, { type });
  return fal.storage.upload(new File([blob], path.basename(file), { type }));
}

// -> { requestId } for an async render, or { localResult } when already done.
export async function submit({ model, input, visualPath, audioPath, seconds, outPath }) {
  if (ENGINE === 'mock') {
    await mockRender(visualPath, audioPath, outPath, seconds);
    return { localResult: outPath };
  }
  if (ENGINE !== 'fal') throw new Error('Lip sync engine is not configured (set FAL_KEY).');
  const [visualUrl, audioUrl] = await Promise.all([
    upload(visualPath, input === 'image' ? 'image/jpeg' : 'video/mp4'),
    upload(audioPath, 'audio/mpeg'),
  ]);
  const payload = input === 'image'
    ? { image_url: visualUrl, audio_url: audioUrl, resolution: FAL_PHOTO_RESOLUTION }
    : { video_url: visualUrl, audio_url: audioUrl, ...(model.includes('latentsync') ? { loop_mode: 'loop' } : {}) };
  const { request_id: requestId } = await fal.queue.submit(model, { input: payload });
  return { requestId };
}

// -> { state: 'pending' } | { state: 'done', url } | { state: 'failed', error }
export async function check(model, requestId) {
  try {
    const status = await fal.queue.status(model, { requestId, logs: false });
    if (status.status !== 'COMPLETED') return { state: 'pending' };
    const result = await fal.queue.result(model, { requestId });
    const url = result?.data?.video?.url;
    return url ? { state: 'done', url } : { state: 'failed', error: 'The engine returned no video.' };
  } catch (e) {
    const status = e?.status;
    // Network blips and 5xx are retried on the next tick; 4xx is a real failure.
    if (!status || status >= 500) return { state: 'pending', transient: e?.message };
    const detail = e?.body?.detail;
    const msg = Array.isArray(detail) ? detail.map((d) => d.msg).join('; ') : (typeof detail === 'string' ? detail : e.message);
    return { state: 'failed', error: msg || 'The engine rejected this render.' };
  }
}
