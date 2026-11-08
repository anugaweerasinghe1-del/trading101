import { Card } from "@/components/ui/card";
import { useFirstRecordedPracticeTrade } from "./FirstRecordedTradeMilestone";
import { useVerifiedTrophyState } from "@/lib/trophyEvidenceClient";
const trophyIds = [
  "first-light","field-notes","market-compass","order-desk","price-detective",
  "risk-aware","position-architect","exit-planner","cost-counter","portfolio-lens",
  "first-practice-trade","pause-button","scenario-explorer","decision-review",
  "second-look","case-solver","case-collector","steady-learner","knowledge-builder","foundations-graduate",
] as const;

type Progress = {
  passedCheckpoints: string[];
  perfectSizing: boolean;
  milestones: string[];
  learningDays: number;
};
type Trophy = {
  title: string;
  criterion: string;
  target: number;
  progress?: (snapshot: Progress) => number;
  trade?: true;
};

const trophies: Trophy[] = [
  { title: "First Light", criterion: "Pass your first Foundations checkpoint.", target: 1, progress: x => x.passedCheckpoints.length },
  { title: "Field Notes", criterion: "Pass three different Foundations checkpoints.", target: 3, progress: x => x.passedCheckpoints.length },
  { title: "Market Compass", criterion: "Pass the markets and instruments checkpoint.", target: 1, progress: x => Number(x.passedCheckpoints.includes("markets")) },
  { title: "Order Desk", criterion: "Pass the market-order and execution checkpoint.", target: 1, progress: x => Number(x.passedCheckpoints.includes("execution")) },
  { title: "Price Detective", criterion: "Pass the quote provenance and freshness checkpoint.", target: 1, progress: x => Number(x.passedCheckpoints.includes("quotes")) },
  { title: "Risk Aware", criterion: "Pass the downside and risk checkpoint.", target: 1, progress: x => Number(x.passedCheckpoints.includes("risk")) },
  { title: "Position Architect", criterion: "Answer every question correctly in one scored sizing exercise.", target: 1, progress: x => Number(x.perfectSizing) },
  { title: "Exit Planner", criterion: "Complete the exit-planning case and pass its reasoning checks.", target: 1 },
  { title: "Cost Counter", criterion: "Pass the fees and spread exercise.", target: 1 },
  { title: "Portfolio Lens", criterion: "Pass the allocation and exposure exercise.", target: 1 },
  { title: "First Practice Trade", criterion: "Complete an eligible account-recorded simulated trade.", target: 1, trade: true },
  { title: "Pause Button", criterion: "Choose to hold in the designated Arena scenario and pass the reasoning check.", target: 1 },
  { title: "Scenario Explorer", criterion: "Complete three distinct scored Arena scenarios.", target: 3 },
  { title: "Decision Review", criterion: "Finish the structured review of a completed scored Arena scenario.", target: 1 },
  { title: "Second Look", criterion: "Correct a missed concept on a different follow-up question.", target: 1 },
  { title: "Case Solver", criterion: "Pass a scored Daily Practice case.", target: 1 },
  { title: "Case Collector", criterion: "Pass five distinct scored Daily Practice cases.", target: 5 },
  { title: "Steady Learner", criterion: "Pass a scored Foundations activity on seven different Sri Lanka calendar days.", target: 7, progress: x => x.learningDays },
  { title: "Knowledge Builder", criterion: "Pass all six Foundations checkpoints.", target: 6, progress: x => x.passedCheckpoints.length },
  { title: "Foundations Graduate", criterion: "Complete all four Foundations courses and pass the final case.", target: 1, progress: x => Number(x.milestones.includes("foundations")) },
];

export function TrophyCollection({ progress, checking = false }: { progress?: Progress; checking?: boolean }) {
  const { userId, authLoading, record } = useFirstRecordedPracticeTrade();
  const { query: durable } = useVerifiedTrophyState();
  return (
    <section className="mb-10 space-y-4" aria-labelledby="trophy-collection-title">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" id="trophy-collection-title">The Trade HQ trophy collection</h2>
        <p className="mt-1 text-sm text-muted-foreground">Twenty trophies for learning and thoughtful simulated practice. Your collection is private.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trophies.map((trophy, index) => {
          // Only an issued server award can be labelled Earned. Older progress
          // may describe a pending requirement but never prove issuance when
          // the verified award service is unavailable.
          const award = durable.data?.entries.find(entry => entry.id === trophyIds[index]);
          const count = award ? award.progress : trophy.trade
            ? record.isSuccess && userId && !authLoading ? Number(record.data) : undefined
            : progress && trophy.progress ? trophy.progress(progress) : undefined;
          const loading = authLoading || Boolean(userId && !award && (trophy.trade ? record.isPending : checking && trophy.progress));
          const earned = award?.earned === true;
          const status = loading ? "Checking" : !userId ? "Sign-in required" :
            earned ? "Earned" :
            count !== undefined && count >= trophy.target && !award ? "Verification pending" :
            count === undefined ? "Evidence unavailable" : "Locked";
          return (
            <Card className="flex flex-col gap-2 p-4" key={trophy.title}>
              <img src={"/achievements/trophies/" + String(index + 1).padStart(2, "0") + ".webp"} alt=""
                width={232} height={232} loading="lazy" decoding="async"
                className={"mx-auto h-28 w-28 object-contain " + (earned ? "" : "opacity-80")} />
              <p className={"text-xs font-semibold " + (earned ? "text-primary" : "text-muted-foreground")}>{status}</p>
              <h3 className="font-semibold">{trophy.title}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{trophy.criterion}</p>
              {!loading && count !== undefined && (
                <span className="text-xs tabular-nums text-muted-foreground" aria-label={trophy.title + " progress"}>
                  {Math.min(count, trophy.target)} / {trophy.target}
                </span>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
