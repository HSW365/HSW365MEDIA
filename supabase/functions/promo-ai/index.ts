// HSW365 Promo Engine — AI proxy (Supabase Edge Function "promo-ai", project friendy)
// Holds the AI keys server-side so the public /promo page never ships them.
// Gemini first (live web research); on rate limit or outage it falls back to Groq.
// Auth: header x-promo-key must match PROMO_ACCESS_KEY (owner access code).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ACCESS = Deno.env.get("PROMO_ACCESS_KEY") || "__PROMO_ACCESS_KEY__";
const GEMINI = () => Deno.env.get("GEMINI_API_KEY") || "";
const GROQ = () => Deno.env.get("GROQ_API_KEY") || "__GROQ_API_KEY__";
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
const GROQ_MODELS = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "openai/gpt-oss-20b"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-promo-key, authorization, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

class AiError extends Error {
  constructor(msg: string, public rate = false, public status = 502) { super(msg); }
}

const decode = (t: string) => t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
// Fetch a live page and reduce it to readable text so the model audits the real site, not a guess.
async function pageText(u: string): Promise<string> {
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return "";
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "Mozilla/5.0 (compatible; HSW365PromoBot/1.0; +https://hsw365media.com)", Accept: "text/html,*/*" } });
    const html = (await r.text()).slice(0, 600000);
    const pick = (re: RegExp) => decode((html.match(re)?.[1] || "").trim());
    const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const desc = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
    const og = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i);
    const text = decode(html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<h([1-3])[^>]*>/gi, "\n[H$1] ")
      .replace(/<(button)[^>]*>/gi, "\n[BUTTON] ")
      .replace(/<(p|li|div|section|br|tr)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "))
      .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
    return `URL: ${r.url}\nHTTP STATUS: ${r.status}\nTITLE: ${title}\nMETA DESCRIPTION: ${desc || "(none)"}\nSOCIAL IMAGE: ${og ? "yes" : "none"}\nVISIBLE TEXT:\n${text.slice(0, 14000)}`;
  } catch (e) {
    return `URL: ${u}\nCOULD NOT FETCH: ${(e as Error).message}`;
  }
}

async function gemini(system: string, prompt: string, wantJson: boolean, web: boolean, temperature: number) {
  const key = GEMINI();
  if (!key) throw new AiError("Gemini not configured");
  let last: AiError | null = null;
  const notes: string[] = [];
  // Web attempts first on every model (grounding quotas differ per model), then plain generation.
  const TOOLSETS = [[{ url_context: {} }], [{ google_search: {} }]];
  const attempts: [string, unknown[] | null][] = [];
  if (web) for (const m of GEMINI_MODELS) for (const t of TOOLSETS) attempts.push([m, t]);
  for (const m of GEMINI_MODELS) attempts.push([m, null]);
  const dead = new Set<string>();
  for (const [model, tools] of attempts) {
    if (dead.has(model)) continue;
    const useTools = !!tools;
    {
      const body: Record<string, unknown> = {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt + (useTools ? "\n\nUse web search and the URL context tool to read live pages before answering. Return only the JSON." : "") }] }],
        generationConfig: { temperature, ...(wantJson && !useTools ? { responseMimeType: "application/json" } : {}) },
      };
      if (tools) body.tools = tools;
      let res: Response, data: any;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        data = await res.json().catch(() => ({}));
      } catch { last = new AiError("Network error reaching Gemini"); continue; }
      const tag = `${model}${tools ? " web:" + tools.map((t: any) => Object.keys(t)[0]).join("+") : ""}`;
      const msg = data?.error?.message || "";
      if (!res.ok) notes.push(`${tag} ${res.status}: ${msg.slice(0, 90)}`);
      if (res.status === 429) { last = new AiError(`Gemini rate limit (${tag})`, true, 429); if (!useTools) dead.add(model); continue; }
      if (res.status === 404 || (!useTools && /not found|not supported/i.test(msg))) { last = new AiError(`Model ${model} unavailable`); dead.add(model); continue; }
      if (res.status === 503) { last = new AiError("Gemini overloaded", true, 503); dead.add(model); continue; }
      if (!res.ok) { last = new AiError(`${tag}: ${msg || "Gemini error " + res.status}`); continue; }
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts || []).map((p: any) => p.text || "").join("");
      if (!text) { notes.push(`${tag} empty: ${cand?.finishReason || "?"}`); last = new AiError(cand?.finishReason === "SAFETY" ? "Blocked by safety filter — rephrase." : "Empty AI response"); continue; }
      const sources = (cand?.groundingMetadata?.groundingChunks || []).map((g: any) => g.web).filter(Boolean).map((w: any) => ({ title: w.title || w.uri, uri: w.uri }));
      return { text, sources, web: useTools, provider: "gemini", model, ...(notes.length ? { notes: notes.slice(0, 12) } : {}) };
    }
  }
  throw last || new AiError("Gemini unavailable");
}

