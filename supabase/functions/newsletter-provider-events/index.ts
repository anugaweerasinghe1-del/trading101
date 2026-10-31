import { createClient } from "npm:@supabase/supabase-js@2.75.1";

const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{
 auth:{persistSession:false},
});
function dec64(base64:string):Uint8Array {
 const binary=atob(base64);return Uint8Array.from(binary, c=>c.charCodeAt(0));
}
function same(a:string,b:string){
 if(a.length!==b.length)return false;
 let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
 return d===0;
}
Deno.serve(async req=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 try {
  const secret=Deno.env.get("RESEND_WEBHOOK_SECRET");
  if(!secret?.startsWith("whsec_"))return new Response("Webhook not configured",{status:503});
  const id=req.headers.get("svix-id")||"";
  const time=req.headers.get("svix-timestamp")||"";
  const signature=req.headers.get("svix-signature")||"";
  if(!id || !/^[0-9]{9,13}$/.test(time) || !signature)
    return new Response("Missing signature",{status:401});
  if(Math.abs(Date.now()/1000-Number(time))>300)return new Response("Expired",{status:401});
  const raw=await req.text();
  if(raw.length>12000)return new Response("Too large",{status:413});
  const hmac=await crypto.subtle.importKey("raw",dec64(secret.slice(6)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const actual=btoa(String.fromCharCode(...new Uint8Array(
   await crypto.subtle.sign("HMAC",hmac,new TextEncoder().encode(id+"."+time+"."+raw))
  )));
  if(!signature.split(" ").some(sig=>sig.startsWith("v1,") && same(sig.slice(3),actual)))
    return new Response("Invalid signature",{status:401});
  const event=JSON.parse(raw);
  const kind=String(event?.type||"");
  const providerId=String(event?.data?.email_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(providerId))return new Response("ok",{status:200});
  const states:Record<string,string>={
    "email.delivered":"delivered",
    "email.bounced":"bounced",
    "email.complained":"complained",
    "email.suppressed":"bounced",
  };
  const state=states[kind];
  if(!state)return new Response("ok",{status:200});
  const {data:record,error:readError}=await db.from("newsletter_deliveries")
    .select("id,contact_id,status").eq("provider_id",providerId).maybeSingle();
  if(readError)return new Response("Database unavailable",{status:503});
  if(!record)return new Response("ok",{status:200}); // Does not alter owner-only test receipts.
  const safeState=["bounced","complained"].includes(record.status) && state==="delivered" ? record.status : state;
  const {error}=await db.from("newsletter_deliveries")
    .update({status:safeState,updated_at:new Date().toISOString()}).eq("id",record.id);
  if(error)return new Response("Update failed",{status:503});
  if(safeState==="bounced" || safeState==="complained") {
    const {error:contactError}=await db.from("newsletter_contacts")
      .update({status:safeState}).eq("id",record.contact_id).eq("status","confirmed");
    if(contactError)return new Response("Suppression update failed",{status:503});
  }
  return new Response("ok",{status:200});
 }catch{
  return new Response("Invalid event",{status:400});
 }
});