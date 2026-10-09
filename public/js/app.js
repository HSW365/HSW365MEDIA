import { api, $, esc, fmtDuration, fmtLimit, toast, renderPlans } from '/js/common.js';

const state = { me: null, plans: [], billingReady: false, projects: [], face: null, audio: null, audioDur: 0, busy: false };
const params = new URLSearchParams(location.search);
const sub = () => state.me.subscription;

// ---- boot ------------------------------------------------------------------
try { state.me = await api('/api/me'); } catch { location.replace('/login'); await new Promise(() => {}); }
{
  const cfg = await api('/api/config');
  state.plans = cfg.plans;
  state.billingReady = cfg.billingReady;
}

// ---- tabs ------------------------------------------------------------------
function go(tab) {
  for (const t of ['create', 'library', 'plan']) {
    $(`#tab-${t}`).hidden = t !== tab;
    $(`.tab[data-tab=${t}]`).setAttribute('aria-selected', String(t === tab));
  }
  window.scrollTo({ top: 0 });
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab],[data-go]');
  if (t) go(t.dataset.tab || t.dataset.go);
});

function banner(msg, kind = '') {
  const el = $('#banner');
  el.hidden = !msg;
  el.className = `alert ${kind}`;
  el.textContent = msg || '';
}

// ---- account / plan rendering ----------------------------------------------
const dateStr = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-');

function renderAccount() {
  const s = sub();
  $('#paywall').hidden = s.active;
  $('#studio').hidden = !s.active;
  $('#acctEmail').textContent = state.me.user.email;
  $('#portalBtn').hidden = !state.me.user.hasBilling;

  const pill = $('#usagePill');
  pill.hidden = !s.active;
  if (s.active) {
    const unlimited = s.limit === null;
    pill.innerHTML = unlimited ? `<b>${s.used}</b> projects this month` : `<b>${s.remaining}</b> of ${s.limit} projects left`;
    $('#meterNum').innerHTML = unlimited ? `${s.used}` : `${s.remaining}<small> / ${s.limit}</small>`;
    $('#meterLabel').textContent = unlimited ? 'Projects made, no monthly cap' : 'Projects left this month';
    $('#meterBarWrap').hidden = unlimited;
    if (!unlimited) $('#meterBar').style.width = `${Math.min(100, (s.used / s.limit) * 100)}%`;
    $('#kvPlan').textContent = s.planName;
    $('#kvMax').textContent = fmtLimit(s.maxSeconds);
    $('#kvReset').textContent = unlimited ? 'Never' : dateStr(s.resetsAt);
    $('#audioHint').textContent = `MP3, WAV or M4A, or record it here. Up to ${fmtLimit(s.maxSeconds)} on ${s.planName}.`;
    $('#planSummary').textContent = s.comp
      ? 'Owner access: every feature, no monthly cap, never billed.'
      : `You are on ${s.planName}: ${s.used} of ${s.limit} projects used. ${s.cancelAtPeriodEnd ? 'Ends' : 'Resets'} ${dateStr(s.resetsAt)}.`;
    const out = !unlimited && s.remaining === 0;
    $('#generate').disabled = out || state.busy;
    if (out) showCreateErr(`You have used all ${s.limit} projects this month. Your count resets ${dateStr(s.resetsAt)}, or upgrade on the Plan tab to keep creating now.`);
  } else {
    $('#planSummary').textContent = s.status === 'past_due'
      ? 'Your last payment did not go through. Update your card in Manage billing to keep creating.'
      : 'You do not have a plan yet. Pick one to start creating.';
  }

  const current = s.active && !s.comp ? s.plan : null;
  document.querySelectorAll('[data-plans]').forEach((el) => renderPlans(el, state.plans, (p) => {
    if (s.comp) return { label: 'Included', disabled: true };
    if (p.id === current) return { label: 'Current plan', disabled: true };
    return { label: current ? `Switch to ${p.name}` : `Choose ${p.name}` };
  }, current));
}

async function refreshMe() { state.me = await api('/api/me'); renderAccount(); }

