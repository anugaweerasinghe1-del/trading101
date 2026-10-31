import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const SITE = "https://www.thetradehq.com";
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (x: unknown, status=200) => new Response(JSON.stringify(x), {status,headers});
const OK = { message: "If the address is eligible, check its inbox for a confirmation link." };
const emailIsValid = (s: string) =>
  s.length <= 254 && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(s);
function hex(bytes: Uint8Array) { return Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function digest(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));
}
async function unsubscribe(token: string): Promise<boolean> {
  if(!/^[a-f0-9]{64}$/.test(token)) return false;
  const {data,error} = await db.from("newsletter_contacts")
    .update({status:"unsubscribed",unsubscribed_at:new Date().toISOString(),confirmation_token_hash:null})
    .eq("unsubscribe_token",token).in("status",["pending","confirmed","unsubscribed"])
    .select("id").maybeSingle();
  return !error && Boolean(data);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers});
  if(req.method !== "POST") return json({error:"Method not allowed"},405);
  try {
    const url = new URL(req.url);
    if (!(await allow("newsletter-public-ip:"+clientIp(req),"newsletter-public",3600,18)))
      return json({error:"Too many requests. Please try later."},429);
    // RFC 8058 one-click. No GET side effects; only long random token can unsubscribe.
    const headerUnsub = url.searchParams.get("token");
    if (headerUnsub && req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const form = await req.text();
      if(form.length>200 || !new URLSearchParams(form).has("List-Unsubscribe"))
        return json({error:"Invalid one-click request"},400);
      await unsubscribe(headerUnsub);
      return new Response("",{status:200,headers:{"Cache-Control":"no-store"}});
    }
    const raw=await req.text();
    if(raw.length>1600) return json({error:"Request too large"},413);
    const input=JSON.parse(raw);
    if(input?.action==="unsubscribe") {
      if(typeof input.token!=="string") return json({error:"Invalid link"},400);
      const worked=await unsubscribe(input.token);
      return json({message:worked?"You have been unsubscribed.":"This link is no longer valid.",unsubscribed:worked});
    }
    if(input?.action==="confirm") {
      if(typeof input.token!=="string" || !/^[a-f0-9]{64}$/.test(input.token))
        return json({error:"Invalid confirmation link"},400);
      const hashed=await digest(input.token);
      const {data,error}=await db.from("newsletter_contacts")
        .update({status:"confirmed",confirmed_at:new Date().toISOString(),confirmation_token_hash:null,confirmation_expires_at:null})
        .eq("confirmation_token_hash",hashed).eq("status","pending")
        .gt("confirmation_expires_at",new Date().toISOString()).select("id").maybeSingle();
      if(error) return json({error:"Confirmation temporarily unavailable"},503);
      return json({confirmed:Boolean(data),message:data?"Subscription confirmed! Your next issue will arrive after editorial approval.":"This confirmation link is expired or has already been used."});
    }
    if(input?.action!=="subscribe") return json({error:"Unknown action"},400);
    if(input.honeypot || input.consent!==true) return json({error:"Please agree to receive the newsletter."},400);
    const email=String(input.email ?? "").trim().toLowerCase();
    if(!emailIsValid(email)) return json({error:"Enter a valid email address."},400);
    if(!(await allow("newsletter-subscribe-email:"+email,"newsletter-email",86400,3))) return json(OK);
    const {data:prior,error:priorError}=await db.from("newsletter_contacts")
       .select("id,status,confirmation_sent_at").eq("email",email).maybeSingle();
    if(priorError) return json({error:"Signup temporarily unavailable"},503);
    if(prior?.status==="confirmed" || prior?.status==="unsubscribed" || prior?.status==="bounced" || prior?.status==="complained") return json(OK);
    if(prior?.confirmation_sent_at && Date.now()-Date.parse(prior.confirmation_sent_at)<15*60_000) return json(OK);
    // Reserve the free Resend daily quota for existing readers and other app mail.
    // Public confirmation requests must not consume an unlimited daily volume.
    const today=new Date().toISOString().slice(0,10)+"T00:00:00.000Z";
    const {count:confirmationsToday,error:quotaError}=await db.from("newsletter_contacts")
      .select("id",{count:"exact",head:true}).gte("confirmation_sent_at",today);
    if(quotaError)return json({error:"Confirmation quota unavailable"},503);
    if((confirmationsToday??0)>=30)return json({error:"Daily email confirmation limit reached. Try tomorrow."},429);
    const token=hex(crypto.getRandomValues(new Uint8Array(32)));
    const confirmationHash=await digest(token);
    const record={
      email, status:"pending", source:"website_explicit_signup",
      confirmation_token_hash:confirmationHash,
      confirmation_expires_at:new Date(Date.now()+48*3600_000).toISOString(),
      confirmation_sent_at:new Date().toISOString(),
    };
    if(prior) {
      const {error}=await db.from("newsletter_contacts").update(record)
        .eq("id",prior.id).eq("status","pending");
      if(error) return json({error:"Signup temporarily unavailable"},503);
    } else {
      const {error}=await db.from("newsletter_contacts").insert(record);
      if(error) {
        if(error.code==="23505") return json(OK);
        return json({error:"Signup temporarily unavailable"},503);
      }
    }
    const apiKey=Deno.env.get("RESEND_API_KEY"),sender=Deno.env.get("NEWSLETTER_FROM_EMAIL");
    if(!apiKey || !sender) return json({error:"Confirmation email service is not configured"},503);
    const link=SITE+"/newsletter/confirm?token="+token;
    const send=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json",
       "Idempotency-Key":"tradehq-optin-"+confirmationHash.slice(0,32)},
      body:JSON.stringify({
        from:"TradeHQ <"+sender+">",to:[email],
        subject:"Confirm your TradeHQ Weekly subscription",
        text:"Please confirm that you requested TradeHQ Weekly. Confirm: "+link+
          "\n\nIf you didn't ask for this, ignore this email. No subscription is active until you confirm.",
        html:'<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:32px"><div style="max-width:520px;margin:auto;padding:28px;background:#fff;color:#152238;border-radius:12px"><h1 style="font-size:23px">One click to confirm</h1><p>You requested the free TradeHQ Weekly newsletter. Confirm your email address to receive educational lessons.</p><p><a href="'+link+'" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#165f9d;color:#fff">Confirm my subscription</a></p><p style="font-size:12px;color:#64748b">If you did not request this, simply ignore the message.</p></div></body></html>',
      }),
      signal:AbortSignal.timeout(12000),
    }).catch(()=>null);
    // Never mark someone subscribed due to an API call; explicit confirmation is required.
    if(!send?.ok) return json({error:"We could not send your confirmation email. Please try again later."},503);
    return json(OK);
  } catch {
    return json({error:"Newsletter temporarily unavailable"},503);
  }
});