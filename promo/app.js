/* HSW365 PROMO ENGINE
   AI marketing co-founder for every HSW365 app: brief, audience, competitors,
   site audit, action plan, multi-platform content, calendar, autopilot for all
   apps, UTM links, dashboard, catches, virality — and a memory that keeps
   everything it creates (local + optional sync to the HSW365 clone-agent). */
(() => {
"use strict";

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const enc = encodeURIComponent;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const fmtDay = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const num = (n) => Number(n || 0).toLocaleString();

const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  radar: '<path d="M19.1 4.9A10 10 0 1 0 22 12"/><path d="M16.2 7.8A6 6 0 1 0 18 12"/><circle cx="12" cy="12" r="2"/><path d="m13.4 10.6 6-6"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-2 0-4-2-7-2 4-4 7-4 11 0 5 3 9 7 9z"/>',
  brain: '<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 4z"/><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="m6 4 14 8-14 8z"/>',
  pause: '<path d="M7 4v16M17 4v16"/>',
  down: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>',
  up: '<path d="M12 21V9m0 0-4 4m4-4 4 4M4 3h16"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  dup: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V4h12"/>'
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24">${I[n] || ""}</svg>`;

/* ---------- platforms ---------- */
const PF = {
  instagram: { name: "Instagram", s: "IG", c: "#e1306c", limit: 2200, open: () => "https://www.instagram.com/",
    guide: "Hook in the first line (it shows before 'more'). Short punchy lines with breaks. One CTA (link in bio). End with 5-8 specific, relevant hashtags." },
  tiktok: { name: "TikTok", s: "TT", c: "#22d3ee", limit: 2200, open: () => "https://www.tiktok.com/upload",
    guide: "1-3 line caption that adds to the video, not repeats it. Curiosity or a question to drive comments. 3-5 relevant hashtags." },
  youtube: { name: "YouTube Shorts", s: "YT", c: "#ef4444", limit: 5000, title: 100, titleLabel: "Title", open: () => "https://studio.youtube.com/",
    guide: "title: curiosity-driven, under 70 characters. text: 2-4 line description with the link and 3 hashtags including #shorts." },
  x: { name: "X", s: "X", c: "#f2f2fa", limit: 280, open: (t) => `https://twitter.com/intent/tweet?text=${enc(t)}`,
    guide: "Under 270 characters total including the link. Sharp, opinionated, zero or one hashtag." },
  threads: { name: "Threads", s: "TH", c: "#c9c9da", limit: 500, open: (t) => `https://www.threads.net/intent/post?text=${enc(t)}`,
    guide: "Conversational, under 450 characters, ends with a question or the link." },
  facebook: { name: "Facebook", s: "FB", c: "#3b82f6", limit: 2000, open: (t, u) => u && /^https?:/.test(u) ? `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` : "https://www.facebook.com/",
    guide: "Story-driven, 80-180 words, plain language, link and clear CTA at the end." },
  linkedin: { name: "LinkedIn", s: "IN", c: "#0ea5e9", limit: 3000, open: (t) => `https://www.linkedin.com/feed/?shareActive=true&text=${enc(t)}`,
    guide: "Founder voice, 120-220 words, short lines, a lesson or behind-the-build insight, link at the end, max 3 hashtags." },
  reddit: { name: "Reddit", s: "RD", c: "#f97316", limit: 40000, title: 300, titleLabel: "Title", open: (t, u, ti) => `https://www.reddit.com/submit?type=TEXT&title=${enc(ti || "")}&text=${enc(t)}`,
    guide: "title: plain and honest, no hype. text: value first, openly say you are the founder, ask for feedback, link once near the end." },
  email: { name: "Email", s: "EM", c: "#fbbf24", limit: 5000, title: 120, titleLabel: "Subject", open: (t, u, ti) => `mailto:?subject=${enc(ti || "")}&body=${enc(t)}`,
    guide: "title is the subject line (under 60 characters, curiosity, no clickbait). text: plain-text email 80-150 words, personal tone, one link CTA, sign off as Elvin, HSW365 Media." }
};
const PF_KEYS = Object.keys(PF);
const pfBadge = (k) => `<span class="pf" style="background:${PF[k].c}" title="${PF[k].name}">${PF[k].s}</span>`;

const GOALS = ["Signups", "Sales", "Followers", "Awareness", "DM leads", "Launch hype"];
const FORMATS = ["Talking-head video", "Faceless b-roll video", "Screen-recording demo", "Carousel", "Text post", "Meme / skit", "Founder story"];
const TONES = ["Real & direct", "Hype", "Motivational", "Educational", "Funny", "Storytelling"];

/* ---------- state ---------- */
const KEY = "hsw365.promo.v1";
const defaults = () => ({
  v: 1,
  settings: {
    provider: "gemini", geminiKey: "", geminiModel: "gemini-flash-latest",
    groqKey: "", groqModel: "llama-3.3-70b-versatile",
    allowEmoji: false, autoUtm: true, rateDelay: 6500,
    cloneUrl: "https://clone-agent.onrender.com", cloneToken: "", cloneSync: false
  },
  products: [], activeId: null, posts: [], links: [], tasks: [], catches: [], log: [],
  draft: null,
  auto: null
});
let state;
function load() {
  try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch { state = defaults(); }
  state.settings = Object.assign(defaults().settings, state.settings || {});
  const have = new Set(state.products.map((p) => p.slug));
  for (const a of window.HSW365_APPS || []) {
    if (!have.has(a.slug)) state.products.push(Object.assign({ id: uid(), brief: {}, createdAt: new Date().toISOString() }, a));
  }
  if (!state.products.find((p) => p.id === state.activeId)) state.activeId = state.products[0]?.id || null;
  if (state.auto && state.auto.running) state.auto.running = false;
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(saveNow, 250);
}
function saveNow() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast("Browser storage is full. Export a backup in Memory, then clear old posts.", true); }
}
const ui = { step: 1, angles: null, postFilter: { app: "all", status: "all", pf: "all" }, cal: new Date(), memFilter: "all", vir: null, busy: {} };

const prod = (id) => state.products.find((p) => p.id === (id || state.activeId));
const prodBySlug = (s) => state.products.find((p) => p.slug === s);
const slugify = (s) => String(s || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "app";

/* ---------- memory (remembers everything created) ---------- */
function remember(type, title, ref, productId) {
  const p = prod(productId);
  state.log.unshift({ id: uid(), t: new Date().toISOString(), type, title, ref: ref || null, slug: p?.slug || null, synced: false });
  if (state.log.length > 5000) state.log.length = 5000;
  save();
  if (state.settings.cloneSync) flushSync();
}
function memoryContent(e) {
  const p = prodBySlug(e.slug);
  const head = p ? `App: ${p.name}${p.url ? " (" + p.url + ")" : ""}\n` : "";
  if (e.type === "post") {
    const post = state.posts.find((x) => x.id === e.ref);
    if (post) return head + postAsText(post);
  }
  if (e.type === "link") { const l = state.links.find((x) => x.id === e.ref); if (l) return head + `UTM link (${l.label || "untitled"}): ${l.full}`; }
  if (e.type === "task") { const t = state.tasks.find((x) => x.id === e.ref); if (t) return head + `Task: ${t.text}`; }
  if (["brief", "audience", "competitors", "audit", "plan"].includes(e.type) && p) {
    const d = e.type === "brief" ? { tagline: p.tagline, description: p.description, audience: p.audience, offer: p.offer, ...p.brief } : p[e.type];
    return head + JSON.stringify(d || {}, null, 1).slice(0, 12000);
  }
  if (e.type === "catches") return head + JSON.stringify(state.catches.filter((c) => c.productId === p?.id).slice(0, 12), null, 1).slice(0, 12000);
  return head + e.title;
}
let syncing = false;
async function flushSync(force) {
  const s = state.settings;
  if (syncing || (!s.cloneSync && !force) || !s.cloneUrl) return;
  syncing = true;
  try {
    const pending = state.log.filter((e) => !e.synced).reverse().slice(0, force ? 1000 : 25);
    for (const e of pending) {
      const r = await fetch(s.cloneUrl.replace(/\/$/, "") + "/remember", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, s.cloneToken ? { Authorization: "Bearer " + s.cloneToken } : {}),
        body: JSON.stringify({
          title: e.title.slice(0, 240), content: memoryContent(e), category: "promo-engine",
          tags: ["hsw365-promo", e.type, e.slug].filter(Boolean), source: "hsw365-promo-engine",
          projectSlug: e.slug || undefined, entityType: "promo_" + e.type, importance: e.type === "post" ? 2 : 3,
          status: "open", metadata: { ref: e.ref, createdAt: e.t }
        })
      });
      if (!r.ok) throw new Error("Clone agent returned " + r.status);
      e.synced = true;
    }
    save();
  } catch (err) {
    if (force) toast("Memory sync failed: " + err.message, true);
  } finally { syncing = false; updateTop(); }
}

/* ---------- AI ---------- */
const BANNED = "unlock, elevate, game-changer, game changer, revolutionize, seamless, seamlessly, leverage, dive in, delve, in today's fast-paced world, look no further, supercharge, take it to the next level, transform your, cutting-edge, empower, harness, embark, tapestry, landscape";
function systemPrompt() {
  const b = window.HSW365_BRAND;
  return `You are the HSW365 Promo Engine: an elite growth marketer and direct-response copywriter acting as the AI marketing co-founder for ${b.name}.
Founder: ${b.founder}. Philosophy: "${b.philosophy}". Social handles: ${b.handles}.
Voice: a real founder talking to real people. Confident, direct, specific, street-smart, never corporate, never generic.
Hard rules:
- Specific beats generic. Name the exact pain, the exact moment, the exact result the product delivers.
- First line must stop the scroll.
- One clear call to action per piece. Use the product link exactly as given when one is provided.
- Never invent statistics, user counts, reviews, testimonials, earnings or results. Never promise guaranteed outcomes.
- Never use these words or phrases: ${BANNED}.
- ${state.settings.allowEmoji ? "Emojis allowed sparingly (max 2 per piece)." : "Do not use any emojis."}
- Write the brand as "HSW365" or "Hoodstar365", never "HOODSTAR" alone.
- Always answer with valid JSON only, no markdown fences, matching the schema you are given.`;
}
function productContext(p, opts = {}) {
  const b = p.brief || {};
  const lines = [
    `PRODUCT: ${p.name}`,
    p.url ? `LINK: ${p.url}` : "LINK: none provided (do not invent one; use the CTA text instead)",
    p.tagline && `TAGLINE: ${p.tagline}`,
    p.description && `WHAT IT DOES: ${p.description}`,
    p.audience && `WHO IT'S FOR: ${p.audience}`,
    p.showPrice && p.offer ? `OFFER / PRICING: ${p.offer}` : "PRICING: do not mention prices.",
    p.cta && `CTA: ${p.cta}`,
    b.positioning && `POSITIONING: ${b.positioning}`,
    arr(b.pains).length && `PAINS: ${arr(b.pains).join("; ")}`,
    arr(b.benefits).length && `BENEFITS: ${arr(b.benefits).join("; ")}`,
    arr(b.differentiators).length && `DIFFERENTIATORS: ${arr(b.differentiators).join("; ")}`,
    p.notes && `FOUNDER NOTES: ${p.notes}`,
    p.guardrails && `COMPLIANCE (MUST FOLLOW): ${p.guardrails}`
  ];
  if (opts.audience && p.audience_ai) lines.push("PERSONAS: " + arr(p.audience_ai.personas).map((x) => `${x.name} (${x.who})`).join(" | "));
  if (opts.competitors && p.competitors) lines.push("COMPETITORS: " + arr(p.competitors.competitors).map((c) => `${c.name}: our angle - ${c.our_angle}`).join(" | "));
  return lines.filter(Boolean).join("\n");
}
function parseJSON(text) {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(t); } catch {}
  const fo = t.indexOf("{"), fa = t.indexOf("[");
  const start = fo === -1 ? fa : fa === -1 ? fo : Math.min(fo, fa);
  if (start === -1) throw new Error("AI returned no JSON");
  const close = t[start] === "{" ? "}" : "]";
  const end = t.lastIndexOf(close);
  return JSON.parse(t.slice(start, end + 1));
}
function hasKey() { const s = state.settings; return s.provider === "groq" ? !!s.groqKey : !!s.geminiKey; }
async function ai({ prompt, web = false, temperature = 0.9 }) {
  if (!hasKey()) { location.hash = "#/settings"; throw new Error("Add your free AI key in Settings first."); }
  const s = state.settings;
  if (s.provider === "groq") return groqCall(prompt, temperature);
  return geminiCall(prompt, web, temperature);
}
async function geminiCall(prompt, web, temperature) {
  const s = state.settings;
  const models = [...new Set([s.geminiModel, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"].filter(Boolean))];
  let lastErr;
  for (const model of models) {
    for (const useTools of web ? [true, false] : [false]) {
      const body = {
        systemInstruction: { parts: [{ text: systemPrompt() }] },
        contents: [{ role: "user", parts: [{ text: prompt + (useTools ? "\n\nUse web search and the URL context tool to read live pages before answering. Return only the JSON." : "") }] }],
        generationConfig: Object.assign({ temperature }, useTools ? {} : { responseMimeType: "application/json" })
      };
      if (useTools) body.tools = [{ url_context: {} }, { google_search: {} }];
      let res, data;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${enc(model)}:generateContent?key=${enc(s.geminiKey)}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        data = await res.json().catch(() => ({}));
      } catch (e) { lastErr = new Error("Network error reaching Gemini"); continue; }
      if (res.status === 429) { const e = new Error("Free-tier rate limit hit. Give it a minute."); e.rate = true; throw e; }
      if (res.status === 400 && /key/i.test(data?.error?.message || "") && /invalid|not valid/i.test(data?.error?.message || "")) throw new Error("Gemini key is invalid. Fix it in Settings.");
      if (res.status === 404 || /not found|not supported/i.test(data?.error?.message || "")) { lastErr = new Error(`Model ${model} unavailable`); break; }
      if (!res.ok) { lastErr = new Error(data?.error?.message || "Gemini error " + res.status); if (useTools) continue; throw lastErr; }
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts || []).map((p) => p.text || "").join("");
      if (!text) { lastErr = new Error(cand?.finishReason === "SAFETY" ? "Blocked by safety filter — rephrase." : "Empty AI response"); if (useTools) continue; throw lastErr; }
      let json;
      try { json = parseJSON(text); } catch (e) { lastErr = new Error("AI returned malformed JSON — try again."); if (useTools) continue; throw lastErr; }
      const sources = arr(cand?.groundingMetadata?.groundingChunks).map((g) => g.web).filter(Boolean).map((w) => ({ title: w.title || w.uri, uri: w.uri }));
      if (model !== s.geminiModel) { s.geminiModel = model; save(); }
      return { data: json, sources, web: useTools };
    }
  }
  throw lastErr || new Error("No Gemini model available");
}
async function groqCall(prompt, temperature) {
  const s = state.settings;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.groqKey },
    body: JSON.stringify({ model: s.groqModel, temperature, response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt() }, { role: "user", content: prompt + "\nReturn a JSON object." }] })
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) { const e = new Error("Groq rate limit hit. Give it a minute."); e.rate = true; throw e; }
  if (!res.ok) throw new Error(data?.error?.message || "Groq error " + res.status);
  return { data: parseJSON(data.choices?.[0]?.message?.content), sources: [], web: false };
}