async function pickPlan(planId) {
  const plan = state.plans.find((p) => p.id === planId);
  if (!plan) return;
  const s = sub();
  if (s.active && !s.comp && !confirm(`Switch to ${plan.name} at $${plan.price}/month? The change takes effect now and your card is adjusted for the difference.`)) return;
  try {
    const r = await api('/api/billing/subscribe', { method: 'POST', body: { plan: planId } });
    if (r.url) { location.href = r.url; return; }
    await refreshMe();
    toast(`You are now on ${plan.name}.`, 'good');
  } catch (e) { toast(e.message, 'bad'); }
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-plan]');
  if (b && !b.disabled) pickPlan(b.dataset.plan);
});

$('#portalBtn').addEventListener('click', async () => {
  try { location.href = (await api('/api/billing/portal', { method: 'POST' })).url; } catch (e) { toast(e.message, 'bad'); }
});
$('#signout').addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/'; });
$('#pwForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/auth/password', { method: 'POST', body: { current: $('#pwCur').value, next: $('#pwNew').value } });
    e.target.reset(); toast('Password updated.', 'good');
  } catch (ex) { toast(ex.message, 'bad'); }
});

// ---- inputs ----------------------------------------------------------------
function showCreateErr(msg) { const el = $('#createErr'); el.hidden = !msg; el.textContent = msg || ''; }

function clearDrop(kind) {
  const drop = $(`#${kind}Drop`);
  drop.querySelectorAll('.preview,.clear').forEach((n) => { n.querySelectorAll?.('video,audio').forEach((m) => m.pause()); n.remove(); });
  drop.classList.remove('filled');
  $(`#${kind}Input`).value = '';
  if (kind === 'face') state.face = null; else { state.audio = null; state.audioDur = 0; }
}

function addClear(drop, kind) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'clear'; b.textContent = 'Remove';
  b.addEventListener('click', () => { clearDrop(kind); showCreateErr(''); });
  drop.appendChild(b);
}

function setFace(file) {
  const isImg = file.type.startsWith('image/');
  const isVid = file.type.startsWith('video/');
  if (!isImg && !isVid) return showCreateErr('The face must be a photo (JPG, PNG, WEBP) or a video (MP4, MOV, WEBM).');
  if (file.size > 150 * 1024 * 1024) return showCreateErr('That file is too large (150 MB max).');
  clearDrop('face'); showCreateErr('');
  state.face = file;
  const drop = $('#faceDrop');
  const pv = document.createElement('div'); pv.className = 'preview';
  const url = URL.createObjectURL(file);
  pv.innerHTML = isImg ? `<img alt="Face preview" src="${url}">` : `<video src="${url}" muted loop autoplay playsinline></video>`;
  drop.appendChild(pv); addClear(drop, 'face'); drop.classList.add('filled');
}

function setAudio(file, label) {
  if (file.size > 40 * 1024 * 1024) return showCreateErr('Audio file is too large (40 MB max).');
  clearDrop('audio'); showCreateErr('');
  state.audio = file;
  const drop = $('#audioDrop');
  const pv = document.createElement('div'); pv.className = 'preview audio';
  const url = URL.createObjectURL(file);
  pv.innerHTML = `<span class="mono">Voice</span><div class="dur">--:--</div><div class="name">${esc(label || file.name)}</div><audio controls src="${url}"></audio>`;
  drop.appendChild(pv); addClear(drop, 'audio'); drop.classList.add('filled');
  const a = pv.querySelector('audio');
  const apply = () => {
    if (!Number.isFinite(a.duration)) return;
    state.audioDur = a.duration;
    pv.querySelector('.dur').textContent = fmtDuration(a.duration);
    const max = sub().maxSeconds;
    if (max && a.duration > max + 0.5) showCreateErr(`This audio is ${fmtDuration(a.duration)}. ${sub().planName} covers up to ${fmtLimit(max)} per project. Trim it or upgrade on the Plan tab.`);
  };
  a.addEventListener('loadedmetadata', () => {
    // Browser recordings report Infinity until the element is seeked to the end.
    if (a.duration === Infinity) { a.currentTime = 1e7; a.addEventListener('timeupdate', () => { a.currentTime = 0; apply(); }, { once: true }); }
    else apply();
  });
}

