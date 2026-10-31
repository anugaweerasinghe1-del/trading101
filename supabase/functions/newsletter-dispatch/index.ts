import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth:{persistSession:false},
});
const hdrs={
 "Content-Type":"application/json; charset=utf-8",
 "Cache-Control":"no-store",
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-admin-key",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
};
const reply=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:hdrs});
const escape=(v:string)=>v.replaceAll("&","&amp;").replaceAll("<","&lt;")
 .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const validKey=(expect:string|undefined,actual:string|null)=>{
 if(!expect||!actual||expect.length!==actual.length)return false;
 let d=0;for(let i=0;i<expect.length;i++)d|=expect.charCodeAt(i)^actual.charCodeAt(i);
 return d===0;
};
const SITE="https://www.thetradehq.com";
function safeInline(raw:string){
 let s=escape(raw);
 s=s.replace(/\[([^\]\n]{1,120})\]\((https:\/\/[a-z0-9.-]+\/[^\s)<>]{0,400})\)/gi,
 (_,label:string,url:string)=>'<a style="color:#145baf;text-decoration:underline" href="'+url.replaceAll("&","&amp;")+'">'+label+"</a>");
 s=s.replace(/\*\*([^*\n]{1,250})\*\*/g,"<strong>$1</strong>");
 s=s.replace(/(?<!\*)\*([^*\n]{1,250})\*(?!\*)/g,"<em>$1</em>");
 return s;
}
function mailHtml(title:string,preheader:string,md:string,unsubscribeUrl:string) {
 const content=md.split(/\r?\n/).map(raw=>{
  const s=raw.trim();if(!s)return "";
  if(s.startsWith("# "))return '<h1 style="font-size:27px;line-height:1.35;color:#142238;margin:26px 0 18px">'+safeInline(s.slice(2))+"</h1>";
  if(s.startsWith("## "))return '<h2 style="font-size:19px;line-height:1.4;color:#203451;margin:26px 0 12px">'+safeInline(s.slice(3))+"</h2>";
  if(s.startsWith("|"))return '<p style="font-family:monospace;font-size:13px;line-height:1.5;overflow-wrap:anywhere">'+safeInline(s)+"</p>";
  if(s.startsWith("- "))return '<p style="margin:6px 0 10px 16px">• '+safeInline(s.slice(2))+"</p>";
  return '<p style="margin:0 0 16px">'+safeInline(s)+"</p>";
 }).join("\n");
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><title>'+
 escape(title)+'</title></head><body style="margin:0;padding:28px 12px;background:#f4f6fa;font-family:Arial,sans-serif;color:#243047">'+
 '<div style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5eaf1;border-radius:14px;padding:35px">'+
 '<div style="font-size:11px;letter-spacing:3px;color:#3d6185;font-weight:bold">TRADEHQ WEEKLY</div>'+
 '<p style="font-size:13px;color:#627184;margin:22px 0">'+escape(preheader)+'</p>'+
 '<div style="font-size:15px;line-height:1.8">'+content+'</div>'+
 '<div style="border-top:1px solid #e5eaf1;margin-top:28px;padding-top:18px;color:#6b7789;font-size:12px;line-height:1.6">'+
 'You subscribed to TradeHQ Weekly, an independent beginner financial-education newsletter. '+
 '<a href="'+unsubscribeUrl+'" style="color:#145baf">Unsubscribe instantly</a> · '+
 '<a href="'+SITE+'/privacy" style="color:#145baf">Privacy</a>. Financial education only.</div>'+
 '</div></body></html>';
}
Deno.serve(async req => {
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:hdrs});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try {
  if(!(await allow("newsletter-dispatch-ip:"+clientIp(req),"newsletter-dispatch",60,15)))return reply({error:"Too many requests"},429);
  if(!validKey(Deno.env.get("ADMIN_MASTER_KEY"),req.headers.get("x-admin-key")))
    return reply({error:"Invalid TradeHQ admin key"},401);
  const raw=await req.text();if(raw.length>1500)return reply({error:"Too large"},413);
  const input=JSON.parse(raw);
  if(input?.action==="status") {
    const [contacts,delivered]=await Promise.all([
     db.from("newsletter_contacts").select("id,email,status,confirmed_at,unsubscribed_at,source")
       .order("created_at",{ascending:false}).limit(250),
     db.from("newsletter_deliveries").select("edition_id,status,provider_id,created_at")
       .order("created_at",{ascending:false}).limit(50),
    ]);
    if(contacts.error||delivered.error)return reply({error:"Private newsletter registry unavailable"},503);
    const rows=contacts.data??[];
    const [allConfirmed,allUnsub,allPending,allBounce]=await Promise.all(
      ["confirmed","unsubscribed","pending","bounced"].map(s=>
        db.from("newsletter_contacts").select("id",{count:"exact",head:true}).eq("status",s))
    );
    return reply({data:{
     counts:{confirmed:allConfirmed.count??0,unsubscribed:allUnsub.count??0,
       pending:allPending.count??0,bounced:allBounce.count??0},
     subscribers:rows, recentDeliveries:delivered.data??[],
     webhookConfigured:Boolean(Deno.env.get("RESEND_WEBHOOK_SECRET")), 
     limitInfo:"At most 20 recipients per manual publish request; 60 newsletters/day and 2000/month by application guard. Confirmation emails also consume Resend's provider quota.",
    }});
  }
  if(input?.action!=="publish"||input?.confirmed!==true)return reply({error:"Explicit publish confirmation required"},400);
  const id=input.editionId,rev=input.revision;
  if(typeof id!=="string"||!/^[a-f0-9-]{36}$/i.test(id)||!Number.isInteger(rev))
   return reply({error:"Invalid edition"},400);
  const {data:edition,error:edError}=await db.from("newsletter_editions")
   .select("id,revision,status,subject,preheader,body_markdown").eq("id",id).eq("revision",rev)
   .eq("status","approved").maybeSingle();
  if(edError||!edition)return reply({error:"Only the exact approved revision can be published"},409);
  const key=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("NEWSLETTER_FROM_EMAIL");
  if(!key||!from)return reply({error:"Resend provider not configured"},503);
  if(!Deno.env.get("RESEND_WEBHOOK_SECRET"))return reply({error:"Resend signed delivery webhook not configured. Publishing stays disabled until bounce and complaint suppression is connected."},503);

  // Free-tier headroom: reserve at least 40 daily / 500 monthly API messages
  // for double-opt-in confirmations, other testing and provider uncertainty.
  const now=new Date();
  const day=now.toISOString().slice(0,10)+"T00:00:00.000Z";
  const month=now.toISOString().slice(0,7)+"-01T00:00:00.000Z";
  const [today,monthly]=await Promise.all([
    db.from("newsletter_deliveries").select("id",{count:"exact",head:true}).gte("created_at",day),
    db.from("newsletter_deliveries").select("id",{count:"exact",head:true}).gte("created_at",month),
  ]);
  if(today.error||monthly.error)return reply({error:"Quota check unavailable"},503);
  const room=Math.min(20,Math.max(0,60-(today.count??0)),Math.max(0,2000-(monthly.count??0)));
  if(room<=0)return reply({data:{sent:0,remaining:0,message:"App-level free-tier safety limit reached for this period."}});
  const {data:confirmed,error:contactError}=await db.from("newsletter_contacts")
    .select("id,email,status,unsubscribe_token").eq("status","confirmed")
    .order("created_at",{ascending:true}).limit(300);
  if(contactError||!confirmed)return reply({error:"Subscriber registry unavailable"},503);
  const {data:existing,error:existingError}=await db.from("newsletter_deliveries")
    .select("contact_id").eq("edition_id",id).limit(1000);
  if(existingError)return reply({error:"Delivery ledger unavailable"},503);
  const done=new Set((existing??[]).map(r=>r.contact_id));
  let accepted=0,rejected=0,unknown=0,skipped=0;
  for(const contact of confirmed) {
    if(accepted+rejected+unknown>=room)break;
    if(done.has(contact.id)){skipped++;continue;}
    // Reserve BEFORE contacting provider; the unique key prevents duplicate sends on retries.
    const {data:reservation,error:reserveError}=await db.from("newsletter_deliveries")
      .insert({edition_id:id,revision:rev,contact_id:contact.id,status:"reserved"})
      .select("id").single();
    if(reserveError||!reservation){skipped++;continue;}
    const {data:stillSubscribed}=await db.from("newsletter_contacts")
      .select("status").eq("id",contact.id).maybeSingle();
    if(stillSubscribed?.status!=="confirmed") {
      await db.from("newsletter_deliveries").update({status:"rejected",error_code:"not_confirmed_at_send"})
       .eq("id",reservation.id);
      skipped++;continue;
    }
    const url=SITE+"/newsletter/unsubscribe#token="+contact.unsubscribe_token;
    const oneClick=Deno.env.get("SUPABASE_URL")+"/functions/v1/newsletter-public?token="+contact.unsubscribe_token;
    let state:"accepted"|"rejected"|"unknown"="unknown",providerId:string|null=null,errorCode:string|null=null;
    try {
      const response=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{
          "Authorization":"Bearer "+key,"Content-Type":"application/json",
          "Idempotency-Key":"tradehq-weekly-"+id+"-"+contact.id,
        },
        body:JSON.stringify({
          from:"TradeHQ <"+from+">",to:[contact.email],subject:edition.subject,
          html:mailHtml(edition.subject,edition.preheader,edition.body_markdown,url),
          text:edition.preheader+"\n\n"+edition.body_markdown+"\n\nUnsubscribe: "+url+
              "\nPrivacy: "+SITE+"/privacy",
          headers:{"List-Unsubscribe":"<"+oneClick+">","List-Unsubscribe-Post":"List-Unsubscribe=One-Click"},
        }),
        signal:AbortSignal.timeout(14000),
      });
      if(response.ok){
        const responseData=await response.json().catch(()=>({}));
        if(responseData?.id){state="accepted";providerId=responseData.id;}
        else errorCode="missing_provider_receipt";
      }else {state="rejected";errorCode="provider_http_"+response.status;}
    }catch{errorCode="provider_response_unknown";}
    await db.from("newsletter_deliveries")
      .update({status:state,provider_id:providerId,error_code:errorCode,updated_at:new Date().toISOString()})
      .eq("id",reservation.id).eq("status","reserved");
    if(state==="accepted")accepted++;
    else if(state==="rejected")rejected++;
    else unknown++;
    // Explicitly NO automatic retry: a timeout may mean Resend accepted the mail.
  }
  const {count:all} = await db.from("newsletter_contacts").select("id",{count:"exact",head:true}).eq("status","confirmed");
  return reply({data:{accepted,rejected,unknown,skipped,eligible:all??0,
    note:"Provider acceptance does not prove inbox delivery. Only confirmed subscribers are eligible. Reload and use Publish again if eligible recipients remain; deduplication prevents resending the same edition."}});
 } catch {
   return reply({error:"Publishing service unavailable. No automatic retry was attempted."},503);
 }
});