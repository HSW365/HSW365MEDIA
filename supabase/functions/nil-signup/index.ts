// NIL365 signup — creates a confirmed account server-side so new members are never blocked by
// Supabase's built-in confirmation-email rate limit. The nil_handle_new_user trigger builds the profile
// from user_metadata. Client signs in with the same email and password right after.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const ROLES = ["athlete", "student", "creator", "brand"];
const TEXT = ["full_name", "school", "level", "sport", "position", "state", "city", "guardian_name", "guardian_email", "instagram", "tiktok", "youtube", "x_handle", "bio", "company", "website", "industry", "budget_range", "terms_signed_name", "terms_version"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const m = b.meta || {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email." }, 400);
  if (password.length < 8 || password.length > 128) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!ROLES.includes(m.role)) return json({ error: "Pick who you are." }, 400);
  const name = String(m.full_name || "").trim();
  if (name.length < 2 || name.length > 80) return json({ error: "Enter your full name." }, 400);
  if (String(m.terms_signed_name || "").trim().toLowerCase().replace(/\s+/g, " ") !== name.toLowerCase().replace(/\s+/g, " ")) return json({ error: "Type your full name to sign the terms." }, 400);
  if (m.is_minor && (!m.guardian_name || !m.guardian_email || !m.guardian_consent)) return json({ error: "Members under 18 need a parent or guardian name, email and consent." }, 400);

  const meta: Record<string, unknown> = { app: "nil365", role: m.role, is_minor: !!m.is_minor, guardian_consent: !!m.guardian_consent };
  for (const k of TEXT) if (m[k] != null && String(m[k]).trim()) meta[k] = String(m[k]).trim().slice(0, k === "bio" ? 600 : 120);
  if (m.grad_year) meta.grad_year = String(parseInt(m.grad_year) || "");
  if (m.followers) meta.followers = String(Math.max(0, parseInt(m.followers) || 0));
  if (Array.isArray(m.niches)) meta.niches = m.niches.filter((x: unknown) => typeof x === "string").slice(0, 16).map((x: string) => x.slice(0, 40));

  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (error) {
    const msg = /already|registered|exists/i.test(error.message) ? "That email already has an account. Log in instead." : error.message;
    return json({ error: msg }, 400);
  }
  return json({ ok: true });
});
