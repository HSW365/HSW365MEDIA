// HSW365 owner PIN session check, shared by the edge functions in this repo.
// The browser sends the signed token from owner-login.js (window.HSW_OWNER_TOKEN) in the
// "x-hsw-owner" header. The owner-pin service is the only thing that can vouch for it, so every
// token is re-checked there; a positive answer is cached for 5 minutes per function instance.
const OWNER_PIN_API = "https://lsxdlmrjrcivxwgfkpop.supabase.co/functions/v1/owner-pin";
const TTL = 5 * 60 * 1000;
const ok = new Map<string, number>();

export const OWNER_HEADER = "x-hsw-owner";

export async function verifyOwnerToken(token: string | null | undefined): Promise<boolean> {
  const t = String(token || "").trim();
  if (!t || t.length > 512 || !t.includes(".")) return false;
  const hit = ok.get(t);
  if (hit && hit > Date.now()) return true;
  try {
    const r = await fetch(OWNER_PIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: "verify", token: t }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j && j.ok === true) {
      if (ok.size > 200) ok.clear();
      ok.set(t, Date.now() + TTL);
      return true;
    }
  } catch { /* network trouble: treat as not verified */ }
  ok.delete(t);
  return false;
}

export function isOwnerRequest(req: Request): Promise<boolean> {
  return verifyOwnerToken(req.headers.get(OWNER_HEADER));
}
