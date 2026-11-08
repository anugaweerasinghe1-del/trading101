import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, LockKeyhole, ShieldCheck, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trophyEvidenceKey, trophyRequest, useVerifiedTrophyState, type ScoredChallenge } from "@/lib/trophyEvidenceClient";

const challengeGroups = [
  { label: "Scored learning cases", ids: [
    ["exit-planning","Exit planning"], ["fees-and-spreads","Fees and spread"], ["allocation-exposure","Portfolio exposure"],
  ] },
  { label: "Scored Arena scenarios and reviews", ids: [
    ["arena-first-order","Your first decision"], ["arena-size-matters","Size changes everything"],
    ["arena-plan-under-pressure","Stay with the plan"], ["arena-pause","Pause Button"],
    ["arena-decision-review","Decision Review"],
  ] },
  { label: "Second Look", ids: [
    ["second-look-initial","First attempt"], ["second-look-followup","Different follow-up"],
  ] },
] as const;
const names: Record<string,string> = {
  "first-light":"First Light", "field-notes":"Field Notes", "market-compass":"Market Compass",
  "order-desk":"Order Desk", "price-detective":"Price Detective", "risk-aware":"Risk Aware",
  "position-architect":"Position Architect", "exit-planner":"Exit Planner",
  "cost-counter":"Cost Counter", "portfolio-lens":"Portfolio Lens",
  "first-practice-trade":"First Practice Trade", "pause-button":"Pause Button",
  "scenario-explorer":"Scenario Explorer", "decision-review":"Decision Review",
  "second-look":"Second Look", "case-solver":"Case Solver", "case-collector":"Case Collector",
  "steady-learner":"Steady Learner", "knowledge-builder":"Knowledge Builder",
  "foundations-graduate":"Foundations Graduate",
};
const labelFor = (id:string) => names[id] ?? "Trophy";