/* ---------- UTM ---------- */
function utm(url, source, medium = "social", campaign = "hsw365-promo", content = "") {
  if (!/^https?:\/\//i.test(url || "")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", campaign);
    if (content) u.searchParams.set("utm_content", content);
    return u.toString();
  } catch { return url; }
}
function applyUtm(p, pfKey, text) {
  if (!state.settings.autoUtm || !text || !/^https?:/i.test(p.url || "")) return text;
  const base = p.url.replace(/\/$/, "");
  const re = new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\/?(?![\\w/?#%-])", "g");
  return text.replace(re, utm(p.url, pfKey, pfKey === "email" ? "email" : "social", "hsw365-promo", p.slug));
}

/* ---------- prompts ---------- */
const postSchema = (pfs, script) => `{
  "angle": "short name of the angle",
  "hook": "the scroll-stopping first line",
  "platforms": { ${pfs.map((k) => `"${k}": { ${PF[k].title ? `"title": "...", ` : ""}"text": "..." }`).join(", ")} }${script ? `,
  "script": { "duration": "e.g. 25s", "hook": "spoken first 2 seconds", "onscreen_text": ["..."], "beats": [ { "time": "0-3s", "visual": "what is on screen", "voiceover": "what is said" } ], "cta": "...", "audio": "music or sound direction" }` : ""}
}`;
const pfGuides = (pfs) => pfs.map((k) => `- ${k} (${PF[k].name}, max ${PF[k].limit} chars${PF[k].title ? ", " + PF[k].titleLabel.toLowerCase() + " max " + PF[k].title : ""}): ${PF[k].guide}`).join("\n");
const isVideo = (f) => /video|demo|skit|story/i.test(f || "");

function recentHooks(p, n = 20) {
  return state.posts.filter((x) => x.productId === p.id).slice(0, n).map((x) => x.hook).filter(Boolean);
}

/* ---------- toast / modal / busy ---------- */
function toast(msg, err) {
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.textContent = msg;
  $(".toasts").appendChild(t);
  setTimeout(() => t.remove(), err ? 6000 : 3200);
}
function modal(html) {
  closeModal();
  const m = document.createElement("div");
  m.className = "modal-bg";
  m.innerHTML = `<div class="modal">${html}</div>`;
  m.addEventListener("mousedown", (e) => { if (e.target === m) closeModal(); });
  document.body.appendChild(m);
}
function closeModal() { $(".modal-bg")?.remove(); }
async function busy(key, fn) {
  if (ui.busy[key]) return;
  ui.busy[key] = true; render();
  try { return await fn(); }
  catch (e) { toast(e.message || String(e), true); }
  finally { ui.busy[key] = false; render(); }
}
const bbtn = (key, label, act, cls = "pri", attrs = "") =>
  `<button class="btn ${cls}" data-act="${act}" ${attrs} ${ui.busy[key] ? "disabled" : ""}>${ui.busy[key] ? '<span class="spin"></span> Working' : label}</button>`;

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Copied"); }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copied"); } catch { toast("Copy failed", true); }
    ta.remove();
  }
}
function download(name, content, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- routing ---------- */
const ROUTES = [
  ["Home", [["home", "Overview", "home"], ["tasks", "Tasks", "check"]]],
  ["General", [["brief", "Product brief", "file"], ["audience", "Audience", "users"], ["competitors", "Competitors", "search"], ["audit", "Site audit", "target"], ["plan", "Action plan", "map"]]],
  ["Content", [["create", "Create post", "pen"], ["posts", "My posts", "layers"], ["calendar", "Calendar", "cal"], ["autopilot", "Autopilot", "bolt"]]],
  ["Analytics", [["dashboard", "Dashboard", "chart"], ["links", "Short links", "link"]]],
  ["Distribution", [["catches", "Catches", "radar"], ["virality", "Virality", "flame"]]],
  ["System", [["memory", "Memory", "brain"], ["settings", "Settings", "gear"]]]
];
const routeName = () => (location.hash.replace(/^#\/?/, "").split("?")[0] || "home");
const titleOf = (r) => { for (const [, items] of ROUTES) for (const [k, t] of items) if (k === r) return t; return "Overview"; };

/* ---------- shell ---------- */
function shell() {
  document.body.innerHTML = `
  <div class="shell">
    <aside class="side" id="side">
      <div class="brand"><div class="mark">HSW</div><div><b>Promo Engine</b><small>HSW365 MEDIA</small></div></div>
      <div class="prod-switch"><select id="prodSel" aria-label="Active app"></select></div>
      <nav class="nav" id="nav"></nav>
      <div class="side-foot">Built by HSW365 Media<br><a href="mailto:hsw365media@gmail.com">hsw365media@gmail.com</a></div>
    </aside>
    <div class="main">
      <header class="top">
        <button class="burger" data-act="menu" aria-label="Menu">${ic("menu")}</button>
        <div class="crumb" id="crumb"></div>
        <div class="sp"></div>
        <span class="pill hide-m" id="pMonth"></span>
        <span class="pill hide-m" id="pMem"></span>
        <span class="pill" id="pAi"></span>
      </header>
      <section class="view" id="view"></section>
    </div>
  </div>
  <div class="toasts"></div>`;
}
function updateTop() {
  const r = routeName();
  const p = prod();
  const sel = $("#prodSel");
  if (sel) sel.innerHTML = state.products.map((x) => `<option value="${x.id}" ${x.id === state.activeId ? "selected" : ""}>${esc(x.name)}</option>`).join("");
  const nav = $("#nav");
  if (nav) nav.innerHTML = ROUTES.map(([g, items]) => `<h6>${g}</h6>` + items.map(([k, t, i]) => {
    let ct = "";
    if (k === "tasks") ct = state.tasks.filter((x) => !x.done && x.productId === state.activeId).length || "";
    if (k === "posts") ct = state.posts.length || "";
    if (k === "autopilot" && state.auto?.running) ct = "ON";
    return `<a href="#/${k}" class="${r === k ? "on" : ""}">${ic(i)}${t}${ct !== "" ? `<span class="ct">${ct}</span>` : ""}</a>`;
  }).join("")).join("");
  const crumb = $("#crumb");
  if (crumb) crumb.innerHTML = `${esc(titleOf(r))} <span>/ ${esc(p?.name || "")}</span>`;
  const now = new Date();
  const month = state.posts.filter((x) => { const d = new Date(x.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const pm = $("#pMonth"); if (pm) pm.innerHTML = `<span class="mono">${month}</span> posts this month`;
  const unsynced = state.log.filter((e) => !e.synced).length;
  const mem = $("#pMem");
  if (mem) mem.innerHTML = `<span class="dot ${state.settings.cloneSync ? (unsynced ? "warn" : "ok") : ""}"></span>Memory ${num(state.log.length)}`;
  const pai = $("#pAi");
  if (pai) pai.innerHTML = `<span class="dot ${hasKey() ? "ok" : "warn"}"></span>${hasKey() ? (state.settings.provider === "groq" ? "Groq" : "Gemini") : "Add AI key"}`;
}
function softRender() { if (["autopilot", "home", "posts", "calendar", "dashboard"].includes(routeName()) && !document.activeElement?.matches("input,textarea,select")) render(); else updateTop(); }
function render() {
  updateTop();
  const r = routeName();
  const fn = VIEWS[r] || VIEWS.home;
  const view = $("#view");
  const scroll = view.scrollTop;
  view.innerHTML = `<div class="wrap">${fn(prod())}</div>`;
  if (ui.keepScroll) view.scrollTop = scroll;
  ui.keepScroll = false;
}

/* ---------- shared view bits ---------- */
const head = (eyebrow, title, lead, right = "") => `<div class="head-row"><div><div class="eyebrow">${eyebrow}</div><h1 class="h1" style="font-size:clamp(30px,3.6vw,44px);margin-top:6px">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}</div><div class="row">${right}</div></div>`;
const empty = (t, s, btn = "") => `<div class="card empty"><b>${t}</b><p>${s}</p>${btn ? `<div style="margin-top:16px">${btn}</div>` : ""}</div>`;
const ul = (items) => arr(items).length ? `<ul style="margin:6px 0 0 18px;display:flex;flex-direction:column;gap:4px">${arr(items).map((x) => `<li>${esc(typeof x === "string" ? x : JSON.stringify(x))}</li>`).join("")}</ul>` : '<p class="muted">—</p>';
const sources = (s) => arr(s).length ? `<div class="card"><div class="h3">Sources</div><div class="stack" style="margin-top:10px;gap:6px">${arr(s).slice(0, 12).map((x) => `<a href="${esc(x.uri)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join("")}</div></div>` : "";
const sev = (s) => ({ high: "rd", med: "yl", medium: "yl", low: "cy" }[String(s).toLowerCase()] || "");
const needWeb = () => state.settings.provider === "groq" ? `<p class="muted" style="margin-top:8px">Live web research needs Gemini. With Groq this runs from the brief only.</p>` : "";
const optSel = (name, opts, val, id) => `<select class="in" id="${id}" name="${name}">${opts.map((o) => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;

/* ---------- views ---------- */
const VIEWS = {};

VIEWS.home = (p) => {
  const now = Date.now();
  const sched = state.posts.filter((x) => x.status === "scheduled" && new Date(x.scheduledAt) > now).length;
  const posted = state.posts.filter((x) => x.status === "posted").length;
  const a = state.auto;
  const tasks = state.tasks.filter((t) => t.productId === p?.id && !t.done).slice(0, 5);
  return `
  <section style="padding:24px 0 34px">
    <div class="eyebrow">HSW365 AI marketing co-founder</div>
    <h1 class="h1" style="margin:12px 0 0">You built it.<br><em>Now let's get you users.</em></h1>
    <p class="lead">Plans and runs promotion for every HSW365 app across Instagram, TikTok, YouTube, X, Threads, Facebook, LinkedIn, Reddit and email — and remembers everything it makes.</p>
    <div class="hero-input" style="margin-top:22px">
      <input id="newUrl" placeholder="Paste any app or site link to add it" autocomplete="off">
      ${bbtn("addUrl", `Get started ${ic("arrow")}`, "addFromUrl")}
    </div>
  </section>
  <div class="grid g4">
    <div class="card stat"><b>${state.products.length}</b><span>Apps in the engine</span></div>
    <div class="card stat"><b>${num(state.posts.length)}</b><span>Posts created</span></div>
    <div class="card stat"><b>${num(sched)}</b><span>Scheduled ahead</span></div>
    <div class="card stat"><b>${num(posted)}</b><span>Posted</span></div>
  </div>
  <div class="card glow" style="margin-top:16px">
    <div class="row between">
      <div><div class="h2">Promo every app on autopilot</div>
      <p class="muted" style="margin-top:4px">${a?.jobs?.length ? `${a.jobs.filter((j) => j.done).length} of ${a.jobs.length} batches done${a.running ? " — running now" : ""}.` : "One run writes a full week of platform-ready posts for every app and drops them on your calendar."}</p></div>
      <a class="btn pri" href="#/autopilot">${ic("bolt")} Open Autopilot</a>
    </div>
    ${a?.jobs?.length ? `<div class="prog" style="margin-top:14px"><i style="width:${Math.round(100 * a.jobs.filter((j) => j.done).length / a.jobs.length)}%"></i></div>` : ""}
  </div>
  <div class="row between" style="margin:30px 0 14px"><div class="h2">Your apps</div><button class="btn sm" data-act="newProduct">${ic("plus")} Add app</button></div>
  <div class="grid g3">
    ${state.products.map((x) => {
      const n = state.posts.filter((y) => y.productId === x.id).length;
      const s = state.posts.filter((y) => y.productId === x.id && y.status === "scheduled").length;
      return `<div class="card app-tile ${x.id === state.activeId ? "sel" : ""}" data-act="selectApp" data-id="${x.id}">
        <div class="row between"><span class="nm">${esc(x.name)}</span><span class="tag">${esc(x.category || "App")}</span></div>
        <div class="muted" style="min-height:22px">${esc(x.tagline || x.description || "No brief yet")}</div>
        <div class="row" style="gap:6px">
          <span class="tag vi">${n} posts</span>${s ? `<span class="tag cy">${s} scheduled</span>` : ""}
          ${!x.url ? '<span class="tag yl">needs link</span>' : ""}${!x.description ? '<span class="tag rd">needs brief</span>' : ""}
        </div>
      </div>`;
    }).join("")}
  </div>
  <div class="row between" style="margin:30px 0 14px"><div class="h2">Next up for ${esc(p?.name || "")}</div><a class="btn sm" href="#/tasks">All tasks</a></div>
  ${tasks.length ? `<div class="card pad0 list">${tasks.map(taskRow).join("")}</div>` : empty("No open tasks", "Run a site audit or build an action plan to fill this up.", `<a class="btn" href="#/plan">${ic("map")} Build action plan</a>`)}
  `;
};

const taskRow = (t) => `<div class="li ${t.done ? "done" : ""}">
  <input type="checkbox" ${t.done ? "checked" : ""} data-act="toggleTask" data-id="${t.id}" style="accent-color:var(--vi);width:16px;height:16px">
  <div class="grow"><div class="t">${esc(t.text)}</div><div class="s">${esc(prod(t.productId)?.name || "")}${t.channel ? " · " + esc(t.channel) : ""}${t.due ? " · due " + esc(fmtDay(t.due)) : ""}${t.source ? " · from " + esc(t.source) : ""}</div></div>
  <button class="iconbtn" data-act="delTask" data-id="${t.id}" title="Delete">${ic("trash")}</button></div>`;

VIEWS.tasks = (p) => {
  const mine = state.tasks.filter((t) => t.productId === p.id);
  const open = mine.filter((t) => !t.done), done = mine.filter((t) => t.done);
  return head("Home", "Tasks", `What to do next to get ${esc(p.name)} in front of people.`) + `
  <div class="card"><div class="row">
    <input class="in" id="taskText" placeholder="Add a task" style="flex:1;min-width:200px">
    <input class="in" type="date" id="taskDue" style="width:170px">
    <button class="btn pri" data-act="addTask">${ic("plus")} Add</button>
  </div></div>
  <div style="margin-top:16px">${open.length ? `<div class="card pad0 list">${open.map(taskRow).join("")}</div>` : empty("All clear", "No open tasks for this app.")}</div>
  ${done.length ? `<div class="h3" style="margin:24px 0 10px">Done</div><div class="card pad0 list">${done.map(taskRow).join("")}</div>` : ""}`;
};

VIEWS.brief = (p) => {
  const b = p.brief || {};
  const f = (id, label, val, ta) => `<label class="f">${label}${ta ? `<textarea class="in" id="bf-${id}">${esc(val)}</textarea>` : `<input class="in" id="bf-${id}" value="${esc(val)}">`}</label>`;
  return head("General", "Product brief", "Everything the engine knows about this app. Better brief, better promo.", `${bbtn("brief", `${ic("search")} Research from link`, "genBrief")}`) + `
  <div class="grid g2">
    <div class="card stack">
      ${f("name", "Name", p.name)}${f("url", "Link (landing page / signup)", p.url)}
      ${f("category", "Category", p.category)}${f("tagline", "Tagline", p.tagline)}
      ${f("cta", "Call to action", p.cta)}
      ${f("offer", "Offer / pricing", p.offer)}
      <label class="chk ${p.showPrice ? "on" : ""}"><input type="checkbox" id="bf-showPrice" ${p.showPrice ? "checked" : ""}> Mention pricing in promo</label>
    </div>
    <div class="card stack">
      ${f("description", "What it does", p.description, 1)}
      ${f("audience", "Who it's for", p.audience, 1)}
      ${f("notes", "Founder notes (facts, story, features to push)", p.notes, 1)}
      ${f("guardrails", "Compliance guardrails (never say)", p.guardrails, 1)}
    </div>
  </div>
  <div class="row between" style="margin-top:16px">
    <button class="btn danger" data-act="delProduct">${ic("trash")} Remove app</button>
    <div class="row"><label class="chk"><input type="checkbox" id="bf-over"> Research overwrites filled fields</label><button class="btn pri" data-act="saveBrief">Save brief</button></div>
  </div>
  ${b.positioning || arr(b.pains).length ? `
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><div class="h3">Positioning</div><p style="margin-top:8px">${esc(b.positioning || "—")}</p>
      <div class="h3" style="margin-top:16px">Differentiators</div>${ul(b.differentiators)}</div>
    <div class="card"><div class="h3">Pains it kills</div>${ul(b.pains)}<div class="h3" style="margin-top:16px">Benefits</div>${ul(b.benefits)}</div>
    <div class="card"><div class="h3">Objections & answers</div>${arr(b.objections).length ? `<div class="stack" style="margin-top:8px">${arr(b.objections).map((o) => `<div><b style="color:var(--wh)">${esc(o.objection)}</b><div class="muted">${esc(o.answer)}</div></div>`).join("")}</div>` : '<p class="muted">—</p>'}</div>
    <div class="card"><div class="h3">Keywords</div><div class="row" style="margin-top:10px;gap:6px">${arr(b.keywords).map((k) => `<span class="tag cy">${esc(k)}</span>`).join("") || '<span class="muted">—</span>'}</div></div>
  </div>${sources(b.sources)}` : ""}`;
};

VIEWS.audience = (p) => {
  const a = p.audience_ai;
  return head("General", "Audience", "Who buys, where they hang out, what makes them stop scrolling.", bbtn("aud", `${ic("users")} ${a ? "Regenerate" : "Build personas"}`, "genAudience")) +
  (a ? `<div class="grid g3">${arr(a.personas).map((x) => `<div class="card stack">
      <div><div class="eyebrow">Persona</div><div class="h2" style="margin-top:4px">${esc(x.name)}</div><p class="muted">${esc(x.who)}</p></div>
      <div><div class="h3">Where they are</div><div class="row" style="gap:6px;margin-top:8px">${arr(x.where).map((w) => `<span class="tag cy">${esc(w)}</span>`).join("")}</div></div>
      <div><div class="h3">Pains</div>${ul(x.pains)}</div>
      <div><div class="h3">Wants</div>${ul(x.desires)}</div>
      <div><div class="h3">Buying triggers</div>${ul(x.triggers)}</div>
      <div><div class="h3">Hooks that land</div>${ul(x.hooks)}</div>
      <div><div class="h3">Objections</div>${ul(x.objections)}</div>
    </div>`).join("")}</div>` : empty("No personas yet", `Build buyer personas for ${esc(p.name)} from its brief.`, bbtn("aud", "Build personas", "genAudience"))) ;
};

VIEWS.competitors = (p) => {
  const c = p.competitors;
  return head("General", "Competitors", "Who you're up against and the angle that beats them.", "") + `
  <div class="card"><div class="row">
    <input class="in" id="compNames" placeholder="Known competitors (optional, comma separated)" style="flex:1;min-width:220px" value="${esc(c?.names || "")}">
    ${bbtn("comp", `${ic("search")} Research competitors`, "genCompetitors")}
  </div>${needWeb()}</div>
  ${c ? `
  ${c.summary ? `<div class="card glow" style="margin-top:16px"><div class="h3">The play</div><p style="margin-top:8px">${esc(c.summary)}</p>${arr(c.gaps).length ? `<div class="h3" style="margin-top:14px">Market gaps to own</div>${ul(c.gaps)}` : ""}</div>` : ""}
  <div class="grid g2" style="margin-top:16px">${arr(c.competitors).map((x) => `<div class="card stack">
    <div class="row between"><div class="h2">${esc(x.name)}</div>${x.url ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(x.url)}">${ic("ext")} Visit</a>` : ""}</div>
    <p class="muted">${esc(x.positioning)}</p>
    ${x.pricing ? `<div><span class="tag yl">${esc(x.pricing)}</span></div>` : ""}
    <div class="grid g2"><div><div class="h3">Strong</div>${ul(x.strengths)}</div><div><div class="h3">Weak</div>${ul(x.weaknesses)}</div></div>
    <div class="card" style="background:var(--s1)"><div class="eyebrow">Our angle</div><p style="margin-top:6px;color:var(--wh)">${esc(x.our_angle)}</p></div>
  </div>`).join("")}</div>${sources(c.sources)}` : ""}`;
};

VIEWS.audit = (p) => {
  const a = p.audit;
  return head("General", "Site audit", "Conversion audit of the landing page: what's costing you signups and the exact fix.", "") + `
  <div class="card"><div class="row">
    <input class="in" id="auditUrl" value="${esc(a?.url || p.url || "")}" placeholder="https://..." style="flex:1;min-width:220px">
    ${bbtn("audit", `${ic("target")} Run audit`, "genAudit")}
  </div>${state.settings.provider === "groq" ? '<p class="muted" style="margin-top:8px">Site audits read the live page, which needs Gemini. Switch provider in Settings.</p>' : ""}</div>
  ${a ? (a.accessible === false ? `<div class="card" style="margin-top:16px"><div class="h3">Couldn't read that page</div><p class="muted" style="margin-top:6px">${esc(a.summary || "The page could not be fetched. Check the link is public.")}</p></div>` : `
  <div class="card" style="margin-top:16px"><div class="row" style="gap:24px;align-items:center">
    <div class="ring" style="--v:${clamp(+a.score || 0, 0, 100)}"><div>${esc(a.score ?? "–")}</div></div>
    <div style="flex:1;min-width:220px"><div class="eyebrow">Audited ${esc(fmtDate(a.at))}</div><p style="margin-top:6px;color:var(--wh)">${esc(a.summary)}</p></div>
  </div>
  <div class="grid g3" style="margin-top:18px">${arr(a.categories).map((c) => `<div><div class="row between"><b style="color:var(--wh);font-size:13px">${esc(c.name)}</b><span class="mono muted">${esc(c.score)}</span></div><div class="bar" style="margin:6px 0"><i style="width:${clamp(+c.score || 0, 0, 100)}%"></i></div><div class="muted" style="font-size:12px">${esc(c.notes)}</div></div>`).join("")}</div></div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><div class="row between"><div class="h3">Issues & fixes</div><button class="btn sm" data-act="auditTasks">${ic("plus")} Add fixes to tasks</button></div>
      <div class="stack" style="margin-top:12px">${arr(a.issues).map((i) => `<div><div class="row"><span class="tag ${sev(i.severity)}">${esc(i.severity)}</span><b style="color:var(--wh)">${esc(i.area)}</b></div><p style="margin-top:4px">${esc(i.issue)}</p><p class="muted" style="margin-top:2px">Fix: ${esc(i.fix)}</p></div>`).join("")}</div></div>
    <div class="stack">
      <div class="card"><div class="h3">Quick wins</div>${ul(a.quick_wins)}</div>
      <div class="card"><div class="h3">Rewrites</div><dl class="kv" style="margin-top:10px">
        <dt>Headline</dt><dd>${esc(a.rewritten_headline)}</dd><dt>Subhead</dt><dd>${esc(a.rewritten_subhead)}</dd><dt>CTA button</dt><dd>${esc(a.rewritten_cta)}</dd></dl></div>
    </div>
  </div>${sources(a.sources)}`) : ""}`;
};

VIEWS.plan = (p) => {
  const pl = p.plan;
  return head("General", "Action plan", "A week-by-week growth plan with tasks you can knock out.", "") + `
  <div class="card"><div class="row">
    <label class="f" style="flex:1;min-width:180px">Goal${optSel("goal", GOALS, pl?.goalSel || "Signups", "planGoal")}</label>
    <label class="f" style="width:140px">Weeks<select class="in" id="planWeeks">${[2, 4, 6, 8].map((w) => `<option ${w === (pl?.weeksSel || 4) ? "selected" : ""}>${w}</option>`).join("")}</select></label>
    <label class="f" style="flex:1;min-width:180px">Hours per week<input class="in" id="planHours" type="number" min="1" value="${esc(pl?.hours || 7)}"></label>
    <div style="align-self:flex-end">${bbtn("plan", `${ic("map")} Build plan`, "genPlan")}</div>
  </div></div>
  ${pl ? `<div class="card glow" style="margin-top:16px"><div class="row between"><div><div class="eyebrow">Goal</div><div class="h2" style="margin-top:4px">${esc(pl.goal)}</div></div><button class="btn pri" data-act="planTasks">${ic("plus")} Add all to tasks</button></div>
    ${arr(pl.kpis).length ? `<div class="row" style="margin-top:12px;gap:6px">${arr(pl.kpis).map((k) => `<span class="tag cy">${esc(k)}</span>`).join("")}</div>` : ""}</div>
  <div class="grid g2" style="margin-top:16px">${arr(pl.weeks).map((w) => `<div class="card"><div class="eyebrow">Week ${esc(w.week)}</div><div class="h3" style="margin-top:4px">${esc(w.focus)}</div>
    <div class="stack" style="margin-top:12px;gap:8px">${arr(w.tasks).map((t) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span class="tag" style="min-width:44px;justify-content:center">${esc(t.day || "")}</span><div><div style="color:var(--wh)">${esc(t.task)}</div><div class="muted" style="font-size:12px">${esc(t.channel || "")}</div></div></div>`).join("")}</div></div>`).join("")}</div>` : ""}`;
};

function newDraft() {
  return { id: null, productId: state.activeId, goal: "Signups", format: "Talking-head video", tone: "Real & direct",
    platforms: ["instagram", "tiktok", "youtube", "x"], angle: "", notes: "", content: null, scheduledAt: "", status: "draft" };
}
VIEWS.create = (p) => {
  if (!state.draft) state.draft = newDraft();
  const d = state.draft;
  if (d.productId !== state.activeId && !d.content) d.productId = state.activeId;
  const dp = prod(d.productId) || p;
  const step = d.content ? ui.step : 1;
  if (!d.content) ui.step = 1;
  const steps = `<div class="steps">${[1, 2, 3].map((n) => `<div class="${n <= step ? "on" : ""}"></div>`).join("")}</div>`;
  const top = head("Content", d.id ? "Edit post" : "Create post", `Content Details · Step ${step} of 3 · ${esc(dp.name)}`, `${d.content || d.angle ? `<button class="btn" data-act="resetDraft">${ic("plus")} New post</button>` : ""}`);
  if (step === 1) return top + steps + `
  <div class="grid g2">
    <div class="card stack">
      <label class="f">Goal${optSel("goal", GOALS, d.goal, "dGoal")}</label>
      <label class="f">Format${optSel("format", FORMATS, d.format, "dFormat")}</label>
      <label class="f">Tone${optSel("tone", TONES, d.tone, "dTone")}</label>
      <div class="f" style="font-size:12px;font-weight:600;color:var(--md)">Platforms</div>
      <div class="row" style="gap:8px">${PF_KEYS.map((k) => `<label class="chk ${d.platforms.includes(k) ? "on" : ""}"><input type="checkbox" class="dPf" value="${k}" ${d.platforms.includes(k) ? "checked" : ""}>${PF[k].name}</label>`).join("")}</div>
    </div>
    <div class="card stack">
      <label class="f">Angle<textarea class="in" id="dAngle" placeholder="What's the hook or story? Leave blank and the engine picks.">${esc(d.angle)}</textarea></label>
      <div class="row">${bbtn("angles", `${ic("bolt")} Suggest angles`, "suggestAngles", "")}</div>
      ${ui.angles ? `<div class="stack" style="gap:8px">${ui.angles.map((a, i) => `<div class="card" style="padding:12px;background:var(--s1);cursor:pointer" data-act="pickAngle" data-i="${i}"><b style="color:var(--wh)">${esc(a.title)}</b><div style="margin-top:4px">${esc(a.hook)}</div><div class="muted" style="font-size:12px;margin-top:4px">${esc(a.why)}</div></div>`).join("")}</div>` : ""}
      <label class="f">Notes for this post<textarea class="in" id="dNotes" placeholder="Feature to push, event, discount, something that happened today...">${esc(d.notes)}</textarea></label>
    </div>
  </div>
  <div class="row end" style="margin-top:16px">${d.content ? `<button class="btn" data-act="step" data-n="2">Back to content ${ic("right")}</button>` : ""}${bbtn("gen", `${d.content ? "Regenerate" : "Generate content"} ${ic("arrow")}`, "generate")}</div>`;
  if (step === 2) return top + steps + `
  <div class="card" style="margin-bottom:16px;padding:14px 18px"><div class="row between"><div><div class="eyebrow">${esc(d.content.angle || d.format)}</div><div style="color:var(--wh);font-weight:600;margin-top:4px">${esc(d.content.hook || "")}</div></div>${bbtn("gen", `${ic("refresh")} Regenerate all`, "generate", "")}</div></div>
  ${d.platforms.filter((k) => d.content.platforms?.[k]).map((k) => pcard(k, d.content.platforms[k], dp)).join("")}
  ${d.content.script ? scriptCard(d.content.script) : ""}
  <div class="row between" style="margin-top:16px"><button class="btn" data-act="step" data-n="1">${ic("left")} Back</button><button class="btn pri" data-act="step" data-n="3">Next: schedule ${ic("right")}</button></div>`;
  return top + steps + `
  <div class="card stack" style="max-width:560px">
    <label class="f">Publish time<input class="in" type="datetime-local" id="dWhen" value="${esc(d.scheduledAt ? toLocalInput(d.scheduledAt) : toLocalInput(nextSlot()))}"></label>
    <label class="f">Status<select class="in" id="dStatus">${["draft", "scheduled", "posted"].map((s) => `<option ${s === (d.status === "draft" && !d.id ? "scheduled" : d.status) ? "selected" : ""}>${s}</option>`).join("")}</select></label>
    <p class="muted" style="font-size:12.5px">Scheduled posts land on the Calendar and in the .ics / CSV exports for Buffer, Metricool or your phone calendar.</p>
  </div>
  <div class="row between" style="margin-top:16px"><button class="btn" data-act="step" data-n="2">${ic("left")} Back</button>
  <div class="row"><button class="btn" data-act="savePost" data-next="1">Save & create another</button><button class="btn pri" data-act="savePost">Save to library</button></div></div>`;
};
function pcard(k, v, p) {
  const P = PF[k];
  const len = (v.text || "").length;
  return `<div class="pcard" data-pf="${k}">
    <div class="pcard-h">${pfBadge(k)}<b>${P.name}</b><span class="h">${esc(window.HSW365_BRAND.handles.split(",")[0])}</span><span class="sp"></span>
      <input class="in" data-rwi="${k}" placeholder="Rewrite instruction (optional)" style="max-width:240px;border:1px solid var(--b2)!important;border-radius:8px!important;padding:6px 10px;font-weight:400;font-size:12px">
      ${bbtn("rw-" + k, `${ic("refresh")} Rewrite`, "rewrite", "sm", `data-pf="${k}"`)}</div>
    ${P.title ? `<input class="in" data-draft="${k}.title" value="${esc(v.title || "")}" placeholder="${P.titleLabel}">` : ""}
    <textarea class="in" data-draft="${k}.text" rows="6">${esc(v.text || "")}</textarea>
    <div class="pcard-f">
      <button class="btn sm" data-act="copyPf" data-pf="${k}">${ic("copy")} Copy</button>
      <button class="btn sm cy" data-act="postTo" data-pf="${k}">${ic("ext")} Post to ${P.name}</button>
      ${ui.vir && ui.vir.pf === k ? "" : `<button class="btn sm ghost" data-act="virFromDraft" data-pf="${k}">${ic("flame")} Score</button>`}
      <span class="cnt ${len > P.limit ? "over" : ""}" data-cnt="${k}">${len}/${P.limit}</span>
    </div></div>`;
}
const scriptCard = (s) => `<div class="card" style="margin-top:16px"><div class="row between"><div class="h3">Video script · ${esc(s.duration || "")}</div><button class="btn sm" data-act="copyScript">${ic("copy")} Copy script</button></div>
  <p style="margin-top:10px"><span class="tag vi">Hook</span> <span style="color:var(--wh)">${esc(s.hook)}</span></p>
  ${arr(s.onscreen_text).length ? `<div class="row" style="gap:6px;margin-top:10px">${arr(s.onscreen_text).map((t) => `<span class="tag cy">${esc(t)}</span>`).join("")}</div>` : ""}
  <div class="stack" style="margin-top:12px;gap:10px">${arr(s.beats).map((b) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px"><span class="mono muted" style="min-width:58px;font-size:12px">${esc(b.time)}</span><div><div style="color:var(--wh)">${esc(b.voiceover)}</div><div class="muted" style="font-size:12px">${esc(b.visual)}</div></div></div>`).join("")}</div>
  <p style="margin-top:12px"><span class="tag gn">CTA</span> ${esc(s.cta)}</p>${s.audio ? `<p class="muted" style="margin-top:6px;font-size:12px">Audio: ${esc(s.audio)}</p>` : ""}</div>`;
function scriptText(s) {
  return `HOOK: ${s.hook}\n${arr(s.onscreen_text).length ? "ON-SCREEN: " + arr(s.onscreen_text).join(" | ") + "\n" : ""}\n${arr(s.beats).map((b) => `[${b.time}] ${b.voiceover}\n   visual: ${b.visual}`).join("\n")}\n\nCTA: ${s.cta}${s.audio ? "\nAUDIO: " + s.audio : ""}`;
}
function postAsText(post) {
  const lines = [`Angle: ${post.angle || ""}`, `Hook: ${post.hook || ""}`, `Status: ${post.status}${post.scheduledAt ? " @ " + post.scheduledAt : ""}`, ""];
  for (const k of Object.keys(post.platforms || {})) {
    const v = post.platforms[k];
    lines.push(`--- ${PF[k]?.name || k} ---`);
    if (v.title) lines.push(v.title);
    lines.push(v.text || "", "");
  }
  if (post.script) lines.push("--- Video script ---", scriptText(post.script));
  return lines.join("\n");
}
function nextSlot() {
  const taken = new Set(state.posts.filter((x) => x.scheduledAt).map((x) => new Date(x.scheduledAt).getTime()));
  const d = new Date(); d.setMinutes(0, 0, 0);
  const hours = [9, 12, 18, 21];
  for (let i = 0; i < 60; i++) {
    for (const h of hours) {
      const c = new Date(d); c.setDate(d.getDate() + i); c.setHours(h, 0, 0, 0);
      if (c > new Date() && !taken.has(c.getTime())) return c;
    }
  }
  return new Date(Date.now() + 3600e3);
}

VIEWS.posts = (p) => {
  const f = ui.postFilter;
  let list = state.posts.slice();
  if (f.app === "active") list = list.filter((x) => x.productId === state.activeId);
  else if (f.app !== "all") list = list.filter((x) => x.productId === f.app);
  if (f.status !== "all") list = list.filter((x) => x.status === f.status);
  if (f.pf !== "all") list = list.filter((x) => x.platforms?.[f.pf]);
  return head("Content", "My posts", `${num(state.posts.length)} posts in the library.`, `<a class="btn pri" href="#/create" data-act="resetDraft">${ic("plus")} New post</a>`) + `
  <div class="card" style="margin-bottom:16px"><div class="row">
    <select class="in" id="fApp" style="width:auto"><option value="all">All apps</option><option value="active" ${f.app === "active" ? "selected" : ""}>Active app</option>${state.products.map((x) => `<option value="${x.id}" ${f.app === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
    <select class="in" id="fStatus" style="width:auto">${["all", "draft", "scheduled", "posted"].map((s) => `<option ${s === f.status ? "selected" : ""}>${s}</option>`).join("")}</select>
    <select class="in" id="fPf" style="width:auto"><option value="all">All platforms</option>${PF_KEYS.map((k) => `<option value="${k}" ${k === f.pf ? "selected" : ""}>${PF[k].name}</option>`).join("")}</select>
    <span class="muted" style="margin-left:auto">${list.length} shown</span>
  </div></div>
  ${list.length ? `<div class="card pad0 list">${list.slice(0, 400).map((x) => `<div class="li">
    <div class="grow" data-act="openPost" data-id="${x.id}" style="cursor:pointer">
      <div class="t">${esc(x.hook || x.angle || "Untitled")}</div>
      <div class="s">${esc(prod(x.productId)?.name || "Removed app")} · ${esc(x.angle || x.format || "")}${x.scheduledAt ? " · " + esc(fmtDate(x.scheduledAt)) : ""}${x.virality ? " · score " + esc(x.virality) : ""}</div>
    </div>
    <div class="row hide-m" style="gap:4px">${Object.keys(x.platforms || {}).map(pfBadge).join("")}</div>
    <span class="tag ${x.status === "posted" ? "gn" : x.status === "scheduled" ? "cy" : ""}">${esc(x.status)}</span>
    <button class="iconbtn" title="Results" data-act="resultsPost" data-id="${x.id}">${ic("chart")}</button>
    <button class="iconbtn" title="Duplicate" data-act="dupPost" data-id="${x.id}">${ic("dup")}</button>
    <button class="iconbtn" title="Delete" data-act="delPost" data-id="${x.id}">${ic("trash")}</button>
  </div>`).join("")}</div>` : empty("Nothing here yet", "Create a post or run Autopilot to fill your library.", `<a class="btn pri" href="#/autopilot">${ic("bolt")} Run Autopilot</a>`)}`;
};

VIEWS.calendar = () => {
  const m = new Date(ui.cal.getFullYear(), ui.cal.getMonth(), 1);
  const start = new Date(m); start.setDate(1 - m.getDay());
  const days = [];
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  const posts = state.posts.filter((x) => x.scheduledAt);
  const today = new Date();
  return head("Content", "Calendar", m.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    `<button class="iconbtn" data-act="calNav" data-n="-1">${ic("left")}</button><button class="btn sm" data-act="calNav" data-n="0">Today</button><button class="iconbtn" data-act="calNav" data-n="1">${ic("right")}</button>
     <button class="btn sm" data-act="exportIcs">${ic("down")} .ics</button><button class="btn sm" data-act="exportCsv">${ic("down")} CSV</button>`) + `
  <div class="cal">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="dh">${d}</div>`).join("")}
  ${days.map((d) => {
    const ev = posts.filter((x) => sameDay(new Date(x.scheduledAt), d)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return `<div class="day ${d.getMonth() !== m.getMonth() ? "out" : ""} ${sameDay(d, today) ? "today" : ""}"><div class="dn">${d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3)} ${d.getDate()}</div>
      ${ev.slice(0, 4).map((x) => `<div class="ev ${x.status === "posted" ? "posted" : ""}" data-act="openPost" data-id="${x.id}" title="${esc(x.hook)}">${esc(new Date(x.scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }))} ${esc(prod(x.productId)?.name || "")}</div>`).join("")}
      ${ev.length > 4 ? `<div class="more">+${ev.length - 4} more</div>` : ""}</div>`;
  }).join("")}</div>`;
};

VIEWS.autopilot = () => {
  const a = state.auto;
  const cfg = a?.config || { apps: state.products.filter((p) => p.description).map((p) => p.id), perApp: 3, platforms: ["instagram", "tiktok", "youtube", "x", "facebook"], goal: "Signups", start: toLocalInput(new Date(Date.now() + 864e5)).slice(0, 10), perDay: 4 };
  const doneN = a?.jobs?.filter((j) => j.done).length || 0;
  const total = a?.jobs?.length || 0;
  return head("Content", "Autopilot", "Promo every app in one run. The engine writes a batch of fresh, non-repeating posts per app (it remembers every hook it already used), interleaves them, and schedules them across your calendar.") + `
  <div class="grid g2">
    <div class="card stack">
      <div class="row between"><div class="h3">Apps</div><div class="row"><button class="btn sm" data-act="apAll" data-v="1">All</button><button class="btn sm" data-act="apAll" data-v="0">None</button></div></div>
      <div class="row" style="gap:6px">${state.products.map((p) => `<label class="chk ${cfg.apps.includes(p.id) ? "on" : ""}" style="padding:6px 10px"><input type="checkbox" class="apApp" value="${p.id}" ${cfg.apps.includes(p.id) ? "checked" : ""}>${esc(p.name)}</label>`).join("")}</div>
    </div>
    <div class="card stack">
      <div class="grid g2">
        <label class="f">Posts per app${`<input class="in" id="apPer" type="number" min="1" max="21" value="${cfg.perApp}">`}</label>
        <label class="f">Posts per day (all apps)<input class="in" id="apDay" type="number" min="1" max="12" value="${cfg.perDay}"></label>
        <label class="f">Start date<input class="in" id="apStart" type="date" value="${esc(cfg.start)}"></label>
        <label class="f">Goal${optSel("goal", GOALS, cfg.goal, "apGoal")}</label>
      </div>
      <div class="f" style="font-size:12px;font-weight:600;color:var(--md)">Platforms</div>
      <div class="row" style="gap:6px">${PF_KEYS.map((k) => `<label class="chk ${cfg.platforms.includes(k) ? "on" : ""}" style="padding:6px 10px"><input type="checkbox" class="apPf" value="${k}" ${cfg.platforms.includes(k) ? "checked" : ""}>${PF[k].name}</label>`).join("")}</div>
    </div>
  </div>
  <div class="card glow" style="margin-top:16px">
    <div class="row between">
      <div><div class="h2">${a?.running ? "Running" : total && doneN === total ? "Run complete" : total ? "Paused" : "Ready"}</div>
      <p class="muted" style="margin-top:4px">${total ? `${doneN} / ${total} batches · ${num(a.created || 0)} posts created${a.errors ? " · " + a.errors + " failed" : ""}` : `${cfg.apps.length} apps × ${cfg.perApp} posts = ${cfg.apps.length * cfg.perApp} posts across ${Math.ceil((cfg.apps.length * cfg.perApp) / Math.max(1, cfg.perDay))} days.`}</p></div>
      <div class="row">
        ${a?.running ? `<button class="btn" data-act="apPause">${ic("pause")} Pause</button>` : `${total && doneN < total ? `<button class="btn" data-act="apResume">${ic("play")} Resume</button>` : ""}<button class="btn pri" data-act="apStart">${ic("bolt")} ${total ? "New run" : "Start Autopilot"}</button>`}
      </div>
    </div>
    ${total ? `<div class="prog" style="margin-top:14px"><i style="width:${Math.round((100 * doneN) / total)}%"></i></div>` : ""}
  </div>
  ${total ? `<div class="card pad0 list" style="margin-top:16px">${a.jobs.map((j) => `<div class="li"><div class="grow"><div class="t">${esc(prod(j.productId)?.name || "?")}</div><div class="s">${j.n} posts${j.error ? " · " + esc(j.error) : ""}</div></div><span class="tag ${j.done ? (j.error ? "rd" : "gn") : a.running && a.cursor === j.id ? "vi" : ""}">${j.done ? (j.error ? "failed" : "done") : a.running && a.cursor === j.id ? "writing" : "queued"}</span></div>`).join("")}</div>` : ""}
  ${!hasKey() ? `<p class="muted" style="margin-top:12px">Add your free Gemini key in <a href="#/settings">Settings</a> to run.</p>` : ""}`;
};

VIEWS.dashboard = () => {
  const P = state.posts;
  const posted = P.filter((x) => x.status === "posted");
  const tot = (k) => posted.reduce((s, x) => s + (+x.results?.[k] || 0), 0);
  const byApp = state.products.map((p) => ({ n: p.name, v: P.filter((x) => x.productId === p.id).length })).filter((x) => x.v).sort((a, b) => b.v - a.v).slice(0, 14);
  const byPf = PF_KEYS.map((k) => ({ n: PF[k].s, v: P.filter((x) => x.platforms?.[k]).length }));
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const s = new Date(); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - s.getDay() - i * 7);
    const e = new Date(s); e.setDate(s.getDate() + 7);
    weeks.push({ n: s.toLocaleDateString(undefined, { month: "short", day: "numeric" }), v: P.filter((x) => { const d = new Date(x.createdAt); return d >= s && d < e; }).length });
  }
  const top = posted.filter((x) => x.results).sort((a, b) => (+b.results.views || 0) - (+a.results.views || 0)).slice(0, 8);
  const chart = (rows) => { const max = Math.max(1, ...rows.map((r) => r.v)); return `<div class="chart">${rows.map((r) => `<div class="c"><span class="mono" style="color:var(--tx)">${r.v}</span><i style="height:${Math.round((r.v / max) * 100)}px"></i><span title="${esc(r.n)}">${esc(r.n)}</span></div>`).join("")}</div>`; };
  return head("Analytics", "Dashboard", "Output and results across every app. Log results on posted content from My posts.") + `
  <div class="grid g4">
    <div class="card stat"><b>${num(tot("views"))}</b><span>Views</span></div>
    <div class="card stat"><b>${num(tot("likes") + tot("comments") + tot("shares"))}</b><span>Engagements</span></div>
    <div class="card stat"><b>${num(tot("clicks"))}</b><span>Link clicks</span></div>
    <div class="card stat"><b>${num(tot("signups"))}</b><span>Signups / sales</span></div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><div class="h3">Posts created per week</div>${chart(weeks)}</div>
    <div class="card"><div class="h3">Posts by platform</div>${chart(byPf)}</div>
  </div>
  <div class="card" style="margin-top:16px"><div class="h3">Posts by app</div>${byApp.length ? chart(byApp) : '<p class="muted" style="margin-top:8px">No posts yet.</p>'}</div>
  <div class="card pad0" style="margin-top:16px"><div style="padding:16px 16px 4px" class="h3">Top performing</div>
  ${top.length ? `<div class="list">${top.map((x) => `<div class="li"><div class="grow" data-act="openPost" data-id="${x.id}" style="cursor:pointer"><div class="t">${esc(x.hook)}</div><div class="s">${esc(prod(x.productId)?.name || "")}</div></div><span class="mono">${num(x.results.views)} views</span><span class="mono muted hide-m">${num(x.results.clicks)} clicks</span></div>`).join("")}</div>` : '<p class="muted" style="padding:0 16px 16px">Mark posts as posted and log their results to see winners here.</p>'}</div>`;
};

VIEWS.links = (p) => {
  const mine = state.links.filter((l) => l.productId === p.id);
  return head("Analytics", "Short links", "UTM-tagged links per platform so your site analytics shows exactly which post drove the visit.") + `
  <div class="card"><div class="grid g3">
    <label class="f">Destination<input class="in" id="lUrl" value="${esc(p.url)}" placeholder="https://..."></label>
    <label class="f">Source<select class="in" id="lSrc">${[...PF_KEYS, "bio", "dm", "qr", "flyer"].map((k) => `<option>${k}</option>`).join("")}</select></label>
    <label class="f">Medium<select class="in" id="lMed">${["social", "bio", "dm", "email", "paid", "offline"].map((k) => `<option>${k}</option>`).join("")}</select></label>
    <label class="f">Campaign<input class="in" id="lCamp" value="hsw365-promo"></label>
    <label class="f">Content (optional)<input class="in" id="lCont" placeholder="hook-a, video-2..."></label>
    <label class="f">Label<input class="in" id="lLabel" placeholder="IG bio link"></label>
  </div><div class="row end" style="margin-top:14px"><button class="btn pri" data-act="makeLink">${ic("link")} Create link</button></div></div>
  ${mine.length ? `<div class="card pad0 list" style="margin-top:16px">${mine.map((l) => `<div class="li"><div class="grow"><div class="t">${esc(l.label || l.source)}</div><div class="s mono">${esc(l.full)}</div></div><button class="btn sm" data-act="copyLink" data-id="${l.id}">${ic("copy")} Copy</button><button class="iconbtn" data-act="delLink" data-id="${l.id}">${ic("trash")}</button></div>`).join("")}</div>` : ""}
  <p class="muted" style="margin-top:14px;font-size:12.5px">Posts generated by the engine auto-tag this app's link per platform when "Auto UTM" is on in Settings.</p>`;
};

const SEARCH = {
  reddit: (q) => `https://www.reddit.com/search/?q=${enc(q)}&sort=new`,
  x: (q) => `https://twitter.com/search?q=${enc(q)}&f=live`,
  youtube: (q) => `https://www.youtube.com/results?search_query=${enc(q)}`,
  tiktok: (q) => `https://www.tiktok.com/search?q=${enc(q)}`,
  quora: (q) => `https://www.quora.com/search?q=${enc(q)}`,
  facebook: (q) => `https://www.facebook.com/search/groups/?q=${enc(q)}`,
  instagram: (q) => `https://www.instagram.com/explore/tags/${enc(q.replace(/[^a-z0-9]/gi, ""))}/`
};
VIEWS.catches = (p) => {
  const list = state.catches.filter((c) => c.productId === p.id);
  return head("Distribution", "Catches", "Live conversations where people are already asking for what you built. Open the search, drop a genuinely helpful reply.", bbtn("catch", `${ic("radar")} Find catches`, "genCatches")) +
  (list.length ? `<div class="grid g2">${list.map((c) => `<div class="card stack ${c.done ? "" : ""}" style="${c.done ? "opacity:.55" : ""}">
    <div class="row between"><span class="tag cy">${esc(c.platform)}</span><span class="muted" style="font-size:12px">${esc(c.intent || "")}</span></div>
    <div style="color:var(--wh);font-weight:600">${esc(c.query)}</div>
    <div class="card" style="background:var(--s1);padding:12px"><div class="eyebrow">Reply</div><p style="margin-top:6px;white-space:pre-wrap">${esc(c.reply)}</p></div>
    <div class="row"><a class="btn sm cy" target="_blank" rel="noopener" href="${esc((SEARCH[c.platform] || SEARCH.reddit)(c.query))}">${ic("search")} Find threads</a>
    <button class="btn sm" data-act="copyCatch" data-id="${c.id}">${ic("copy")} Copy reply</button>
    <button class="btn sm ${c.done ? "" : "ghost"}" data-act="doneCatch" data-id="${c.id}">${ic("check")} ${c.done ? "Done" : "Mark done"}</button>
    <button class="iconbtn" data-act="delCatch" data-id="${c.id}" style="margin-left:auto">${ic("trash")}</button></div>
  </div>`).join("")}</div>` : empty("No catches yet", `Find people on Reddit, X, YouTube, TikTok, Quora and Facebook groups who need ${esc(p.name)} right now.`, bbtn("catch", "Find catches", "genCatches")));
};

VIEWS.virality = () => {
  const v = ui.vir;
  return head("Distribution", "Virality", "Score any hook or caption before it goes out, and get a stronger version.") + `
  <div class="card stack">
    <div class="row"><label class="f" style="width:220px">Platform<select class="in" id="vPf">${PF_KEYS.map((k) => `<option value="${k}" ${v?.pf === k ? "selected" : ""}>${PF[k].name}</option>`).join("")}</select></label></div>
    <label class="f">Post or hook<textarea class="in" id="vText" rows="6" placeholder="Paste a caption, hook or script">${esc(v?.text || "")}</textarea></label>
    <div class="row end">${bbtn("vir", `${ic("flame")} Score it`, "genVirality")}</div>
  </div>
  ${v?.res ? `<div class="card" style="margin-top:16px"><div class="row" style="gap:24px">
    <div class="ring" style="--v:${clamp(+v.res.score || 0, 0, 100)}"><div>${esc(v.res.score)}</div></div>
    <div style="flex:1;min-width:220px"><div class="h2">${esc(v.res.verdict)}</div></div></div>
    <div class="grid g3" style="margin-top:18px">${arr(v.res.breakdown).map((b) => `<div><div class="row between"><b style="color:var(--wh);font-size:13px">${esc(b.factor)}</b><span class="mono muted">${esc(b.score)}</span></div><div class="bar" style="margin:6px 0"><i style="width:${clamp(+b.score || 0, 0, 100)}%"></i></div><div class="muted" style="font-size:12px">${esc(b.note)}</div></div>`).join("")}</div></div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><div class="h3">Stronger hook</div><p style="margin-top:8px;color:var(--wh)">${esc(v.res.improved_hook)}</p><div class="h3" style="margin-top:16px">Fixes</div>${ul(v.res.tips)}</div>
    <div class="card"><div class="row between"><div class="h3">Improved version</div><button class="btn sm" data-act="copyVir">${ic("copy")} Copy</button></div><pre class="out" style="margin-top:8px">${esc(v.res.improved_version)}</pre>
    ${v.draftPf ? `<div class="row end" style="margin-top:12px"><button class="btn sm pri" data-act="useVir">Use in post</button></div>` : ""}</div>
  </div>` : ""}`;
};

VIEWS.memory = () => {
  const f = ui.memFilter;
  const types = [...new Set(state.log.map((e) => e.type))];
  const list = state.log.filter((e) => f === "all" || e.type === f).slice(0, 300);
  const s = state.settings;
  const unsynced = state.log.filter((e) => !e.synced).length;
  let bytes = 0; try { bytes = (localStorage.getItem(KEY) || "").length; } catch {}
  return head("System", "Memory", "Everything the engine has ever created, kept forever. Backed up locally and synced to your clone agent.",
    `<button class="btn" data-act="exportAll">${ic("down")} Export backup</button><label class="btn" style="cursor:pointer">${ic("up")} Import<input type="file" id="importFile" accept="application/json" hidden></label>`) + `
  <div class="grid g4">
    <div class="card stat"><b>${num(state.log.length)}</b><span>Things remembered</span></div>
    <div class="card stat"><b>${num(state.posts.length)}</b><span>Posts</span></div>
    <div class="card stat"><b>${num(unsynced)}</b><span>Waiting to sync</span></div>
    <div class="card stat"><b>${(bytes / 1024 / 1024).toFixed(2)}<span style="font-size:14px"> MB</span></b><span>Local storage used</span></div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="row between"><div><div class="h3">Clone agent sync</div><p class="muted" style="margin-top:4px">Every brief, plan, post and link is saved to your clone agent so it remembers everything created here.</p></div>
    <label class="chk ${s.cloneSync ? "on" : ""}"><input type="checkbox" id="mSync" ${s.cloneSync ? "checked" : ""}> Sync on</label></div>
    <div class="grid g2" style="margin-top:12px">
      <label class="f">Clone agent URL<input class="in" id="mUrl" value="${esc(s.cloneUrl)}"></label>
      <label class="f">Agent token (AGENT_AUTH_TOKEN)<input class="in" id="mTok" type="password" value="${esc(s.cloneToken)}" placeholder="Bearer token"></label>
    </div>
    <div class="row end" style="margin-top:12px">
      ${bbtn("mtest", "Test connection", "memTest", "")}
      <button class="btn" data-act="memSave">Save</button>
      ${bbtn("mpush", `${ic("up")} Sync ${num(unsynced)} now`, "memPush")}
    </div>
  </div>
  <div class="row" style="margin:24px 0 12px"><div class="h2" style="margin-right:auto">Timeline</div>
    <select class="in" id="memF" style="width:auto"><option value="all">Everything</option>${types.map((t) => `<option ${t === f ? "selected" : ""}>${t}</option>`).join("")}</select></div>
  ${list.length ? `<div class="card pad0 list">${list.map((e) => `<div class="li"><span class="tag ${e.type === "post" ? "vi" : "cy"}">${esc(e.type)}</span><div class="grow" ${e.type === "post" && e.ref ? `data-act="openPost" data-id="${e.ref}" style="cursor:pointer"` : ""}><div class="t">${esc(e.title)}</div><div class="s">${esc(prodBySlug(e.slug)?.name || "")} · ${esc(fmtDate(e.t))}</div></div>${e.synced ? '<span class="tag gn">synced</span>' : ""}</div>`).join("")}</div>` : empty("Nothing remembered yet", "Everything you create shows up here.")}`;
};

VIEWS.settings = () => {
  const s = state.settings;
  return head("System", "Settings", "Free AI by default: a Google Gemini key from aistudio.google.com/apikey costs nothing. Keys stay in this browser only.") + `
  <div class="grid g2">
    <div class="card stack">
      <div class="h3">AI provider</div>
      <label class="f">Provider<select class="in" id="sProv"><option value="gemini" ${s.provider === "gemini" ? "selected" : ""}>Google Gemini (free, live web research)</option><option value="groq" ${s.provider === "groq" ? "selected" : ""}>Groq (free, fastest)</option></select></label>
      <label class="f">Gemini API key<input class="in" id="sGem" type="password" value="${esc(s.geminiKey)}" placeholder="AIza..."></label>
      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="font-size:12.5px">Get a free Gemini key ${ic("ext")}</a>
      <label class="f">Gemini model<input class="in" id="sGemM" value="${esc(s.geminiModel)}"></label>
      <label class="f">Groq API key<input class="in" id="sGroq" type="password" value="${esc(s.groqKey)}" placeholder="gsk_..."></label>
      <label class="f">Groq model<input class="in" id="sGroqM" value="${esc(s.groqModel)}"></label>
      <div class="row">${bbtn("stest", "Test AI", "testAi", "")}</div>
    </div>
    <div class="card stack">
      <div class="h3">Content rules</div>
      <label class="chk ${s.allowEmoji ? "on" : ""}"><input type="checkbox" id="sEmoji" ${s.allowEmoji ? "checked" : ""}> Allow emojis in captions</label>
      <label class="chk ${s.autoUtm ? "on" : ""}"><input type="checkbox" id="sUtm" ${s.autoUtm ? "checked" : ""}> Auto UTM-tag app links per platform</label>
      <label class="f">Delay between Autopilot calls (ms)<input class="in" id="sDelay" type="number" min="1000" step="500" value="${esc(s.rateDelay)}"></label>
      <p class="muted" style="font-size:12.5px">Free Gemini allows roughly 10 requests a minute. 6500 ms keeps Autopilot under the limit.</p>
      <div class="sep"></div>
      <div class="h3">Danger zone</div>
      <div class="row"><button class="btn danger" data-act="resetAll">${ic("trash")} Erase everything</button></div>
    </div>
  </div>
  <div class="row end" style="margin-top:16px"><button class="btn pri" data-act="saveSettings">Save settings</button></div>`;
};

/* ---------- actions ---------- */
const A = {};
A.menu = () => $("#side").classList.toggle("open");
A.selectApp = (el) => { state.activeId = el.dataset.id; save(); if (!state.draft?.content) state.draft = null; location.hash = "#/brief"; };
A.newProduct = () => {
  const p = { id: uid(), slug: "app-" + uid().slice(0, 5), name: "New app", category: "App", url: "", tagline: "", description: "", audience: "", offer: "", showPrice: false, cta: "Sign up", brief: {}, createdAt: new Date().toISOString() };
  state.products.push(p); state.activeId = p.id; save(); location.hash = "#/brief";
};
A.addFromUrl = () => {
  let url = $("#newUrl").value.trim();
  if (!url) return toast("Paste a link first", true);
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  let host = url; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  const existing = state.products.find((p) => p.url && p.url.replace(/\/$/, "") === url.replace(/\/$/, ""));
  if (existing) { state.activeId = existing.id; save(); location.hash = "#/brief"; return; }
  return busy("addUrl", async () => {
    const p = { id: uid(), slug: slugify(host.split(".")[0]), name: host.split(".")[0], category: "App", url, tagline: "", description: "", audience: "", offer: "", showPrice: false, cta: "Sign up", brief: {}, createdAt: new Date().toISOString() };
    if (prodBySlug(p.slug)) p.slug += "-" + uid().slice(0, 4);
    state.products.push(p); state.activeId = p.id; save();
    await researchBrief(p, true);
    location.hash = "#/brief";
  });
};
function readBrief(p) {
  const v = (id) => $("#bf-" + id)?.value ?? "";
  Object.assign(p, { name: v("name").trim() || p.name, url: v("url").trim(), category: v("category").trim(), tagline: v("tagline").trim(), cta: v("cta").trim(), offer: v("offer").trim(),
    description: v("description").trim(), audience: v("audience").trim(), notes: v("notes").trim(), guardrails: v("guardrails").trim(), showPrice: !!$("#bf-showPrice")?.checked });
}
A.saveBrief = () => { const p = prod(); readBrief(p); save(); remember("brief", `Brief saved: ${p.name}`, p.id, p.id); toast("Brief saved"); render(); };
A.delProduct = () => {
  const p = prod();
  modal(`<div class="h2">Remove ${esc(p.name)}?</div><p class="muted" style="margin-top:8px">Its posts stay in your library and memory. The app is removed from the engine.</p><div class="row end" style="margin-top:18px"><button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" data-act="delProductYes">Remove</button></div>`);
};
A.delProductYes = () => {
  const p = prod();
  state.products = state.products.filter((x) => x.id !== p.id);
  state.activeId = state.products[0]?.id; closeModal(); save(); location.hash = "#/home";
};
A.closeModal = closeModal;

async function researchBrief(p, overwrite) {
  const r = await ai({ web: /^https?:/i.test(p.url || ""), temperature: 0.4, prompt: `Research this product and write a sharp marketing brief.
${productContext(p)}
${/^https?:/i.test(p.url || "") ? `Read the live page at ${p.url} and anything public about it.` : ""}
Return JSON:
{"name":"product name","category":"short category","tagline":"under 8 words","description":"2 sentences, what it does in plain words","audience":"who it's for, specific","offer":"pricing/offer if found, else empty","cta":"2-4 word call to action","positioning":"one sentence: the only X that Y for Z","pains":["5 specific pains"],"benefits":["5 concrete benefits"],"differentiators":["3-5"],"objections":[{"objection":"...","answer":"..."}],"keywords":["8-12 search keywords people use"]}
If you cannot access the page, base it on the information given and do not invent features.` });
  const d = r.data || {};
  const set = (k) => { if (d[k] && (overwrite || !String(p[k] || "").trim())) p[k] = String(d[k]).trim(); };
  ["tagline", "description", "audience", "offer", "cta", "category"].forEach(set);
  if (d.name && (overwrite || !p.name || p.name === "New app" || p.name === p.slug)) p.name = d.name;
  p.brief = { positioning: d.positioning, pains: arr(d.pains), benefits: arr(d.benefits), differentiators: arr(d.differentiators), objections: arr(d.objections), keywords: arr(d.keywords), sources: r.sources, at: new Date().toISOString() };
  save();
  remember("brief", `Brief researched: ${p.name}`, p.id, p.id);
  toast(`Brief ready for ${p.name}`);
}
A.genBrief = () => busy("brief", async () => { const p = prod(); if ($("#bf-name")) readBrief(p); await researchBrief(p, !!$("#bf-over")?.checked); });

A.genAudience = () => busy("aud", async () => {
  const p = prod();
  const r = await ai({ temperature: 0.7, prompt: `Build 3 distinct buyer personas for this product.\n${productContext(p, { competitors: true })}\nReturn JSON: {"personas":[{"name":"memorable persona name","who":"one line","where":["specific platforms, subreddits, hashtags, communities"],"pains":["3-4"],"desires":["3"],"triggers":["moments they'd buy"],"hooks":["3 first lines that would stop them scrolling"],"objections":["2-3"]}]}` });
  p.audience_ai = { personas: arr(r.data.personas), at: new Date().toISOString() };
  save(); remember("audience", `Personas built: ${p.name}`, p.id, p.id);
});

A.genCompetitors = () => busy("comp", async () => {
  const p = prod();
  const names = $("#compNames")?.value.trim() || "";
  const r = await ai({ web: true, temperature: 0.4, prompt: `Research the real competitors of this product${names ? " including: " + names : ""}.\n${productContext(p)}\nFind 4-6 real alternatives people use today. Return JSON: {"summary":"2-3 sentences: how to win","gaps":["market gaps to own"],"competitors":[{"name":"","url":"","positioning":"how they sell themselves","pricing":"if known","strengths":["2-3"],"weaknesses":["2-3"],"our_angle":"the specific message that beats them"}]}` });
  p.competitors = Object.assign({ names, sources: r.sources, at: new Date().toISOString() }, r.data);
  save(); remember("competitors", `Competitor research: ${p.name}`, p.id, p.id);
});

A.genAudit = () => busy("audit", async () => {
  const p = prod();
  const url = $("#auditUrl").value.trim() || p.url;
  if (!/^https?:\/\//i.test(url)) throw new Error("Enter a full https:// link to audit");
  const r = await ai({ web: true, temperature: 0.3, prompt: `Do a conversion-rate audit of the landing page ${url} for this product.\n${productContext(p)}\nRead the live page first. Judge headline/offer clarity, trust, CTA, speed to value, mobile layout cues, SEO basics, and social proof. Be blunt and specific to what is actually on the page.
Return JSON: {"accessible":true,"score":0-100,"summary":"2 sentences","categories":[{"name":"Headline & offer","score":0-100,"notes":""},{"name":"Call to action","score":0-100,"notes":""},{"name":"Trust & proof","score":0-100,"notes":""},{"name":"Clarity","score":0-100,"notes":""},{"name":"SEO basics","score":0-100,"notes":""},{"name":"Mobile & speed cues","score":0-100,"notes":""}],"issues":[{"severity":"high|med|low","area":"","issue":"","fix":""}],"quick_wins":["5"],"rewritten_headline":"","rewritten_subhead":"","rewritten_cta":""}
If you could not read the page, return {"accessible":false,"summary":"why"} only.` });
  p.audit = Object.assign({ url, sources: r.sources, at: new Date().toISOString() }, r.data);
  if (!r.web && p.audit.accessible !== false) p.audit.summary = "(Live page could not be fetched; based on brief.) " + (p.audit.summary || "");
  save(); remember("audit", `Site audit ${p.audit.score ?? ""}: ${p.name}`, p.id, p.id);
});
A.auditTasks = () => {
  const p = prod();
  let n = 0;
  for (const i of arr(p.audit?.issues)) { state.tasks.push({ id: uid(), productId: p.id, text: `${i.area}: ${i.fix}`, source: "site audit", done: false, createdAt: new Date().toISOString() }); n++; }
  save(); toast(`${n} tasks added`); render();
};

A.genPlan = () => busy("plan", async () => {
  const p = prod();
  const goal = $("#planGoal").value, weeks = +$("#planWeeks").value, hours = +$("#planHours").value || 7;
  const r = await ai({ temperature: 0.6, prompt: `Build a ${weeks}-week growth action plan to drive ${goal} for this product, for a solo founder with about ${hours} hours a week and no ad budget unless noted. Free channels first.\n${productContext(p, { audience: true, competitors: true })}\nReturn JSON: {"goal":"specific measurable goal","kpis":["3-5 KPIs"],"weeks":[{"week":1,"focus":"","tasks":[{"day":"Mon","task":"specific action","channel":""}]}]} with 4-6 tasks per week.` });
  p.plan = Object.assign({ goalSel: goal, weeksSel: weeks, hours, at: new Date().toISOString() }, r.data);
  save(); remember("plan", `Action plan (${goal}, ${weeks} wks): ${p.name}`, p.id, p.id);
});
A.planTasks = () => {
  const p = prod();
  const start = new Date(); start.setHours(9, 0, 0, 0);
  const dayIdx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let n = 0;
  for (const w of arr(p.plan?.weeks)) for (const t of arr(w.tasks)) {
    const due = new Date(start); due.setDate(start.getDate() + ((+w.week || 1) - 1) * 7 + (((dayIdx[String(t.day).slice(0, 3)] ?? 1) - start.getDay() + 7) % 7));
    state.tasks.push({ id: uid(), productId: p.id, text: t.task, channel: t.channel, due: due.toISOString(), source: "action plan", done: false, createdAt: new Date().toISOString() });
    n++;
  }
  save(); toast(`${n} tasks added`); location.hash = "#/tasks";
};

A.addTask = () => {
  const text = $("#taskText").value.trim();
  if (!text) return;
  const due = $("#taskDue").value;
  const t = { id: uid(), productId: state.activeId, text, due: due ? new Date(due + "T09:00").toISOString() : null, source: "manual", done: false, createdAt: new Date().toISOString() };
  state.tasks.push(t); save(); remember("task", `Task: ${text}`, t.id); render();
};
A.toggleTask = (el) => { const t = state.tasks.find((x) => x.id === el.dataset.id); if (t) { t.done = !t.done; save(); ui.keepScroll = true; render(); } };
A.delTask = (el) => { state.tasks = state.tasks.filter((x) => x.id !== el.dataset.id); save(); ui.keepScroll = true; render(); };

/* composer */
function readStep1() {
  const d = state.draft;
  if (!$("#dGoal")) return;
  d.goal = $("#dGoal").value; d.format = $("#dFormat").value; d.tone = $("#dTone").value;
  d.platforms = $$(".dPf:checked").map((x) => x.value);
  d.angle = $("#dAngle").value; d.notes = $("#dNotes").value;
  save();
}
A.resetDraft = () => { state.draft = newDraft(); ui.step = 1; ui.angles = null; save(); if (routeName() !== "create") location.hash = "#/create"; else render(); };
A.step = (el) => { if (ui.step === 1) readStep1(); ui.step = +el.dataset.n; if (ui.step === 3) {} render(); $("#view").scrollTop = 0; };
A.suggestAngles = () => busy("angles", async () => {
  readStep1();
  const d = state.draft, p = prod(d.productId);
  const used = recentHooks(p, 25);
  const r = await ai({ temperature: 1, prompt: `Give 6 fresh promo angles for this product. Goal: ${d.goal}. Format: ${d.format}.\n${productContext(p, { audience: true, competitors: true })}\n${used.length ? "Already used (do not repeat these ideas):\n- " + used.join("\n- ") : ""}\nMix: pain-point, demo/proof, founder story, objection-killer, comparison, trend/meme, behind-the-build. Return JSON: {"angles":[{"title":"3-6 words","hook":"the exact first line","why":"why it works for this audience"}]}` });
  ui.angles = arr(r.data.angles);
});
A.pickAngle = (el) => { const a = ui.angles[+el.dataset.i]; readStep1(); state.draft.angle = `${a.title}: ${a.hook}`; save(); render(); };

async function generatePosts(p, { goal, format, tone, platforms, angle, notes, count = 1, avoid = [] }) {
  const script = isVideo(format);
  const prompt = count === 1
    ? `Create one promo post for this product, adapted natively to each platform.
${productContext(p, { audience: true, competitors: true })}
GOAL: ${goal}. FORMAT: ${format}. TONE: ${tone}.
${angle ? "ANGLE: " + angle : "Pick the strongest angle for this audience."}
${notes ? "NOTES: " + notes : ""}
${avoid.length ? "Do not reuse these earlier hooks:\n- " + avoid.join("\n- ") : ""}
Platform rules:
${pfGuides(platforms)}
${script ? "Also write a short-form vertical video script (20-40s) the founder can film or produce faceless." : ""}
Return JSON exactly: ${postSchema(platforms, script)}`
    : `Create ${count} DIFFERENT promo posts for this product. Each post must use a different angle (pain-point, demo, founder story, objection-killer, comparison, trend, behind-the-build, use-case) and a different hook.
${productContext(p, { audience: true, competitors: true })}
GOAL: ${goal}. TONE: mix of ${TONES.slice(0, 4).join(", ")}.
${avoid.length ? "Hooks already used in earlier posts (never repeat or paraphrase them):\n- " + avoid.join("\n- ") : ""}
Platform rules:
${pfGuides(platforms)}
Every post includes a 20-35s vertical video script.
Return JSON exactly: {"posts":[ ${postSchema(platforms, true)} ]}`;
  const r = await ai({ prompt, temperature: 1 });
  const items = count === 1 ? [r.data] : arr(r.data.posts);
  return items.map((it) => {
    const out = { angle: it.angle || "", hook: it.hook || "", platforms: {}, script: it.script || null };
    for (const k of platforms) {
      const v = it.platforms?.[k];
      if (!v) continue;
      out.platforms[k] = { title: v.title || "", text: applyUtm(p, k, String(v.text || "").trim()) };
    }
    return out;
  }).filter((x) => Object.keys(x.platforms).length);
}
A.generate = () => busy("gen", async () => {
  if (ui.step === 1) readStep1();
  const d = state.draft, p = prod(d.productId);
  if (!d.platforms.length) throw new Error("Pick at least one platform");
  const [res] = await generatePosts(p, { goal: d.goal, format: d.format, tone: d.tone, platforms: d.platforms, angle: d.angle, notes: d.notes, avoid: recentHooks(p, 15) });
  if (!res) throw new Error("No content came back — try again");
  d.content = res; ui.step = 2; save();
});
A.rewrite = (el) => {
  const k = el.dataset.pf;
  const instr = $(`[data-rwi="${k}"]`)?.value.trim() || "";
  return busy("rw-" + k, async () => {
    const d = state.draft, p = prod(d.productId);
    const cur = d.content.platforms[k];
    const r = await ai({ temperature: 1, prompt: `Rewrite this ${PF[k].name} post for the product below. ${instr ? "Instruction: " + instr : "Make it sharper with a stronger hook and a different opening line."}
${productContext(p)}
Platform rule: ${PF[k].guide} Max ${PF[k].limit} characters.
CURRENT:${cur.title ? "\nTITLE: " + cur.title : ""}
${cur.text}
Return JSON: {${PF[k].title ? '"title":"...",' : ""}"text":"..."}` });
    d.content.platforms[k] = { title: r.data.title || cur.title || "", text: applyUtm(p, k, String(r.data.text || cur.text)) };
    save(); ui.keepScroll = true;
  });
};
A.copyPf = (el) => { const v = state.draft.content.platforms[el.dataset.pf]; copy((v.title ? v.title + "\n\n" : "") + v.text); };
A.postTo = (el) => {
  const k = el.dataset.pf, v = (state.draft?.content || {}).platforms?.[k];
  if (!v) return;
  const p = prod(state.draft.productId);
  copy((v.title && !["reddit", "email"].includes(k) ? v.title + "\n\n" : "") + v.text);
  window.open(PF[k].open(v.text, utm(p.url, k), v.title), "_blank", "noopener");
};
A.copyScript = () => copy(scriptText(state.draft.content.script));
A.savePost = (el) => {
  const d = state.draft, p = prod(d.productId);
  const when = $("#dWhen")?.value; const status = $("#dStatus")?.value || "draft";
  const now = new Date().toISOString();
  let post = d.id && state.posts.find((x) => x.id === d.id);
  const data = { productId: d.productId, goal: d.goal, format: d.format, tone: d.tone, angle: d.content.angle || d.angle, hook: d.content.hook, platforms: d.content.platforms, script: d.content.script, status, scheduledAt: when ? new Date(when).toISOString() : null, updatedAt: now };
  if (post) Object.assign(post, data);
  else { post = Object.assign({ id: uid(), createdAt: now, source: "composer" }, data); state.posts.unshift(post); }
  save();
  remember("post", `Post (${status}): ${p.name} — ${post.hook || post.angle}`, post.id, p.id);
  toast("Saved to library");
  state.draft = el.dataset.next ? newDraft() : null; ui.step = 1; ui.angles = null; save();
  location.hash = el.dataset.next ? "#/create" : "#/posts"; render();
};
A.openPost = (el) => {
  const post = state.posts.find((x) => x.id === el.dataset.id);
  if (!post) return toast("That post was deleted", true);
  state.activeId = post.productId;
  state.draft = { id: post.id, productId: post.productId, goal: post.goal || "Signups", format: post.format || "Text post", tone: post.tone || "Real & direct", platforms: Object.keys(post.platforms || {}), angle: post.angle || "", notes: "", content: { angle: post.angle, hook: post.hook, platforms: JSON.parse(JSON.stringify(post.platforms || {})), script: post.script }, scheduledAt: post.scheduledAt, status: post.status };
  ui.step = 2; save(); location.hash = "#/create"; render();
};
A.dupPost = (el) => {
  const post = state.posts.find((x) => x.id === el.dataset.id);
  const c = JSON.parse(JSON.stringify(post)); c.id = uid(); c.createdAt = new Date().toISOString(); c.status = "draft"; c.scheduledAt = null; c.results = null;
  state.posts.unshift(c); save(); ui.keepScroll = true; render(); toast("Duplicated");
};
A.delPost = (el) => { state.posts = state.posts.filter((x) => x.id !== el.dataset.id); save(); ui.keepScroll = true; render(); };
A.resultsPost = (el) => {
  const post = state.posts.find((x) => x.id === el.dataset.id); const r = post.results || {};
  const f = (k, l) => `<label class="f">${l}<input class="in" type="number" min="0" id="r-${k}" value="${esc(r[k] ?? "")}"></label>`;
  modal(`<div class="h2">Log results</div><p class="muted" style="margin-top:4px">${esc(post.hook)}</p>
  <div class="grid g3" style="margin-top:16px">${f("views", "Views")}${f("likes", "Likes")}${f("comments", "Comments")}${f("shares", "Shares")}${f("clicks", "Link clicks")}${f("signups", "Signups / sales")}</div>
  <div class="row end" style="margin-top:18px"><button class="btn" data-act="closeModal">Cancel</button><button class="btn pri" data-act="saveResults" data-id="${post.id}">Save & mark posted</button></div>`);
};
A.saveResults = (el) => {
  const post = state.posts.find((x) => x.id === el.dataset.id);
  post.results = {}; for (const k of ["views", "likes", "comments", "shares", "clicks", "signups"]) post.results[k] = +$("#r-" + k).value || 0;
  post.status = "posted"; if (!post.scheduledAt) post.scheduledAt = new Date().toISOString();
  save(); remember("results", `Results: ${num(post.results.views)} views — ${post.hook}`, post.id, post.productId); closeModal(); ui.keepScroll = true; render();
};

/* calendar */
A.calNav = (el) => { const n = +el.dataset.n; ui.cal = n === 0 ? new Date() : new Date(ui.cal.getFullYear(), ui.cal.getMonth() + n, 1); render(); };
const icsEsc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
A.exportIcs = () => {
  const ev = state.posts.filter((x) => x.scheduledAt && x.status !== "posted");
  if (!ev.length) return toast("Nothing scheduled to export", true);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HSW365 Media//Promo Engine//EN", "CALSCALE:GREGORIAN"];
  for (const x of ev) {
    const p = prod(x.productId);
    lines.push("BEGIN:VEVENT", `UID:${x.id}@hsw365-promo`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(x.scheduledAt)}`, `DTEND:${icsDate(new Date(x.scheduledAt).getTime() + 15 * 60e3)}`,
      `SUMMARY:${icsEsc(`Post ${p?.name || ""}: ${x.hook || x.angle}`)}`, `DESCRIPTION:${icsEsc(postAsText(x).slice(0, 6000))}`,
      "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:Post time", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  download("hsw365-promo-calendar.ics", lines.join("\r\n"), "text/calendar");
};
const csvCell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
A.exportCsv = () => {
  const rows = [["Posting Time", "Platform", "App", "Title", "Text", "Link", "Status", "Hook"]];
  for (const x of state.posts.filter((y) => y.scheduledAt).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))) {
    const p = prod(x.productId); const d = new Date(x.scheduledAt);
    const t = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    for (const [k, v] of Object.entries(x.platforms || {})) rows.push([t, PF[k]?.name || k, p?.name || "", v.title, v.text, utm(p?.url || "", k), x.status, x.hook]);
  }
  if (rows.length < 2) return toast("Nothing scheduled to export", true);
  download("hsw365-promo-schedule.csv", rows.map((r) => r.map(csvCell).join(",")).join("\n"), "text/csv");
};

/* autopilot */
function readAutoCfg() {
  return { apps: $$(".apApp:checked").map((x) => x.value), perApp: clamp(+$("#apPer").value || 3, 1, 21), perDay: clamp(+$("#apDay").value || 4, 1, 12),
    start: $("#apStart").value || toLocalInput(new Date(Date.now() + 864e5)).slice(0, 10), goal: $("#apGoal").value, platforms: $$(".apPf:checked").map((x) => x.value) };
}
A.apAll = (el) => { $$(".apApp").forEach((c) => { c.checked = el.dataset.v === "1"; c.closest(".chk").classList.toggle("on", c.checked); }); };
function buildSlots(cfg, n) {
  const hoursFor = (k) => { const base = [9, 12, 15, 18, 20, 21, 8, 10, 13, 16, 19, 22]; return base.slice(0, k).sort((a, b) => a - b); };
  const hrs = hoursFor(cfg.perDay);
  const [y, m, dd] = cfg.start.split("-").map(Number);
  const taken = new Set(state.posts.filter((x) => x.scheduledAt).map((x) => new Date(x.scheduledAt).getTime()));
  const slots = [];
  for (let day = 0; slots.length < n && day < 400; day++) for (const h of hrs) {
    if (slots.length >= n) break;
    let t = new Date(y, m - 1, dd + day, h, (slots.length * 7) % 30);
    while (taken.has(t.getTime())) t = new Date(t.getTime() + 5 * 60e3);
    taken.add(t.getTime()); slots.push(t.toISOString());
  }
  return slots;
}
A.apStart = () => {
  if (!hasKey()) { location.hash = "#/settings"; return toast("Add your free Gemini key first", true); }
  const cfg = readAutoCfg();
  if (!cfg.apps.length) return toast("Pick at least one app", true);
  if (!cfg.platforms.length) return toast("Pick at least one platform", true);
  const CH = 3;
  const per = cfg.apps.map((id) => { const chunks = []; for (let left = cfg.perApp; left > 0; left -= CH) chunks.push(Math.min(CH, left)); return { id, chunks }; });
  const jobs = [];
  for (let round = 0; per.some((x) => x.chunks[round]); round++) for (const x of per) if (x.chunks[round]) jobs.push({ id: uid(), productId: x.id, n: x.chunks[round], done: false });
  state.auto = { config: cfg, jobs, slots: buildSlots(cfg, cfg.apps.length * cfg.perApp), slotIdx: 0, created: 0, errors: 0, running: true, startedAt: new Date().toISOString(), runId: uid() };
  save(); remember("autopilot", `Autopilot started: ${cfg.apps.length} apps × ${cfg.perApp} posts`, null); runAuto();
};
A.apPause = () => { if (state.auto) state.auto.running = false; save(); render(); };
A.apResume = () => { if (!state.auto) return; state.auto.running = true; save(); runAuto(); };
let autoLoop = false;
async function runAuto() {
  if (autoLoop) return;
  autoLoop = true; softRender();
  try {
    while (state.auto?.running) {
      const a = state.auto;
      const job = a.jobs.find((j) => !j.done);
      if (!job) { a.running = false; remember("autopilot", `Autopilot finished: ${a.created} posts scheduled`, null); toast(`Autopilot done: ${a.created} posts scheduled`); break; }
      a.cursor = job.id; softRender();
      const p = prod(job.productId);
      if (!p) { job.done = true; job.error = "app removed"; continue; }
      let tries = 0;
      while (true) {
        try {
          const posts = await generatePosts(p, { goal: a.config.goal, format: "Mixed", tone: "mixed", platforms: a.config.platforms, count: job.n, avoid: recentHooks(p, 30) });
          for (const x of posts) {
            const post = { id: uid(), productId: p.id, goal: a.config.goal, format: "Short-form video + captions", tone: "mixed", angle: x.angle, hook: x.hook, platforms: x.platforms, script: x.script,
              status: "scheduled", scheduledAt: a.slots[a.slotIdx++] || nextSlot().toISOString(), createdAt: new Date().toISOString(), source: "autopilot", runId: a.runId };
            state.posts.unshift(post); a.created++;
            remember("post", `Autopilot post: ${p.name} — ${post.hook || post.angle}`, post.id, p.id);
          }
          job.done = true; break;
        } catch (e) {
          if (e.rate && tries < 2) { tries++; toast("Rate limit — waiting 45s then continuing"); await sleep(45000); if (!state.auto?.running) break; continue; }
          job.done = true; job.error = e.message; a.errors++; if (/key|Settings/i.test(e.message)) a.running = false; break;
        }
      }
      save(); softRender();
      if (state.auto?.running && state.auto.jobs.some((j) => !j.done)) await sleep(+state.settings.rateDelay || 6500);
    }
  } finally { autoLoop = false; save(); softRender(); }
}

/* links */
A.makeLink = () => {
  const p = prod();
  const url = $("#lUrl").value.trim();
  if (!/^https?:\/\//i.test(url)) return toast("Enter a full https:// destination", true);
  const l = { id: uid(), productId: p.id, label: $("#lLabel").value.trim(), source: $("#lSrc").value, medium: $("#lMed").value, campaign: $("#lCamp").value.trim() || "hsw365-promo", content: $("#lCont").value.trim(), createdAt: new Date().toISOString() };
  l.full = utm(url, l.source, l.medium, l.campaign, l.content);
  state.links.unshift(l); save(); remember("link", `Link: ${l.label || l.source} for ${p.name}`, l.id, p.id); copy(l.full); render();
};
A.copyLink = (el) => copy(state.links.find((x) => x.id === el.dataset.id).full);
A.delLink = (el) => { state.links = state.links.filter((x) => x.id !== el.dataset.id); save(); render(); };

/* catches */
A.genCatches = () => busy("catch", async () => {
  const p = prod();
  const r = await ai({ temperature: 0.8, prompt: `Find conversation opportunities ("catches") where people are actively asking for what this product solves.\n${productContext(p, { audience: true })}\nGive 8 catches across reddit, x, youtube, tiktok, quora and facebook. For each: a search query that surfaces posts from people with this problem right now (use their words, not marketing words), what intent it catches, and a genuinely helpful reply (2-4 sentences) that answers them first, discloses you are the founder, and mentions the product only as one option. No hype.
Return JSON: {"catches":[{"platform":"reddit|x|youtube|tiktok|quora|facebook","query":"","intent":"","reply":""}]}` });
  const items = arr(r.data.catches).map((c) => ({ id: uid(), productId: p.id, platform: String(c.platform || "reddit").toLowerCase(), query: c.query, intent: c.intent, reply: c.reply, done: false, createdAt: new Date().toISOString() }));
  state.catches = items.concat(state.catches); save(); remember("catches", `${items.length} catches found: ${p.name}`, null, p.id);
});
A.copyCatch = (el) => copy(state.catches.find((x) => x.id === el.dataset.id).reply);
A.doneCatch = (el) => { const c = state.catches.find((x) => x.id === el.dataset.id); c.done = !c.done; save(); ui.keepScroll = true; render(); };
A.delCatch = (el) => { state.catches = state.catches.filter((x) => x.id !== el.dataset.id); save(); ui.keepScroll = true; render(); };

/* virality */
A.virFromDraft = (el) => {
  const k = el.dataset.pf, v = state.draft.content.platforms[k];
  ui.vir = { pf: k, text: (v.title ? v.title + "\n" : "") + v.text, draftPf: k, postId: state.draft.id };
  location.hash = "#/virality";
};
A.genVirality = () => {
  const pf = $("#vPf").value, text = $("#vText").value.trim();
  if (!text) return toast("Paste something to score", true);
  ui.vir = Object.assign(ui.vir || {}, { pf, text });
  if (ui.vir.draftPf && ui.vir.draftPf !== pf) ui.vir.draftPf = null;
  return busy("vir", async () => {
    const p = prod();
    const r = await ai({ temperature: 0.4, prompt: `Score this ${PF[pf].name} post for viral potential for the product below. Be a harsh, honest judge.\n${productContext(p)}\nPOST:\n${text}\nReturn JSON: {"score":0-100,"verdict":"one punchy line","breakdown":[{"factor":"Hook strength","score":0-100,"note":""},{"factor":"Specificity","score":0-100,"note":""},{"factor":"Emotion","score":0-100,"note":""},{"factor":"Shareability","score":0-100,"note":""},{"factor":"Clarity of CTA","score":0-100,"note":""},{"factor":"Platform fit","score":0-100,"note":""}],"improved_hook":"","improved_version":"full improved post within ${PF[pf].limit} chars","tips":["3-5 specific fixes"]}` });
    ui.vir.res = r.data;
    if (ui.vir.postId) { const post = state.posts.find((x) => x.id === ui.vir.postId); if (post) { post.virality = r.data.score; save(); } }
  });
};
A.copyVir = () => copy(ui.vir.res.improved_version);
A.useVir = () => {
  const k = ui.vir.draftPf;
  if (!state.draft?.content?.platforms?.[k]) return toast("Open the post in Create first", true);
  state.draft.content.platforms[k].text = applyUtm(prod(state.draft.productId), k, ui.vir.res.improved_version);
  save(); ui.step = 2; location.hash = "#/create";
};

/* memory */
A.memSave = () => {
  const s = state.settings;
  s.cloneUrl = $("#mUrl").value.trim(); s.cloneToken = $("#mTok").value.trim(); s.cloneSync = $("#mSync").checked;
  save(); toast("Memory settings saved"); render(); if (s.cloneSync) flushSync();
};
A.memTest = () => busy("mtest", async () => {
  const url = $("#mUrl").value.trim().replace(/\/$/, ""), tok = $("#mTok").value.trim();
  const h = await fetch(url + "/health").then((r) => r.json()).catch(() => null);
  if (!h?.ok) throw new Error("Clone agent not reachable (Render free services take ~30s to wake — try again)");
  const m = await fetch(url + "/memories?limit=1", { headers: tok ? { Authorization: "Bearer " + tok } : {} });
  if (m.status === 401) throw new Error("Reached the agent, but the token was rejected");
  toast("Clone agent connected");
});
A.memPush = () => busy("mpush", async () => { A.memSaveQuiet(); await flushSync(true); toast("Memory synced"); });
A.memSaveQuiet = () => { const s = state.settings; if ($("#mUrl")) { s.cloneUrl = $("#mUrl").value.trim(); s.cloneToken = $("#mTok").value.trim(); } save(); };
A.exportAll = () => {
  const copyState = JSON.parse(JSON.stringify(state));
  copyState.settings.geminiKey = ""; copyState.settings.groqKey = ""; copyState.settings.cloneToken = "";
  download(`hsw365-promo-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(copyState, null, 1), "application/json");
};
async function importFile(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.posts)) throw new Error("Not a Promo Engine backup");
    const mergeBy = (key) => { const ids = new Set(state[key].map((x) => x.id)); for (const x of arr(data[key])) if (!ids.has(x.id)) state[key].push(x); };
    ["products", "posts", "links", "tasks", "catches", "log"].forEach(mergeBy);
    state.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    state.log.sort((a, b) => new Date(b.t) - new Date(a.t));
    save(); toast("Backup merged"); render();
  } catch (e) { toast("Import failed: " + e.message, true); }
}

/* settings */
A.saveSettings = () => {
  const s = state.settings;
  s.provider = $("#sProv").value; s.geminiKey = $("#sGem").value.trim(); s.geminiModel = $("#sGemM").value.trim() || "gemini-flash-latest";
  s.groqKey = $("#sGroq").value.trim(); s.groqModel = $("#sGroqM").value.trim() || "llama-3.3-70b-versatile";
  s.allowEmoji = $("#sEmoji").checked; s.autoUtm = $("#sUtm").checked; s.rateDelay = Math.max(1000, +$("#sDelay").value || 6500);
  save(); toast("Settings saved"); render();
};
A.testAi = () => busy("stest", async () => {
  A.saveSettingsQuiet();
  const r = await ai({ temperature: 0, prompt: 'Reply with JSON {"ok":true,"line":"one sentence hello from the HSW365 Promo Engine"}' });
  toast(r.data.line || "AI connected");
});
A.saveSettingsQuiet = () => {
  const s = state.settings;
  s.provider = $("#sProv").value; s.geminiKey = $("#sGem").value.trim(); s.geminiModel = $("#sGemM").value.trim() || "gemini-flash-latest"; s.groqKey = $("#sGroq").value.trim(); s.groqModel = $("#sGroqM").value.trim() || "llama-3.3-70b-versatile";
  save();
};
A.resetAll = () => modal(`<div class="h2">Erase everything?</div><p class="muted" style="margin-top:8px">Deletes every post, plan, task, link and memory in this browser. Export a backup first. Synced clone-agent memories are not touched.</p><div class="row end" style="margin-top:18px"><button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" data-act="resetYes">Erase</button></div>`);
A.resetYes = () => { localStorage.removeItem(KEY); closeModal(); load(); location.hash = "#/home"; render(); };

/* ---------- events ---------- */
function bind() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) { if (!e.target.closest("#side") && !e.target.closest(".burger")) $("#side")?.classList.remove("open"); return; }
    if (el.tagName === "INPUT" && el.type === "checkbox" && el.dataset.act !== "toggleTask") return;
    const fn = A[el.dataset.act];
    if (!fn) return;
    if (el.tagName === "A" && el.dataset.act === "resetDraft") e.preventDefault();
    if (el.tagName === "INPUT" && el.type === "checkbox") e.preventDefault();
    fn(el, e);
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "prodSel") { state.activeId = t.value; if (!state.draft?.content) state.draft = null; ui.angles = null; save(); render(); return; }
    if (t.matches(".chk input")) t.closest(".chk").classList.toggle("on", t.checked);
    if (t.matches(".dPf")) readStep1();
    if (t.id === "fApp" || t.id === "fStatus" || t.id === "fPf") { ui.postFilter = { app: $("#fApp").value, status: $("#fStatus").value, pf: $("#fPf").value }; render(); }
    if (t.id === "memF") { ui.memFilter = t.value; render(); }
    if (t.id === "importFile" && t.files[0]) importFile(t.files[0]);
  });
  let draftT;
  document.addEventListener("input", (e) => {
    const t = e.target;
    const key = t.dataset.draft;
    if (key && state.draft?.content) {
      const [k, field] = key.split(".");
      state.draft.content.platforms[k][field] = t.value;
      if (field === "text") { const c = $(`[data-cnt="${k}"]`); if (c) { c.textContent = `${t.value.length}/${PF[k].limit}`; c.classList.toggle("over", t.value.length > PF[k].limit); } }
      clearTimeout(draftT); draftT = setTimeout(save, 400);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "newUrl") A.addFromUrl();
    if (e.key === "Enter" && e.target.id === "taskText") A.addTask();
    if (e.key === "Escape") closeModal();
  });
  window.addEventListener("hashchange", () => { $("#side")?.classList.remove("open"); render(); $("#view").scrollTop = 0; });
  window.addEventListener("beforeunload", saveNow);
}

/* ---------- boot ---------- */
load();
shell();
bind();
render();
if (state.settings.cloneSync) flushSync();
window.HSW365Promo = { state: () => state, ai, parseJSON, utm, applyUtm, buildSlots };
})();