async function groq(system: string, prompt: string, wantJson: boolean, temperature: number) {
  const key = GROQ();
  if (!key || key.startsWith("__")) throw new AiError("Groq not configured");
  let last: AiError | null = null;
  for (const model of GROQ_MODELS) {
    for (const fmt of wantJson ? [true, false] : [false]) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({
          model, temperature,
          ...(fmt ? { response_format: { type: "json_object" } } : {}),
          messages: [{ role: "system", content: system }, { role: "user", content: prompt + (wantJson ? "\nReturn a JSON object only." : "") }],
        }),
      }).catch(() => null);
      if (!res) { last = new AiError("Network error reaching Groq"); continue; }
      const data: any = await res.json().catch(() => ({}));
      if (res.status === 429) { last = new AiError("Groq rate limit", true, 429); break; }
      if (!res.ok) { last = new AiError(data?.error?.message || "Groq error " + res.status); if (fmt) continue; break; }
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) { last = new AiError("Empty AI response"); continue; }
      return { text, sources: [], web: false, provider: "groq", model };
    }
  }
  throw last || new AiError("Groq unavailable");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const authed = req.headers.get("x-promo-key") === ACCESS;
  if (req.method === "GET") {
    return json({ ok: true, service: "hsw365-promo-ai", authed, gemini: !!GEMINI(), groq: !GROQ().startsWith("__") && !!GROQ() });
  }
  if (!authed) return json({ error: "Access code required" }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const system = String(body.system || "").slice(0, 20000);
  let prompt = String(body.prompt || "").slice(0, 60000);
  const urls = (Array.isArray(body.urls) ? body.urls : []).filter((u: unknown) => typeof u === "string").slice(0, 3);
  if (urls.length) {
    const pages = await Promise.all(urls.map(pageText));
    prompt += "\n\nLIVE PAGE CONTENT (fetched just now — base your answer on this):\n" + pages.join("\n\n-----\n\n");
  }
  if (!prompt) return json({ error: "prompt required" }, 400);
  const wantJson = body.json !== false;
  const web = !!body.web;
  const temperature = Math.max(0, Math.min(1.5, Number(body.temperature ?? 0.9)));
  const order = body.provider === "groq" && !web ? ["groq", "gemini"] : ["gemini", "groq"];
  const errors: string[] = [];
  let rate = false;
  for (const p of order) {
    try {
      const out = p === "gemini" ? await gemini(system, prompt, wantJson, web, temperature) : await groq(system, prompt, wantJson, temperature);
      return json(errors.length ? { ...out, fallback: errors } : out);
    } catch (e) {
      const err = e as AiError;
      errors.push(`${p}: ${err.message}`);
      rate = rate || err.rate;
    }
  }
  return json({ error: rate ? "Both AI providers are rate limited right now. Give it a minute." : errors.join(" | "), rate }, rate ? 429 : 502);
});
