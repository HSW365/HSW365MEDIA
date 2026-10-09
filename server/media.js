// ffmpeg / ffprobe helpers.
import { spawn } from 'node:child_process';

function exec(cmd, args, { timeoutMs = 10 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}: ${err.trim().split('\n').slice(-3).join(' | ')}`));
    });
  });
}

export async function probe(file) {
  const raw = await exec('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { timeoutMs: 60000 });
  const info = JSON.parse(raw);
  const streams = info.streams || [];
  const video = streams.find((s) => s.codec_type === 'video' && s.disposition?.attached_pic !== 1);
  const audio = streams.find((s) => s.codec_type === 'audio');
  const duration = Number(info.format?.duration) || Number(video?.duration) || Number(audio?.duration) || 0;
  const frames = Number(video?.nb_frames) || 0;
  const formatName = info.format?.format_name || '';
  // Still images report as a single-frame "video" stream.
  const isImage = !!video && !audio && (/image2|_pipe|png|jpeg|webp|mjpeg/.test(formatName) || frames === 1 || duration < 0.1);
  return { duration, hasVideo: !!video, hasAudio: !!audio, isImage, width: video?.width || 0, height: video?.height || 0 };
}

const EVEN_FIT = "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";

export const toMp3 = (src, dest) =>
  exec('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vn', '-ac', '2', '-ar', '44100', '-b:a', '192k', dest]);

export const toJpeg = (src, dest) =>
  exec('ffmpeg', ['-y', '-v', 'error', '-i', src, '-frames:v', '1', '-vf', EVEN_FIT, '-q:v', '2', dest]);

// A short still clip of a photo; the engine loops it for the audio's length.
export const stillClip = (img, dest, seconds = 4) =>
  exec('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-i', img, '-t', String(seconds), '-r', '25', '-vf', EVEN_FIT,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', dest]);

// Normalise an uploaded video: H.264, 25fps, max 1280px, trimmed to the audio.
export const normalizeVideo = (src, dest, seconds) =>
  exec('ffmpeg', ['-y', '-v', 'error', '-i', src, '-t', String(seconds), '-r', '25', '-vf', EVEN_FIT,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', dest], { timeoutMs: 20 * 60 * 1000 });

export const thumbnail = (video, dest) =>
  exec('ffmpeg', ['-y', '-v', 'error', '-ss', '0.4', '-i', video, '-frames:v', '1',
    '-vf', "scale='min(640,iw)':-2", '-q:v', '4', dest]);

// Dev-only stand-in for the engine: loops the picture under the audio.
export const mockRender = (video, audio, dest, seconds) =>
  exec('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', video, '-i', audio, '-t', String(seconds),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', dest]);
