import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const trophies = [
  ["first-light","First Light"],["field-notes","Field Notes"],["market-compass","Market Compass"],
  ["order-desk","Order Desk"],["price-detective","Price Detective"],["risk-aware","Risk Aware"],
  ["position-architect","Position Architect"],["exit-planner","Exit Planner"],["cost-counter","Cost Counter"],
  ["portfolio-lens","Portfolio Lens"],["first-practice-trade","First Practice Trade"],["pause-button","Pause Button"],
  ["scenario-explorer","Scenario Explorer"],["decision-review","Decision Review"],["second-look","Second Look"],
  ["case-solver","Case Solver"],["case-collector","Case Collector"],["steady-learner","Steady Learner"],
  ["knowledge-builder","Knowledge Builder"],["foundations-graduate","Foundations Graduate"],
] as const;
const map = new Map(trophies.map(([id,title],index)=>[id,{title,image:"/achievements/trophies/"+String(index+1).padStart(2,"0")+".webp"}]));
export function publicTrophyName(id:string): string | null { return map.get(id)?.title ?? null; }
type Shared = { status:string; flair:string|null; pinned:string[] };

export function PublicTrophies({username}:{username:string}) {
  const [shared,setShared] = useState<Shared|null>(null);
  useEffect(()=>{
    let live=true;
    setShared(null);
    void supabase.functions.invoke<Shared>("trophy-evidence",{body:{action:"public",username}})
      .then(({data,error})=>{
        if(!live)return;
        if(!error && data?.status==="available" && Array.isArray(data.pinned))setShared(data);
      }).catch(()=>{});
    return ()=>{live=false;};
  },[username]);
  if(!shared)return null; // No separate consent, or temporarily unavailable: expose nothing.
  const pins=[...new Set(shared.pinned)].filter(x=>map.has(x)).slice(0,3);
  const flair=shared.flair&&map.has(shared.flair)?shared.flair:null;
  if(!flair && pins.length===0)return null;
  return (
    <section aria-labelledby="public-trophies-title" className="mb-8 rounded-2xl border border-border bg-card/70 p-5">
      <h2 id="public-trophies-title" className="flex items-center gap-2 text-lg font-semibold">
        <Award aria-hidden="true" className="h-5 w-5 text-primary"/> Voluntarily shared learning trophies
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        These are individually selected, server-recorded educational exercises. They do not certify trading skill or affect leaderboard rankings.
      </p>
      {flair&&<p className="mt-3 text-sm font-medium text-primary">Trophy flair: {map.get(flair)?.title}</p>}
      {pins.length>0&&<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pins.map(id=><div key={id} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/40 p-3">
          <img src={map.get(id)!.image} alt="" loading="lazy" decoding="async" width={104} height={104} className="h-20 w-20 object-contain"/>
          <span className="text-center text-sm font-semibold">{map.get(id)!.title}</span>
        </div>)}
      </div>}
    </section>
  );
}
