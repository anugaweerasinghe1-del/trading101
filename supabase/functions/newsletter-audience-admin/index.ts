import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";

// Read-only owner-only overview. Legacy rows are not confirmed subscriptions.
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const reply = (data: unknown, status=200) => new Response(JSON.stringify(data), {
  status, headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-admin-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
});
function constantTimeKeyMatch(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual || expected.length !== actual.length) return false;
  let diff = 0;
  for (let i=0;i<expected.length;i++) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return diff === 0;
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return reply({},204);
  if (req.method !== "POST") return reply({error:"Method not allowed"},405);
  try {
    if (!(await allow("newsletter-audience-ip:"+clientIp(req),"newsletter-audience",60,8)))
      return reply({error:"Too many requests"},429);
    if (!constantTimeKeyMatch(Deno.env.get("ADMIN_MASTER_KEY"),req.headers.get("x-admin-key")))
      return reply({error:"Incorrect TradeHQ admin master key"},401);
    const input = await req.json().catch(()=>null);
    if (input?.action !== "summary") return reply({error:"Unknown action"},400);
    const [{count,error:counterError},{data,error:listError}] = await Promise.all([
      db.from("subscribers").select("id",{count:"exact",head:true}),
      db.from("subscribers").select("email,subscribed_at,source").order("subscribed_at",{ascending:false}).limit(250),
    ]);
    if(counterError||listError) return reply({error:"Subscriber records are unavailable"},503);
    return reply({data:{
      legacyRecordsTotal:count ?? 0,
      confirmedSubscribers:0,
      unsubscribesTracked:false,
      records:data ?? [],
      notice:"These historical email addresses lack subscription confirmation evidence and unsubscribe status. They are not an authorized recipient list.",
    }});
  } catch {
    return reply({error:"Audience metrics temporarily unavailable"},503);
  }
});