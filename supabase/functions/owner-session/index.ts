// HSW365 owner PIN -> app session (Supabase Edge Function "owner-session", klipit project lsxdlmrjrcivxwgfkpop,
// the project behind HSW365 Stream and NIL365). The owner signs in with only the PIN (owner-login.js), the page
// sends the PIN session token here, and once the owner-pin service verifies it this returns a one-time sign-in
// hash for the owner's own account. The page trades it for a normal Supabase session with
// auth.verifyOtp({ token_hash, type: "magiclink" }), so the apps' existing owner-email rules (RLS, RPCs) apply.
// Only the owner email can ever be signed in here; no other account is reachable.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyOwnerToken, OWNER_HEADER } from "../_shared/owner.ts";

const OWNER_EMAIL = (Deno.env.get("OWNER_EMAIL") || "hsw365media@gmail.com").trim().toLowerCase();
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-hsw-owner, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = await req.json().catch(() => ({}));
  const token = req.headers.get(OWNER_HEADER) || String(b.token || "");
  if (!(await verifyOwnerToken(token))) return json({ error: "Owner session ended. Enter your PIN again." }, 401);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: OWNER_EMAIL });
  const hash = data?.properties?.hashed_token;
  if (error || !hash) return json({ error: "Owner sign-in is unavailable right now. Try again." }, 500);
  return json({ ok: true, email: OWNER_EMAIL, token_hash: hash, type: "magiclink" });
});
