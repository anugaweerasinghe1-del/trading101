import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";
import { FOUNDATIONS_VERSION, getFoundationsEligibility } from "../_shared/foundationsProgramme.ts";
import { TROPHY_CHALLENGE_VERSION, trophyChallenge, publicTrophyChallenge, gradeTrophyChallenge } from "../_shared/trophyChallengeBank.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const headers = {
  "Content-Type": "application/json", "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
const ver = TROPHY_CHALLENGE_VERSION;
const ids = [
  "first-light","field-notes","market-compass","order-desk","price-detective",
  "risk-aware","position-architect","exit-planner","cost-counter","portfolio-lens",
  "first-practice-trade","pause-button","scenario-explorer","decision-review",
  "second-look","case-solver","case-collector","steady-learner",
  "knowledge-builder","foundations-graduate",
] as const;
type Id = typeof ids[number];
type Evidence = { source: string; source_key: string; programme_version: string; result: string; points: number; possible: number };
type Share = { enabled: boolean; flair: string | null; pins: string[] };
const emptyShare = (): Share => ({ enabled: false, flair: null, pins: [] });

async function loadReviewedDaily() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin.from("daily_practice_batches")
    .select("id,revision,document,effective_from")
    .lte("effective_from", today).not("reviewed_at", "is", null)
    .order("effective_from", { ascending: false }).order("revision", { ascending: false })
    .limit(1).maybeSingle();
  if (error || !data || !data.document || !Array.isArray(data.document.exercises)) throw Error("Daily bank unavailable");
  const exercises: unknown[] = data.document.exercises;
  if (exercises.length < 5 || exercises.length > 100) throw Error("Invalid reviewed Daily bank");
  const cases = exercises.map((value: unknown) => {
    if (!value || typeof value !== "object") throw Error("Invalid case");
    const e = value as Record<string, unknown>;
    const qs = e.questions;
    if (typeof e.id !== "string" || !/^[a-z0-9-]{4,60}$/.test(e.id) ||
        typeof e.title !== "string" || typeof e.scenario !== "string" ||
        !Array.isArray(qs) || qs.length !== 10) throw Error("Invalid Daily case");
    const questions = qs.map((raw: unknown) => {
      if (!raw || typeof raw !== "object") throw Error("Invalid question");
      const q = raw as Record<string, unknown>;
      if (typeof q.prompt !== "string" || !Array.isArray(q.options) ||
          q.options.length < 2 || q.options.length > 5 ||
          !q.options.every(o => typeof o === "string" && o.length > 0 && o.length <= 300) ||
          !Number.isInteger(q.correctAnswer) || Number(q.correctAnswer) < 0 ||
          Number(q.correctAnswer) >= q.options.length) throw Error("Invalid question key");
      return { prompt: q.prompt, options: q.options as string[], correct: Number(q.correctAnswer) };
    });
    return { id: e.id as string, title: e.title as string, detail: (e.scenario as string).slice(0, 2400), questions };
  });
  if (new Set(cases.map(x => x.id)).size !== cases.length) throw Error("Duplicate Daily case");
  return { version: "daily:" + String(data.document.id) + ":r" + String(data.revision), cases };
}
async function identity(req: Request) {
  const match = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(req.headers.get("authorization") ?? "");
  if (!match) return null;
  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data.user || data.user.aud !== "authenticated" || data.user.is_anonymous) return null;
  return { id: data.user.id, confirmed: Boolean(data.user.confirmed_at || data.user.email_confirmed_at) };
}
async function record(userId: string, source: Evidence["source"], sourceKey: string, version: string,
  result: "pass" | "miss", points: number, possible: number) {
  const { error } = await admin.from("trophy_activity_v1").upsert({
    user_id: userId, source, source_key: sourceKey, programme_version: version,
    result, points, possible,
  }, { onConflict: "user_id,source,source_key,programme_version,result", ignoreDuplicates: true });
  if (error) throw error;
}
async function issueAttempt(userId: string, challengeId: string, version: string) {
  const issued=new Date();
  const {data,error}=await admin.from("trophy_attempt_v1").upsert({
    user_id:userId,challenge_id:challengeId,evidence_version:version,
    attempt_id:crypto.randomUUID(),issued_at:issued.toISOString(),
    expires_at:new Date(issued.getTime()+15*60_000).toISOString(),consumed_at:null,
  },{onConflict:"user_id,challenge_id"}).select("attempt_id").single();
  if(error || !data)throw Error("Unable to create scored attempt");
  return data.attempt_id as string;
}
async function claimAttempt(userId:string,challengeId:string,version:string,rawId:unknown) {
  if(typeof rawId!=="string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(rawId))return false;
  const {data,error}=await admin.from("trophy_attempt_v1")
    .update({consumed_at:new Date().toISOString()})
    .eq("user_id",userId).eq("challenge_id",challengeId).eq("evidence_version",version)
    .eq("attempt_id",rawId).is("consumed_at",null)
    .gt("expires_at",new Date().toISOString()).select("attempt_id").maybeSingle();
  if(error)throw error;
  return Boolean(data);
}
async function readState(userId: string) {
  const [g, d, t, e, a, s, p] = await Promise.all([
    admin.from("foundations_assessment_results").select("programme_version,assessment_id,points,possible").eq("user_id",userId).eq("programme_version",FOUNDATIONS_VERSION),
    admin.from("foundations_learning_days").select("learning_day").eq("user_id",userId).eq("programme_version",FOUNDATIONS_VERSION).limit(7),
    admin.from("practice_trades").select("id").eq("user_id",userId).limit(1),
    admin.from("trophy_activity_v1").select("source,source_key,programme_version,result,points,possible").eq("user_id",userId),
    admin.from("trophy_awards_v1").select("trophy_id,issued_at").eq("user_id",userId),
    admin.from("trophy_share_v1").select("enabled,flair,pins").eq("user_id",userId).maybeSingle(),
    admin.from("profiles").select("is_public").eq("id",userId).maybeSingle(),
  ]);
  for (const x of [g,d,t,e,a,s,p]) if (x.error) throw x.error;
  const grades = (g.data ?? []).map(x => ({
    programmeVersion: x.programme_version, assessmentId: x.assessment_id,
    points: x.points, possible: x.possible,
  }));
  const progress = getFoundationsEligibility(grades);
  const passed = new Set(progress.passedCheckpoints);
  const results = (e.data ?? []) as Evidence[];
  const has = (source: string, key: string) => results.some(x =>
    x.source===source && x.source_key===key && x.programme_version===ver && x.result==="pass");
  const passedArenas = ["arena-first-order","arena-size-matters","arena-plan-under-pressure"].filter(id=>has("arena",id)).length;
  const dailyPasses = new Set(results.filter(x=>x.source==="daily" && x.result==="pass" &&
    x.programme_version.startsWith("daily:")).map(x=>x.programme_version + ":" + x.source_key)).size;
  const check = (id: string) => Number(passed.has(id));
  const counts: Record<Id, number> = {
    "first-light": passed.size, "field-notes": passed.size,
    "market-compass": check("markets"), "order-desk": check("execution"), "price-detective": check("quotes"),
    "risk-aware": check("risk"), "position-architect": Number(progress.perfectSizing),
    "exit-planner": Number(has("challenge","exit-planning")),
    "cost-counter": Number(has("challenge","fees-and-spreads")),
    "portfolio-lens": Number(has("challenge","allocation-exposure")),
    "first-practice-trade": Number((t.data ?? []).length > 0),
    "pause-button": Number(has("arena","arena-pause")),
    "scenario-explorer": passedArenas,
    "decision-review": Number(passedArenas>0 && has("review","arena-decision-review")),
    "second-look": Number(results.some(x=>x.source==="reflection" && x.source_key==="second-look-initial" &&
      x.programme_version===ver && x.result==="miss") && has("reflection","second-look-followup")),
    "case-solver": dailyPasses, "case-collector": dailyPasses,
    "steady-learner": (d.data ?? []).length,
    "knowledge-builder": passed.size,
    "foundations-graduate": Number(progress.milestones.includes("foundations")),
  };
  const targets: Record<Id,number> = {
    "first-light":1,"field-notes":3,"market-compass":1,"order-desk":1,
    "price-detective":1,"risk-aware":1,"position-architect":1,
    "exit-planner":1,"cost-counter":1,"portfolio-lens":1,"first-practice-trade":1,
    "pause-button":1,"scenario-explorer":3,"decision-review":1,"second-look":1,
    "case-solver":1,"case-collector":5,"steady-learner":7,
    "knowledge-builder":6,"foundations-graduate":1,
  };
  const eligible = ids.filter(id => counts[id]>=targets[id]);
  const existing = new Set((a.data??[]).map(x=>x.trophy_id));
  const missing = eligible.filter(id=>!existing.has(id));
  if (missing.length) {
    const { error } = await admin.from("trophy_awards_v1")
      .upsert(missing.map(trophy_id=>({user_id:userId,trophy_id})),
        { onConflict:"user_id,trophy_id",ignoreDuplicates:true });
    if (error) throw error;
  }
  const issued = missing.length ?
    await admin.from("trophy_awards_v1").select("trophy_id,issued_at").eq("user_id",userId) : a;
  if (issued.error) throw issued.error;
  const awardDates = new Map((issued.data??[]).map(x=>[x.trophy_id,x.issued_at]));
  const entries = ids.map(id=>({ id, progress:Math.min(counts[id],targets[id]), target:targets[id],
    earned:awardDates.has(id), issuedAt:awardDates.get(id) ?? null }));
  const prefs = s.data as Share | null;
  return { entries, share:prefs ?? emptyShare(), profilePublic:p.data?.is_public===true };
}

async function publicShared(username: string) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(username)) return { status:"private", pinned:[], flair:null };
  const { data: profile, error } = await admin.from("profiles").select("id,is_public").eq("username",username).maybeSingle();
  if (error) throw error;
  if (!profile || profile.is_public !== true) return { status:"private", pinned:[], flair:null };
  const { data: pref, error: prefError } = await admin.from("trophy_share_v1")
    .select("enabled,flair,pins").eq("user_id",profile.id).maybeSingle();
  if (prefError) throw prefError;
  if (!pref?.enabled) return { status:"private", pinned:[], flair:null };
  const account = await admin.auth.admin.getUserById(profile.id);
  if (account.error || !account.data.user ||
      !(account.data.user.confirmed_at || account.data.user.email_confirmed_at)) {
    return { status:"private", pinned:[], flair:null };
  }
  const { data: awards, error: awardsError } = await admin.from("trophy_awards_v1")
    .select("trophy_id").eq("user_id",profile.id);
  if (awardsError) throw awardsError;
  const eligible = new Set((awards??[]).map(x=>x.trophy_id));
  const pinned = (Array.isArray(pref.pins)?pref.pins:[]).filter((id:string)=>eligible.has(id)).slice(0,3);
  return { status:"available", pinned, flair:pref.flair && eligible.has(pref.flair)?pref.flair:null };
}
async function readBoundedBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 4096) throw new RangeError("too large");
  if (!request.body) throw Error("missing body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8",{fatal:true});
  let bytes=0, text="";
  try {
    while (true) {
      const chunk=await reader.read();
      if (chunk.done) break;
      bytes+=chunk.value.byteLength;
      if (bytes>4096) { void reader.cancel().catch(()=>{}); throw new RangeError("too large"); }
      text+=decoder.decode(chunk.value,{stream:true});
    }
    return JSON.parse(text+decoder.decode());
  } finally { reader.releaseLock(); }
}
Deno.serve(async request => {
  if (request.method==="OPTIONS") return new Response(null,{status:204,headers});
  if (request.method!=="POST") return reply(405,{status:"method_not_allowed"});
  try {
    let data: unknown;
    try { data=await readBoundedBody(request); }
    catch(error) { return reply(error instanceof RangeError?413:400,{status:"invalid_request"}); }
    if (!data || typeof data!=="object" || Array.isArray(data)) return reply(400,{status:"invalid_request"});
    const input = data as Record<string,unknown>;
    const action = input.action;
    if(action==="public_flairs" && Object.keys(input).length===1) {
      if(!await allow(clientIp(request),"trophy-public-flairs",60,16))return reply(429,{status:"rate_limited"});
      const {data: flairs,error}=await admin.rpc("list_verified_trophy_flairs_v1");
      if(error)throw error;
      return reply(200,{status:"available",flairs:(flairs??[])
        .filter((row: {username:unknown;trophy_id:unknown})=>
          typeof row.username==="string"&&typeof row.trophy_id==="string"&&ids.includes(row.trophy_id as Id))
        .map((row:{username:string;trophy_id:string})=>({username:row.username,trophyId:row.trophy_id}))});
    }
    if (action==="public" && Object.keys(input).every(k=>["action","username"].includes(k))) {
      if (!await allow(clientIp(request),"trophy-public",60,40)) return reply(429,{status:"rate_limited"});
      return reply(200,await publicShared(String(input.username??"")));
    }
    const user = await identity(request);
    if (!user) return reply(401,{status:"unauthenticated"});
    if (!await allow(user.id,"trophy-"+String(action),60,24)) return reply(429,{status:"rate_limited"});
    if (action==="state" && Object.keys(input).length===1) return reply(200,{status:"available",...(await readState(user.id))});
    if (action==="list_daily" && Object.keys(input).length===1) {
      const bank=await loadReviewedDaily();
      return reply(200,{status:"available",cases:bank.cases.map(c=>({id:c.id,title:c.title}))});
    }
    if (action==="challenge" && typeof input.challengeId==="string" &&
        Object.keys(input).every(k=>["action","challengeId"].includes(k))) {
      const id=input.challengeId;
      if (id.startsWith("daily:")) {
        const bank=await loadReviewedDaily();
        const entry=bank.cases.find(c=>"daily:"+c.id===id);
        return entry?reply(200,{status:"available",challenge:{
          id, title:entry.title,detail:entry.detail,category:"daily",
          attemptId:await issueAttempt(user.id,id,bank.version),
          questions:entry.questions.map(({prompt,options})=>({prompt,options})),
        }}):reply(404,{status:"not_found"});
      }
      const challenge=trophyChallenge(id);
      return challenge?reply(200,{status:"available",challenge:{
        ...publicTrophyChallenge(challenge),attemptId:await issueAttempt(user.id,id,ver),
      }}):reply(404,{status:"not_found"});
    }
    if (action==="grade" && typeof input.challengeId==="string" && Array.isArray(input.answers) &&
        Object.keys(input).every(k=>["action","challengeId","answers","attemptId"].includes(k))) {
      if (!await allow(user.id,"trophy-grade",300,16)) return reply(429,{status:"rate_limited"});
      const id=input.challengeId;
      if (id.startsWith("daily:")) {
        const bank=await loadReviewedDaily();
        const entry=bank.cases.find(c=>"daily:"+c.id===id);
        if (!entry) return reply(404,{status:"not_found"});
        if (input.answers.length!==entry.questions.length ||
            input.answers.some((x,i)=>!Number.isInteger(x) || Number(x)<0 || Number(x)>=entry.questions[i].options.length))
          return reply(400,{status:"invalid_answers"});
        if(!await claimAttempt(user.id,id,bank.version,input.attemptId))return reply(409,{status:"attempt_expired_or_used"});
        const points=entry.questions.filter((q,i)=>q.correct===input.answers[i]).length;
        const passed=points>=8;
        if(passed) await record(user.id,"daily",entry.id,bank.version,"pass",points,entry.questions.length);
        return reply(200,{status:"graded",points,possible:entry.questions.length,passed,
          explanations:entry.questions.map(()=>"Review the worked case in Daily Practice."),updated:passed});
      }
      const challenge=trophyChallenge(id);
      if (!challenge) return reply(404,{status:"not_found"});
      const grade=gradeTrophyChallenge(challenge,input.answers);
      if (!grade) return reply(400,{status:"invalid_answers"});
      if (id==="arena-decision-review") {
        const { data: scenarios,error }=await admin.from("trophy_activity_v1")
          .select("source_key").eq("user_id",user.id).eq("source","arena").eq("result","pass")
          .eq("programme_version",ver).in("source_key",["arena-first-order","arena-size-matters","arena-plan-under-pressure"]).limit(1);
        if(error) throw error;
        if(!scenarios?.length) return reply(409,{status:"requires_scored_arena"});
      }
      if (id==="second-look-followup") {
        const {data: miss,error}=await admin.from("trophy_activity_v1").select("source_key")
          .eq("user_id",user.id).eq("source","reflection").eq("source_key","second-look-initial")
          .eq("programme_version",ver).eq("result","miss").limit(1);
        if(error) throw error;
        if(!miss?.length) return reply(409,{status:"requires_first_miss"});
      }
      if(!await claimAttempt(user.id,id,ver,input.attemptId))return reply(409,{status:"attempt_expired_or_used"});
      const source = id.startsWith("arena-") ? id==="arena-decision-review"?"review":"arena" :
        id.startsWith("second-look-") ? "reflection" : "challenge";
      const result = id==="second-look-initial" ? "miss" : "pass";
      const qualified = id==="second-look-initial" ? grade.points===0 : grade.passed;
      if (qualified) await record(user.id,source,id,ver,result,grade.points,grade.possible);
      return reply(200,{status:"graded",points:grade.points,possible:grade.possible,
        passed:qualified,explanations:grade.explanations,updated:qualified,
        next:id==="second-look-initial"&&qualified?"second-look-followup":undefined});
    }
    if(action==="share" && typeof input.enabled==="boolean" && Object.keys(input).every(k=>["action","enabled","flair","pins"].includes(k))) {
      const enabled=input.enabled;
      const flair=input.flair===null||input.flair===undefined?null:input.flair;
      const pins=input.pins===undefined?[]:input.pins;
      if ((flair!==null && (typeof flair!=="string"||!ids.includes(flair as Id))) ||
          !Array.isArray(pins)||pins.length>3||new Set(pins).size!==pins.length||
          !pins.every(id=>typeof id==="string"&&ids.includes(id as Id))) return reply(400,{status:"invalid_awards"});
      // Withdrawal must work even if the profile or award evidence cannot be read.
      if (enabled) {
        if (!user.confirmed) return reply(409,{status:"confirm_account_first"});
        const [profile, awards] = await Promise.all([
          admin.from("profiles").select("is_public").eq("id",user.id).maybeSingle(),
          admin.from("trophy_awards_v1").select("trophy_id").eq("user_id",user.id),
        ]);
        if (profile.error || awards.error) throw profile.error ?? awards.error;
        if (profile.data?.is_public !== true) return reply(409,{status:"make_profile_public_first"});
        const awarded = new Set((awards.data ?? []).map(row => row.trophy_id));
        if ((flair !== null && !awarded.has(flair)) || pins.some(id => !awarded.has(id)))
          return reply(409,{status:"award_not_earned"});
      }
      const share:Share={enabled,flair:enabled?flair as string|null:null,pins:enabled?pins as string[]:[]};
      const {error}=await admin.from("trophy_share_v1").upsert({
        user_id:user.id,enabled:share.enabled,flair:share.flair,pins:share.pins,updated_at:new Date().toISOString(),
      },{onConflict:"user_id"});
      if(error)throw error;
      return reply(200,{status:"available",share});
    }
    return reply(400,{status:"invalid_request"});
  } catch {
    return reply(503,{status:"unavailable"});
  }
});