for (const kind of ['face', 'audio']) {
  const drop = $(`#${kind}Drop`);
  const input = $(`#${kind}Input`);
  const set = kind === 'face' ? setFace : setAudio;
  drop.querySelector(`[data-pick=${kind}]`).addEventListener('click', () => input.click());
  input.addEventListener('change', () => input.files[0] && set(input.files[0]));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) set(f); });
}

// mic recording
let recorder = null;
$('#recBtn').addEventListener('click', async () => {
  const btn = $('#recBtn');
  if (recorder) { recorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast('Recording is not supported in this browser. Upload a file instead.', 'bad');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { return toast('Microphone access was blocked. Allow it in your browser, or upload a file.', 'bad'); }
  const chunks = [];
  recorder = new MediaRecorder(stream);
  const started = Date.now();
  const max = (sub().maxSeconds || 60) * 1000;
  const tick = setInterval(() => {
    btn.textContent = `Stop ${fmtDuration((Date.now() - started) / 1000)}`;
    if (Date.now() - started >= max) recorder?.stop();
  }, 250);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    clearInterval(tick);
    stream.getTracks().forEach((t) => t.stop());
    const type = recorder.mimeType || 'audio/webm';
    recorder = null;
    btn.textContent = 'Record'; btn.classList.remove('recording');
    const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
    if (chunks.length) setAudio(new File(chunks, `recording.${ext}`, { type }), 'Mic recording');
  };
  recorder.start();
  btn.classList.add('recording'); btn.textContent = 'Stop 0:00';
});

// ---- create ----------------------------------------------------------------
$('#generate').addEventListener('click', async () => {
  if (state.busy) return;
  const s = sub();
  if (!state.face) return showCreateErr('Add a face first: a photo or a video.');
  if (!state.audio) return showCreateErr('Add the voice: upload an audio file or record one.');
  if (state.audioDur && state.audioDur > s.maxSeconds + 0.5) return showCreateErr(`This audio is ${fmtDuration(state.audioDur)}. ${s.planName} covers up to ${fmtLimit(s.maxSeconds)} per project.`);
  if (!$('#rights').checked) return showCreateErr('Confirm you have the rights to this face and voice.');
  showCreateErr('');
  const btn = $('#generate');
  state.busy = true; btn.disabled = true; btn.textContent = 'Uploading...';
  try {
    const form = new FormData();
    form.append('title', $('#title').value);
    form.append('rights', 'true');
    form.append('face', state.face);
    form.append('audio', state.audio, state.audio.name);
    const { project } = await api('/api/projects', { method: 'POST', form });
    state.projects.unshift(project);
    clearDrop('face'); clearDrop('audio'); $('#title').value = ''; $('#rights').checked = false;
    renderLibrary(); go('library'); schedulePoll();
    toast('Rendering started. This usually takes a few minutes.', 'good');
  } catch (e) {
    showCreateErr(e.message);
    if (e.code === 'no_plan') go('plan');
  } finally {
    state.busy = false; btn.textContent = 'Generate lip sync';
    await refreshMe().catch(() => {});
  }
});

// ---- library ---------------------------------------------------------------
const pending = (p) => p.status === 'queued' || p.status === 'processing';
const STAGE = { queued: 'In the queue', preparing: 'Preparing', rendering: 'Syncing the take' };

function card(p) {
  let thumb;
  if (p.status === 'done') {
    thumb = `<button class="thumb" data-play="${p.id}" aria-label="Play ${esc(p.title)}">${p.thumbUrl ? `<img alt="" loading="lazy" src="${p.thumbUrl}">` : ''}<span class="play"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>`;
  } else if (p.status === 'failed') {
    thumb = `<div class="thumb"><div class="status failed">Did not render<span style="color:var(--mute);letter-spacing:.06em">Not counted</span></div></div>`;
  } else {
    thumb = `<div class="thumb"><div class="status"><span class="spin"></span>${STAGE[p.stage] || STAGE[p.status] || 'Working'}</div></div>`;
  }
  const actions = p.status === 'done'
    ? `<a class="btn btn-primary btn-sm" href="${p.videoUrl}?download=1">Download</a><button class="btn btn-ghost btn-sm" data-del="${p.id}">Delete</button>`
    : p.status === 'failed' ? `<button class="btn btn-ghost btn-sm" data-del="${p.id}">Remove</button>` : '';
  return `<article class="proj">${thumb}<div class="body">
    <h3 title="${esc(p.title)}">${esc(p.title)}</h3>
    <div class="meta mono"><span>${fmtDuration(p.duration)}</span><span>${new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>
    ${p.status === 'failed' && p.error ? `<p class="err">${esc(p.error)}</p>` : ''}
    ${actions ? `<div class="row">${actions}</div>` : ''}
  </div></article>`;
}