export function VerifiedTrophyChallenges() {
  const { id, token, authLoading, query } = useVerifiedTrophyState();
  const location = useLocation();
  const cache = useQueryClient();
  const owner = useRef(id);
  const [selected,setSelected] = useState<string|null>(null);
  const [challenge,setChallenge] = useState<ScoredChallenge|null>(null);
  const [daily,setDaily] = useState<Array<{id:string;title:string}>>([]);
  const [answers,setAnswers] = useState<Array<number|null>>([]);
  const [working,setWorking] = useState(false);
  const [error,setError] = useState("");
  const [grade,setGrade] = useState<{points:number;possible:number;passed:boolean;next?:string;explanations:string[]}|null>(null);
  const [shareEnabled,setShareEnabled] = useState(false);
  const [flair,setFlair] = useState<string>("");
  const [pins,setPins] = useState<string[]>([]);
  const [savedShare,setSavedShare] = useState("");
  useEffect(() => {
    owner.current = id;
    setChallenge(null); setSelected(null); setGrade(null); setDaily([]); setError(""); setPins([]);
  }, [id]);
  const state = query.data;
  useEffect(() => {
    if (!state) return;
    setShareEnabled(state.share.enabled);
    setFlair(state.share.flair ?? "");
    setPins(state.share.pins);
  }, [state?.share.enabled,state?.share.flair,state?.share.pins.join("|")]);

  useEffect(() => {
    if (!id || !token) return;
    const fromArena = new URLSearchParams(location.search).get("challenge");
    if (fromArena && /^arena-(first-order|size-matters|plan-under-pressure)$/.test(fromArena)) void open(fromArena);
  }, [id, token, location.search]);

  useEffect(() => {
    if (!id || !token) return;
    let live=true;
    void trophyRequest<{status:string;cases?:Array<{id:string;title:string}>}>(token,{action:"list_daily"})
      .then(result=>{if(live && result.status==="available" && Array.isArray(result.cases))setDaily(result.cases);})
      .catch(()=>{});
    return ()=>{live=false;};
  },[id,token]);

  async function open(nextId:string) {
    if (!id || !token || working) return;
    setSelected(nextId); setChallenge(null); setGrade(null); setError(""); setWorking(true);
    try {
      const result=await trophyRequest<{status:string;challenge?:ScoredChallenge}>(token,{action:"challenge",challengeId:nextId});
      if(owner.current!==id)return;
      if(result.status!=="available"||!result.challenge||!Array.isArray(result.challenge.questions)
        ||typeof result.challenge.attemptId!=="string") throw Error("This challenge is unavailable.");
      setChallenge(result.challenge); setAnswers(result.challenge.questions.map(()=>null));
    } catch(e) {if(owner.current===id)setError(e instanceof Error?e.message:"Challenge unavailable.");}
    finally {if(owner.current===id)setWorking(false);}
  }
  async function submit() {
    if (!id || !token || !challenge || working || answers.some(a=>a===null)) return;
    setWorking(true); setError("");
    try {
      const result=await trophyRequest<{status:string;points?:number;possible?:number;passed?:boolean;next?:string;explanations?:string[]}>(token,{
        action:"grade",challengeId:challenge.id,answers,
      });
      if(owner.current!==id)return;
      if(result.status==="requires_scored_arena") throw Error("Pass one scored Arena scenario before completing its Decision Review.");
      if(result.status==="requires_first_miss") throw Error("Start with an incorrect First Attempt, then correct the concept in the follow-up.");
      if(result.status!=="graded"||typeof result.points!=="number"||typeof result.possible!=="number"||typeof result.passed!=="boolean") throw Error("Your scored result is unavailable.");
      setGrade({points:result.points,possible:result.possible,passed:result.passed,
        next:result.next,explanations:Array.isArray(result.explanations)?result.explanations:[]});
      await cache.invalidateQueries({queryKey:trophyEvidenceKey(id)});
    } catch(e){if(owner.current===id)setError(e instanceof Error?e.message:"Could not score the case.");}
    finally{if(owner.current===id)setWorking(false);}
  }
  async function saveSharing() {
    if (!id || !token || working) return;
    setWorking(true); setError("");setSavedShare("");
    try {
      const result=await trophyRequest<{status:string}>(token,{
        action:"share",enabled:shareEnabled,flair:shareEnabled?(flair||null):null,pins:shareEnabled?pins:[],
      });
      if(owner.current!==id)return;
      if(result.status==="make_profile_public_first") throw Error("Set your trader profile to public before opting in to display trophies.");
      if(result.status==="confirm_account_first") throw Error("Confirm your account before sharing trophies.");
      if(result.status!=="available") throw Error("Trophy sharing was not saved.");
      setSavedShare(shareEnabled?"Your chosen earned trophies are now visible on your public trader profile.":"Trophy sharing has been withdrawn.");
      await cache.invalidateQueries({queryKey:trophyEvidenceKey(id)});
    }catch(e){if(owner.current===id)setError(e instanceof Error?e.message:"Could not update sharing.");}
    finally{if(owner.current===id)setWorking(false);}
  }
  const earned=state?.entries.filter(e=>e.earned)??[];
  const selectedLabel=selected?.startsWith("daily:") ? "Daily Practice case" : challenge?.title??"";
  return (
    <section id="trophy-challenges" aria-labelledby="trophy-challenges-title" className="mb-12 space-y-5 scroll-mt-28">
      <div>
        <h2 id="trophy-challenges-title" className="flex items-center gap-2 text-2xl font-semibold"><Trophy aria-hidden="true" className="h-6 w-6 text-primary" /> Scored trophy challenges</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Your own authenticated answers are marked on the server. Earned trophies persist across devices.
          These short fictional exercises are for learning, not a certification of trading skill, profit or financial advice.
          Browser-only Arena and Daily progress remains separate.
        </p>
      </div>
      {authLoading ? <p role="status">Checking your account…</p> : !id || !token ?
        <Card className="p-5 text-sm"><LockKeyhole className="inline h-4 w-4 mr-2 text-primary"/><Link to="/auth" className="underline">Sign in</Link> to earn saved, server-scored trophies. Guest exercises remain free and private.</Card> : (
        <>
          <Card className="p-5 space-y-2">
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <p className="font-semibold">Verified learning record</p>
              <p className="text-sm text-primary tabular-nums">{state?earned.length+" / 20 earned":"Checking"}</p>
            </div>
            {query.isError ? <p role="status" className="text-sm text-muted-foreground">Trophy evidence is temporarily unavailable. <button type="button" className="underline" onClick={()=>void query.refetch()}>Retry</button></p> :
              <p className="text-sm text-muted-foreground">No awards are based on simulated profit, browser-editable timestamps or the leaderboard. A passing score alone never makes a trading strategy reliable.</p>}
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {challengeGroups.map(group=>(
              <Card className="p-5" key={group.label}>
                <h3 className="font-semibold mb-3">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.ids.map(([cid,title])=>(
                    <button type="button" key={cid} disabled={working} onClick={()=>void open(cid)}
                      aria-pressed={selected===cid} className={"min-h-11 rounded-xl border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary " +
                        (selected===cid?"border-primary bg-primary/10 text-foreground":"border-border hover:border-primary/40 text-muted-foreground")}>
                      {title}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
            <Card className="p-5">
              <h3 className="font-semibold">Daily Practice cases</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">Score at least 8/10 in one case for Case Solver or five different cases for Case Collector.</p>
              <label htmlFor="trophy-daily-select" className="text-sm font-medium">Choose a reviewed case</label>
              <select id="trophy-daily-select" value={selected?.startsWith("daily:")?selected:""} disabled={working||daily.length===0}
                onChange={e=>{if(e.target.value)void open(e.target.value);}}
                className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                <option value="">Select a case</option>
                {daily.map(c=><option key={c.id} value={"daily:"+c.id}>{c.title}</option>)}
              </select>
            </Card>
          </div>
          {selected && (
            <Card className="p-5 sm:p-6 space-y-5">
              <h3 className="text-lg font-semibold">{challenge?.title??selectedLabel}</h3>
              {working&&!challenge?<p role="status">Loading scored challenge…</p>:null}
              {challenge && <>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{challenge.detail}</p>
                {challenge.questions.map((question,i)=>(
                  <fieldset key={i} disabled={working||!!grade} className="space-y-2">
                    <legend className="font-medium text-sm">{i+1}. {question.prompt}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options.map((option,n)=>(
                        <label key={n} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30">
                          <input type="radio" name={"verified-trophy-question-"+i} checked={answers[i]===n}
                            onChange={()=>setAnswers(prev=>prev.map((v,k)=>k===i?n:v))}/>
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                {!grade ? <button type="button" onClick={()=>void submit()} disabled={working||answers.some(a=>a===null)}
                  className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {working?"Scoring…":"Submit to be scored"}
                </button> : (
                  <div role="status" className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                    <p className="font-semibold"><CheckCircle2 className="inline h-4 w-4 mr-1 text-primary" />
                      {grade.points} / {grade.possible} correct · {grade.passed ? selected==="second-look-initial"?"A miss recorded for a new follow-up":"Scored requirement passed":"Review the explanations and try again"}
                    </p>
                    {grade.explanations.map((ex,i)=><p key={i} className="text-sm text-muted-foreground">{i+1}. {ex}</p>)}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button type="button" onClick={()=>void open(challenge.id)} className="text-sm underline">Try another attempt</button>
                      {grade.next&&<button type="button" className="text-sm font-semibold underline text-primary" onClick={()=>void open(grade.next!)}>Open different follow-up</button>}
                    </div>
                  </div>
                )}
              </>}
            </Card>
          )}
          <section aria-labelledby="trophy-sharing-title" className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div>
              <h3 id="trophy-sharing-title" className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true"/> Optional public trophy display
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Private by default and independent of trader-profile visibility. You control a single flair and up to three pinned trophies. No scores, study dates, trade activity or contact information are shared.</p>
            </div>
            {!state?.profilePublic&&<p className="text-sm text-muted-foreground">Your profile is private. To share trophies you must first intentionally enable public profile visibility, then opt in here. <Link to="/profile" className="underline">Profile settings</Link>.</p>}
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={shareEnabled} onChange={e=>setShareEnabled(e.target.checked)} disabled={working||!state} />
              I choose to display only my selected earned trophies on my public profile.
            </label>
            {shareEnabled && <>
              <div>
                <label htmlFor="trophy-flair" className="text-sm font-medium">Public trophy flair (optional)</label>
                <select id="trophy-flair" value={flair} onChange={e=>setFlair(e.target.value)}
                  className="mt-2 block min-h-11 w-full max-w-sm rounded-xl border border-border bg-background px-3 text-sm">
                  <option value="">No flair</option>
                  {earned.map(x=><option key={x.id} value={x.id}>{labelFor(x.id)}</option>)}
                </select>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Pinned awards (up to three)</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {earned.map(x=>(
                    <label key={x.id} className="flex items-center min-h-10 gap-2 text-sm">
                      <input type="checkbox" checked={pins.includes(x.id)}
                        disabled={working||(!pins.includes(x.id)&&pins.length>=3)}
                        onChange={e=>setPins(old=>e.target.checked?[...old,x.id]:old.filter(y=>y!==x.id))} />
                      {labelFor(x.id)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>}
            <button type="button" disabled={working||!state||(shareEnabled&&!state.profilePublic)}
              onClick={()=>void saveSharing()}
              className="min-h-11 rounded-xl border border-primary/50 px-5 py-2 text-sm font-semibold text-primary disabled:opacity-50">
              {working?"Saving…":shareEnabled?"Save explicit trophy sharing":"Withdraw trophy sharing"}
            </button>
            {savedShare&&<p role="status" className="text-sm">{savedShare}</p>}
          </section>
          {error&&<p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
        </>
      )}
    </section>
  );
}
