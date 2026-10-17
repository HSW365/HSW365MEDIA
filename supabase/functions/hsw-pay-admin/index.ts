// HSW365 Payments — owner console API. Deployed to each Supabase project that holds app accounts
// (klipit project: SpeekZone, HSW365 Stream; friendy project: CaptureItLive/Yogo).
// Auth: header x-promo-key must equal OWNER_KEY (the owner access code). Writes go through hsw_pay_decide().
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OWNER_KEY = Deno.env.get("OWNER_KEY") || "__OWNER_KEY__";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-promo-key, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.headers.get("x-promo-key") !== OWNER_KEY) return json({ error: "Owner access code required" }, 401);
  const b = await req.json().catch(() => ({}));
  try {
    if (b.a === "list") {
      const { data, error } = await db.from("hsw_payments").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return json({ payments: data });
    }
    if (b.a === "decide" && b.id) {
      const { data, error } = await db.rpc("hsw_pay_decide", { p_id: b.id, p_approve: !!b.approve });
      if (error) throw error;
      return json({ payment: data });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