function renderLibrary() {
  $('#grid').innerHTML = state.projects.map(card).join('');
  $('#empty').hidden = state.projects.length > 0;
  $('#grid').hidden = state.projects.length === 0;
}

let pollTimer = null;
function schedulePoll() {
  clearTimeout(pollTimer);
  if (!state.projects.some(pending)) return;
  pollTimer = setTimeout(async () => {
    try {
      const before = state.projects.filter(pending).length;
      const sig = JSON.stringify(state.projects.map((p) => [p.id, p.status, p.stage]));
      state.projects = (await api('/api/projects')).projects;
      if (sig !== JSON.stringify(state.projects.map((p) => [p.id, p.status, p.stage]))) renderLibrary();
      if (state.projects.filter(pending).length < before) refreshMe().catch(() => {});
    } catch { /* keep polling through blips */ }
    schedulePoll();
  }, 3500);
}

const modal = $('#modal');
const player = $('#player');
function closePlayer() { player.pause(); player.removeAttribute('src'); player.load(); modal.hidden = true; }
$('#playerClose').addEventListener('click', closePlayer);
modal.addEventListener('click', (e) => { if (e.target === modal) closePlayer(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closePlayer(); });

$('#grid').addEventListener('click', async (e) => {
  const play = e.target.closest('[data-play]');
  const del = e.target.closest('[data-del]');
  if (play) {
    const p = state.projects.find((x) => x.id === play.dataset.play);
    player.src = p.videoUrl; $('#playerTitle').textContent = p.title;
    $('#playerMeta').textContent = `${fmtDuration(p.duration)} / MP4`;
    $('#playerDl').href = `${p.videoUrl}?download=1`;
    modal.hidden = false; player.play().catch(() => {});
  } else if (del) {
    const p = state.projects.find((x) => x.id === del.dataset.del);
    if (p.status === 'done' && !confirm(`Delete "${p.title}"? This removes the video for good. It does not give back a project for this month.`)) return;
    try {
      await api(`/api/projects/${p.id}`, { method: 'DELETE' });
      state.projects = state.projects.filter((x) => x.id !== p.id); renderLibrary();
    } catch (ex) { toast(ex.message, 'bad'); }
  }
});

// ---- first paint + return from checkout -------------------------------------
renderAccount();
state.projects = (await api('/api/projects')).projects;
renderLibrary(); schedulePoll();
if (params.get('tab')) go(params.get('tab'));

if (params.get('checkout') === 'success') {
  history.replaceState(null, '', '/app');
  banner('Confirming your subscription...', 'ok');
  for (let i = 0; i < 8 && !sub().active; i++) {
    try { state.me = await api('/api/billing/sync', { method: 'POST' }); } catch { /* retry */ }
    if (!sub().active) await new Promise((r) => setTimeout(r, 1500));
  }
  renderAccount();
  if (sub().active) { banner(`You are in. ${sub().planName} is active: ${sub().limit} projects a month.`, 'ok'); go('create'); }
  else banner('Payment received, but your plan is still activating. Refresh in a moment, or email hsw365media@gmail.com if it does not appear.', 'warn');
} else if (params.get('plan') && !sub().active && state.plans.some((p) => p.id === params.get('plan'))) {
  // Came from the pricing page with a plan picked: go straight to checkout.
  history.replaceState(null, '', '/app?tab=plan');
  if (state.billingReady) pickPlan(params.get('plan'));
}
