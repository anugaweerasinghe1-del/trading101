/**
 * Daily Trading Challenge — deterministic per local calendar date.
 * 100% client-side, localStorage-persisted streak. Zero auth.
 *
 * Educational simulation only — not financial advice.
 */

export type ChallengeDecision = "long" | "short" | "hold";

export interface DailyChallenge {
  id: number;
  asset: string;       // e.g. "NVDA", "BTC"
  assetName: string;
  scenario: string;    // short headline
  context: string;     // 1-2 sentence setup
  options: { label: string; value: ChallengeDecision; rationale: string }[];
  insight: string;     // educational takeaway shown after answer
  difficulty: "Beginner" | "Intermediate" | "Pro";
}

// Curated bank of 30+ challenges. Cycles deterministically by the user's local calendar date.
const CHALLENGES: DailyChallenge[] = [
  {
    id: 1, asset: "NVDA", assetName: "NVIDIA",
    scenario: "NVDA reports earnings tonight. Implied move is ±8%.",
    context: "Street expects $0.85 EPS on $36B revenue. Whisper number is $0.92. AI capex guidance from hyperscalers came in strong this week.",
    options: [
      { label: "Go long ahead of earnings", value: "long", rationale: "Bullish setup + strong whisper" },
      { label: "Wait — close existing positions and react after the print", value: "hold", rationale: "Avoid the gap risk; expected move pricing is rich" },
      { label: "Short into the print", value: "short", rationale: "Bet on a sell-the-news reaction" },
    ],
    insight: "Earnings can create gap risk and uncertainty. Compare the case for reducing exposure before the report with the case for waiting for confirmed post-report information; no direction is guaranteed.",
    difficulty: "Intermediate",
  },
  {
    id: 2, asset: "BTC", assetName: "Bitcoin",
    scenario: "BTC breaks $100K resistance on heavy volume.",
    context: "Funding rates are still neutral, open interest just hit ATH, and spot ETF inflows posted $1.2B yesterday.",
    options: [
      { label: "Buy the breakout", value: "long", rationale: "Confirmed breakout with spot-driven flow" },
      { label: "Short — too extended", value: "short", rationale: "Mean revert play" },
      { label: "Hold and wait for a retest", value: "hold", rationale: "Patience on confirmation" },
    ],
    insight: "Treat volume, spot flow, funding and open interest as separate pieces of evidence. Compare a continuation case with a failed-breakout case instead of assuming the breakout must hold.",
    difficulty: "Beginner",
  },
  {
    id: 3, asset: "TSLA", assetName: "Tesla",
    scenario: "Tesla drops 12% on a weak delivery number.",
    context: "Q3 deliveries missed by 4%. Stock gapped down at the open and is now consolidating at the day's low.",
    options: [
      { label: "Buy the dip immediately", value: "long", rationale: "Reflexive bounce expected" },
      { label: "Wait for a higher-low intraday before going long", value: "hold", rationale: "Let the seller exhaust" },
      { label: "Add to a short", value: "short", rationale: "Trend continuation" },
    ],
    insight: "After a sharp gap down, a higher low can be one confirmation signal while continued weakness can invalidate a bounce case. The setup does not imply a fixed win rate.",
    difficulty: "Intermediate",
  },
  {
    id: 4, asset: "ETH", assetName: "Ethereum",
    scenario: "ETH/BTC ratio breaks a 6-month downtrend.",
    context: "ETH has been underperforming BTC for half a year. Today the ratio crossed back above its 50-day MA.",
    options: [
      { label: "Rotate from BTC into ETH", value: "long", rationale: "Trend reversal in relative strength" },
      { label: "Stay in BTC", value: "hold", rationale: "Wait for more confirmation" },
      { label: "Short ETH/BTC", value: "short", rationale: "Fade the move" },
    ],
    insight: "A relative-strength break and a moving-average cross can be studied as confirmation signals, but either can fail. Compare what would confirm the rotation with what would invalidate it.",
    difficulty: "Pro",
  },
  {
    id: 5, asset: "AAPL", assetName: "Apple",
    scenario: "Apple announces a $90B buyback expansion.",
    context: "Stock is up 2% premarket. RSI on the daily is already 71. iPhone unit growth has been flat for 4 quarters.",
    options: [
      { label: "Buy — buybacks are bullish", value: "long", rationale: "Reduced float" },
      { label: "Hold — fundamentals haven't changed", value: "hold", rationale: "Buybacks ≠ growth" },
      { label: "Short into strength", value: "short", rationale: "Overbought + flat fundamentals" },
    ],
    insight: "A buyback can affect share count without proving future revenue growth or price direction. Compare the capital-return case with the company's operating fundamentals before forming a view.",
    difficulty: "Intermediate",
  },
  {
    id: 6, asset: "SPY", assetName: "S&P 500 ETF",
    scenario: "Fed pauses rate cuts. SPY drops 1.5% intraday.",
    context: "Powell signaled 'higher for longer.' VIX spiked to 22. Volume is 1.4x the 20-day average.",
    options: [
      { label: "Consider a rebound case — verify policy assumptions", value: "long", rationale: "Mean reversion" },
      { label: "Wait — VIX hasn't peaked yet", value: "hold", rationale: "Let volatility cool" },
      { label: "Short — more downside coming", value: "short", rationale: "Trend follow" },
    ],
    insight: "A volatility spike does not reveal the exact timing of a reversal. Compare evidence that volatility is stabilising with evidence that risk is still increasing before choosing a simulated response.",
    difficulty: "Beginner",
  },
  {
    id: 7, asset: "SOL", assetName: "Solana",
    scenario: "Solana network outage for 4 hours.",
    context: "Validator software bug. Price down 7%. Devs say a patch is rolling out within 24h.",
    options: [
      { label: "Buy — overreaction to a fixable bug", value: "long", rationale: "Short-term FUD" },
      { label: "Sell — outages are a structural issue", value: "short", rationale: "Bearish narrative" },
      { label: "Hold and wait", value: "hold", rationale: "Avoid the volatility" },
    ],
    insight: "A network outage creates both technical-recovery and confidence risks. Compare evidence that the fault is resolved with evidence of lasting usage or reliability damage; neither a rebound nor further decline is guaranteed.",
    difficulty: "Intermediate",
  },
  {
    id: 8, asset: "GOLD", assetName: "Gold",
    scenario: "DXY dollar index breaks below a 2-year support.",
    context: "Real yields are falling. Central banks added a record amount of gold to reserves last quarter.",
    options: [
      { label: "Buy gold", value: "long", rationale: "Weak dollar = strong gold" },
      { label: "Short gold — too crowded", value: "short", rationale: "Contrarian" },
      { label: "Wait for a pullback", value: "hold", rationale: "Discipline" },
    ],
    insight: "Real yields, currency moves and central-bank demand are factors traders may compare when studying gold. Their direction and importance can change, so the combination is not a guaranteed price signal.",
    difficulty: "Beginner",
  },
  {
    id: 9, asset: "META", assetName: "Meta Platforms",
    scenario: "Meta announces $50B+ AI capex for next year.",
    context: "Stock down 6% on the news. Wall Street worries about ROI. But internal metrics show Reels engagement up 40% YoY thanks to AI ranking.",
    options: [
      { label: "Buy — Street is short-sighted", value: "long", rationale: "Long-term ROI" },
      { label: "Wait for the bottom", value: "hold", rationale: "Catch a knife" },
      { label: "Short — capex worries are valid", value: "short", rationale: "Margin compression" },
    ],
    insight: "Large capital-spending plans can create a trade-off between near-term costs and possible future returns. Compare evidence on margins, adoption and realised returns rather than assuming a fixed recovery pattern.",
    difficulty: "Pro",
  },
  {
    id: 10, asset: "EURUSD", assetName: "EUR/USD",
    scenario: "ECB hawkish surprise: Lagarde signals one more hike.",
    context: "EUR/USD spikes 80 pips in 5 minutes. Pre-news positioning was net short EUR.",
    options: [
      { label: "Buy EUR/USD — squeeze continues", value: "long", rationale: "Short squeeze" },
      { label: "Fade the spike", value: "short", rationale: "Mean reversion" },
      { label: "Wait", value: "hold", rationale: "Confirmation" },
    ],
    insight: "A policy surprise and crowded positioning can increase volatility, but they do not set a reliable duration or direction. Compare follow-through, positioning and later policy information before drawing a conclusion.",
    difficulty: "Pro",
  },
  {
    id: 11, asset: "MSFT", assetName: "Microsoft",
    scenario: "Microsoft adds OpenAI o4 to all Copilot tiers.",
    context: "Stock flat on the news. Enterprise Copilot adoption was already accelerating (40% QoQ).",
    options: [
      { label: "Buy — moat deepens", value: "long", rationale: "Locks in enterprise" },
      { label: "Hold — priced in", value: "hold", rationale: "No reaction = priced in" },
      { label: "Short", value: "short", rationale: "Sell strength" },
    ],
    insight: "A muted reaction to news can have several explanations. Compare price, volume and later company information rather than treating a flat response as proof of accumulation or a coming breakout.",
    difficulty: "Intermediate",
  },
  {
    id: 12, asset: "GOOGL", assetName: "Alphabet",
    scenario: "DOJ proposes forcing Google to sell Chrome.",
    context: "Stock down 5% premarket. Legal experts give it 30% odds of happening. Process would take 3+ years.",
    options: [
      { label: "Buy — fear overdone", value: "long", rationale: "Low odds + long timeline" },
      { label: "Sell — regulatory risk is real", value: "short", rationale: "Tail risk" },
      { label: "Hold", value: "hold", rationale: "Sit on hands" },
    ],
    insight: "Regulatory proposals can change, face legal review or take time to resolve. Separate the probability, timeline and business impact from the immediate price reaction instead of assuming a buy or sell outcome.",
    difficulty: "Pro",
  },
  {
    id: 13, asset: "QQQ", assetName: "Nasdaq 100 ETF",
    scenario: "QQQ goes 5 days straight up. RSI hits 78.",
    context: "AI-driven rally. No pullback in 2 weeks.",
    options: [
      { label: "Buy more — momentum", value: "long", rationale: "Trend follow" },
      { label: "Trim and wait for a pullback", value: "hold", rationale: "Risk management" },
      { label: "Short the overbought signal", value: "short", rationale: "Mean reversion" },
    ],
    insight: "RSI describes recent price momentum; it does not guarantee a pullback or its size. Compare trend strength, breadth and risk limits rather than treating an overbought reading as a forecast.",
    difficulty: "Beginner",
  },
  {
    id: 14, asset: "OIL", assetName: "Crude Oil",
    scenario: "OPEC+ surprise production cut of 1M bpd.",
    context: "Crude jumps 4% on the announcement. Inventories have been building for 6 weeks.",
    options: [
      { label: "Buy — supply shock", value: "long", rationale: "Lower supply" },
      { label: "Wait — demand is the issue", value: "hold", rationale: "Inventory builds = weak demand" },
      { label: "Short — fade OPEC", value: "short", rationale: "Fade jawboning" },
    ],
    insight: "Supply decisions and inventory trends can point in different directions. Compare both sides of the balance and later demand data instead of assuming an announcement will persist or fade on a fixed schedule.",
    difficulty: "Pro",
  },
  {
    id: 15, asset: "BNB", assetName: "BNB",
    scenario: "Binance announces a major token burn.",
    context: "12% of supply removed. Volume already 3x average.",
    options: [
      { label: "Buy — supply reduction is bullish", value: "long", rationale: "Lower float" },
      { label: "Sell the news", value: "short", rationale: "Buy rumor sell news" },
      { label: "Hold", value: "hold", rationale: "Wait" },
    ],
    insight: "A token burn changes supply mechanics, but price also depends on demand, liquidity and broader market conditions. Treat the burn as one input rather than a guaranteed uptrend.",
    difficulty: "Beginner",
  },
  {
    id: 16, asset: "NVDA", assetName: "NVIDIA",
    scenario: "China announces 200% tariff on US chips.",
    context: "NVDA -8% premarket. China is ~12% of NVDA revenue. Datacenter demand globally remains insatiable.",
    options: [
      { label: "Buy the dip — global demand offsets China", value: "long", rationale: "Demand overwhelms" },
      { label: "Hold and wait", value: "hold", rationale: "Sit out volatility" },
      { label: "Short — bigger drop coming", value: "short", rationale: "Geopolitical risk" },
    ],
    insight: "Geopolitical shocks can change demand, supply access and risk premiums at the same time. Compare the size and persistence of those effects rather than assuming a fixed recovery window.",
    difficulty: "Intermediate",
  },
  {
    id: 17, asset: "BTC", assetName: "Bitcoin",
    scenario: "BTC funding rates spike to +0.15% (4-hour).",
    context: "Price flat. Open interest at record highs. Spot volume below average.",
    options: [
      { label: "Short — funding extreme", value: "short", rationale: "Contrarian on leverage" },
      { label: "Long — bulls are confident", value: "long", rationale: "Trend follow" },
      { label: "Hold", value: "hold", rationale: "Wait it out" },
    ],
    insight: "High funding, flat price and weak spot volume can be studied as signs of leveraged positioning. They do not establish a fixed probability or deadline for a liquidation move.",
    difficulty: "Pro",
  },
  {
    id: 18, asset: "TSLA", assetName: "Tesla",
    scenario: "Tesla unveils a sub-$25K model.",
    context: "Stock spikes 9% on the news. Margins guidance unclear. Production starts in 18 months.",
    options: [
      { label: "Sell into the spike", value: "short", rationale: "Sell-the-news" },
      { label: "Buy — TAM expansion", value: "long", rationale: "New market" },
      { label: "Hold", value: "hold", rationale: "Patience" },
    ],
    insight: "A distant product catalyst with uncertain margins leaves multiple scenarios open. Compare the timing, economics and evidence of demand rather than treating the announcement as an automatic sell-the-news setup.",
    difficulty: "Intermediate",
  },
  {
    id: 19, asset: "SPY", assetName: "S&P 500 ETF",
    scenario: "SPY tests the 200-day MA after a 10% correction.",
    context: "VIX at 28 (elevated). Breadth: only 35% of stocks above their 50-day. Put/call ratio at 1.4.",
    options: [
      { label: "Buy — capitulation signs", value: "long", rationale: "Sentiment extremes" },
      { label: "Wait", value: "hold", rationale: "Patience" },
      { label: "Short — more downside", value: "short", rationale: "Trend follow" },
    ],
    insight: "Moving averages, volatility and options-positioning measures can provide different context around a selloff. Their combination still does not prove that a durable low has formed.",
    difficulty: "Intermediate",
  },
  {
    id: 20, asset: "ETH", assetName: "Ethereum",
    scenario: "Ethereum staking yield drops below 2.5%.",
    context: "Validator queue is full. Restaking protocols (EigenLayer) absorbing capital. ETH spot ETF flows turned negative.",
    options: [
      { label: "Sell — yield no longer compelling", value: "short", rationale: "Rotation out" },
      { label: "Buy — restaking is bullish", value: "long", rationale: "New use case" },
      { label: "Hold", value: "hold", rationale: "Long-term" },
    ],
    insight: "Yield changes, restaking activity and fund flows can affect the case for holding ETH in different ways. Compare each factor and its persistence instead of assigning a fixed period of underperformance.",
    difficulty: "Pro",
  },
  {
    id: 21, asset: "USDJPY", assetName: "USD/JPY",
    scenario: "BoJ intervenes verbally. USD/JPY at 158.",
    context: "Last actual intervention was at 152. MoF officials called move 'one-sided.' Carry trade flows still strong.",
    options: [
      { label: "Wait — verbal isn't actual", value: "hold", rationale: "Discipline" },
      { label: "Short JPY weakening continues", value: "long", rationale: "Trend follow" },
      { label: "Short USD/JPY now", value: "short", rationale: "Front-run intervention" },
    ],
    insight: "Official comments, actual intervention and monetary-policy changes are different events. Compare what has actually changed in policy or flows instead of assuming comments alone determine the next move.",
    difficulty: "Pro",
  },
  {
    id: 22, asset: "NVDA", assetName: "NVIDIA",
    scenario: "NVDA splits 10-for-1.",
    context: "Retail interest surges. Options activity hits records. Stock up 4% on the announcement.",
    options: [
      { label: "Buy — retail flows incoming", value: "long", rationale: "Liquidity event" },
      { label: "Hold — splits don't change value", value: "hold", rationale: "Cosmetic" },
      { label: "Short the hype", value: "short", rationale: "Sell hype" },
    ],
    insight: "A stock split changes the number of shares and the per-share price proportionally; it does not by itself change the company's underlying value. Any later price move needs separate evidence.",
    difficulty: "Beginner",
  },
  {
    id: 23, asset: "BTC", assetName: "Bitcoin",
    scenario: "BTC halving happens this week.",
    context: "Price already up 80% YTD. Last 3 halvings saw the major rally AFTER, not before.",
    options: [
      { label: "Hold through the event", value: "hold", rationale: "Avoid timing" },
      { label: "Buy more", value: "long", rationale: "Halving narrative" },
      { label: "Sell — buy the rumor", value: "short", rationale: "Sell event" },
    ],
    insight: "A scheduled halving changes Bitcoin's issuance rate, but it does not specify when or how price must react. Separate the known protocol event from uncertain market expectations.",
    difficulty: "Beginner",
  },
  {
    id: 24, asset: "AAPL", assetName: "Apple",
    scenario: "Apple beats earnings but guides Q1 lower.",
    context: "Stock down 4% after-hours. Services revenue grew 18%. iPhone guidance cut on China softness.",
    options: [
      { label: "Buy — Services is the story", value: "long", rationale: "Quality narrative" },
      { label: "Sell — guidance is what matters", value: "short", rationale: "Forward looking" },
      { label: "Hold", value: "hold", rationale: "Wait it out" },
    ],
    insight: "Revenue mix and forward guidance can point to different risks and opportunities. Compare margin effects, demand and management guidance without treating a short-term drop as an automatic buying opportunity.",
    difficulty: "Intermediate",
  },
  {
    id: 25, asset: "QQQ", assetName: "Nasdaq 100 ETF",
    scenario: "10-year yield crosses above 5%.",
    context: "QQQ down 2% intraday. Tech leadership weakening. Equal-weight QQQ outperforming.",
    options: [
      { label: "Rotate out of mega-cap into equal-weight", value: "hold", rationale: "Quality rotation" },
      { label: "Buy the dip in QQQ", value: "long", rationale: "Discount" },
      { label: "Short QQQ", value: "short", rationale: "Yield headwind" },
    ],
    insight: "Equal-weight versus cap-weighted performance can help describe market breadth. Use it as context rather than as a rule that one portfolio rotation must outperform.",
    difficulty: "Pro",
  },
  {
    id: 26, asset: "TSLA", assetName: "Tesla",
    scenario: "Robotaxi event delivers underwhelming demo.",
    context: "Stock down 9% the next session. Demo lacked details on regulatory path. But FSD subscription revenue grew 60% QoQ in background.",
    options: [
      { label: "Wait for capitulation", value: "hold", rationale: "Let panic exhaust" },
      { label: "Buy the dip — FSD growth", value: "long", rationale: "Underlying business strong" },
      { label: "Short — Robotaxi was the catalyst", value: "short", rationale: "Trend follow" },
    ],
    insight: "After a disappointment, selling pressure can persist or reverse at different speeds. Compare new information, liquidity and price stabilisation instead of assuming a fixed exhaustion period.",
    difficulty: "Intermediate",
  },
  {
    id: 27, asset: "GOLD", assetName: "Gold",
    scenario: "Gold breaks $2,800 to new all-time highs.",
    context: "Central bank buying + retail FOMO + miner shares lagging.",
    options: [
      { label: "Buy gold but avoid miners", value: "long", rationale: "Follow the metal" },
      { label: "Buy miners — they'll catch up", value: "long", rationale: "Reversion" },
      { label: "Short — too extended", value: "short", rationale: "Mean reversion" },
    ],
    insight: "Gold and mining shares have different business and market drivers. A divergence can be investigated, but it does not by itself prove why capital is moving or how long the gap will last.",
    difficulty: "Pro",
  },
  {
    id: 28, asset: "META", assetName: "Meta Platforms",
    scenario: "Meta reports record ad revenue. Stock unchanged.",
    context: "Beat top + bottom line by 8%. CEO commentary muted. Sector peers underperforming.",
    options: [
      { label: "Hold — no reaction means top", value: "hold", rationale: "Distribution signal" },
      { label: "Buy more — accumulation", value: "long", rationale: "Quiet strength" },
      { label: "Short — exhaustion", value: "short", rationale: "Top signal" },
    ],
    insight: "A strong report with a muted price reaction can have several explanations. Compare expectations, volume and subsequent information instead of treating the reaction as proof of distribution.",
    difficulty: "Pro",
  },
  {
    id: 29, asset: "SOL", assetName: "Solana",
    scenario: "Solana memecoin volume crashes 70% in a week.",
    context: "Network revenue down 50%. Validators struggling. Real-app usage still growing.",
    options: [
      { label: "Sell — revenue collapse", value: "short", rationale: "Bearish" },
      { label: "Hold — real usage growing", value: "hold", rationale: "Long-term thesis" },
      { label: "Buy aggressively", value: "long", rationale: "Contrarian" },
    ],
    insight: "Network revenue, speculative activity and application usage measure different parts of an ecosystem. Compare them separately rather than treating one short-term activity measure as the whole investment case.",
    difficulty: "Intermediate",
  },
  {
    id: 30, asset: "SPY", assetName: "S&P 500 ETF",
    scenario: "First red Monday after 8 green weeks.",
    context: "SPY -1.2%. Breadth -3:1 negative. No specific catalyst. Bond yields stable.",
    options: [
      { label: "Buy the dip — trend intact", value: "long", rationale: "Buy weakness in uptrend" },
      { label: "Sell — trend break starting", value: "short", rationale: "Distribution" },
      { label: "Hold", value: "hold", rationale: "Indecision" },
    ],
    insight: "One down day is not enough to establish either a healthy reset or a trend reversal. Compare breadth, follow-through and new information before updating the simulated thesis.",
    difficulty: "Beginner",
  },
];

function localCalendarDayNumber(now: Date): number {
  // Convert the local Y/M/D to a timezone-neutral day number. This keeps the
  // challenge rotation aligned with the same local-day boundary used by streaks.
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

export function getTodayChallenge(now: Date = new Date()): DailyChallenge {
  return CHALLENGES[localCalendarDayNumber(now) % CHALLENGES.length];
}

export function getChallengeCount(): number {
  return CHALLENGES.length;
}

// ───────────────────────────────────────────
// STREAK ENGINE (localStorage)
// ───────────────────────────────────────────

export const DAILY_PROGRESS_KEY = "tradehq:daily-streak";
export const DAILY_PROGRESS_EVENT = "tradehq:daily-progress-updated";
const STORAGE_KEY = DAILY_PROGRESS_KEY;

export interface StreakState {
  current: number;
  longest: number;
  totalCompleted: number;
  lastCompletedDate: string | null; // local YYYY-MM-DD
  history: { date: string; challengeId: number; decision: ChallengeDecision }[];
}

const DEFAULT_STATE: StreakState = {
  current: 0,
  longest: 0,
  totalCompleted: 0,
  lastCompletedDate: null,
  history: [],
};

/**
 * Local-timezone day key (YYYY-MM-DD).
 * Switching from UTC to local time so a "day" matches the user's actual day —
 * critical for streaks not breaking when a user plays at 9pm local two days in a row
 * but the UTC boundary falls between them (or vice-versa).
 */
function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isYesterday(prev: string, todayKey: string): boolean {
  const [y, m, d] = todayKey.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  t.setDate(t.getDate() - 1);
  return dayKey(t) === prev;
}

// Back-compat alias (older callers)
const utcDateKey = dayKey;

export function getStreak(): StreakState {
  try {
    if (typeof window === "undefined") return DEFAULT_STATE;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as StreakState;
    // If user missed yesterday, current streak resets when they next view
    const todayKey = utcDateKey();
    if (parsed.lastCompletedDate && parsed.lastCompletedDate !== todayKey && !isYesterday(parsed.lastCompletedDate, todayKey)) {
      return { ...parsed, current: 0 };
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

export function hasPlayedToday(): boolean {
  const s = getStreak();
  return s.lastCompletedDate === utcDateKey();
}

/** Completing deeper practice secures the streak without answering the quick scenario. */
export function hasPlayedQuickToday(): boolean {
  return getStreak().history.some(h => h.date === utcDateKey() && h.challengeId > 0);
}

export function recordChallenge(challengeId: number, decision: ChallengeDecision): StreakState {
  const todayKey = utcDateKey();
  const prev = getStreak();
  if (prev.lastCompletedDate === todayKey) {
    // A later quick scenario fills in its real choice without counting another day.
    if (challengeId > 0 && prev.history.some(h => h.date === todayKey && h.challengeId === 0)) {
      const next = { ...prev, history: prev.history.map(h => h.date === todayKey && h.challengeId === 0 ? { ...h, challengeId, decision } : h) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (typeof window !== "undefined") window.dispatchEvent(new Event(DAILY_PROGRESS_EVENT));
      } catch {}
      return next;
    }
    return prev;
  }

  const continuingStreak = prev.lastCompletedDate && isYesterday(prev.lastCompletedDate, todayKey);
  const current = continuingStreak ? prev.current + 1 : 1;
  const longest = Math.max(prev.longest, current);

  const next: StreakState = {
    current,
    longest,
    totalCompleted: prev.totalCompleted + 1,
    lastCompletedDate: todayKey,
    history: [{ date: todayKey, challengeId, decision }, ...prev.history].slice(0, 100),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(DAILY_PROGRESS_EVENT));
  } catch {}
  return next;
}

export interface BadgeUnlock {
  threshold: number;
  label: string;
  emoji: string;
}

export const BADGES: BadgeUnlock[] = [
  { threshold: 3, label: "Spark", emoji: "✨" },
  { threshold: 7, label: "Iron Hand", emoji: "🛡️" },
  { threshold: 14, label: "Steel Mind", emoji: "⚔️" },
  { threshold: 30, label: "Diamond Hands", emoji: "💎" },
  { threshold: 100, label: "Legend", emoji: "👑" },
];

export function getUnlockedBadges(longest: number): BadgeUnlock[] {
  return BADGES.filter((b) => longest >= b.threshold);
}

export function getNextBadge(longest: number): BadgeUnlock | null {
  return BADGES.find((b) => longest < b.threshold) ?? null;
}

// ───────────────────────────────────────────
// BONUS KNOWLEDGE QUIZ (appears after main challenge)
// ───────────────────────────────────────────

export interface BonusQuestion {
  id: number;
  prompt: string;
  options: { label: string; correct: boolean; explain: string }[];
}

const BONUS_BANK: BonusQuestion[] = [
  {
    id: 1, prompt: "What does a sell stop order generally do when its trigger price is reached?",
    options: [
      { label: "Triggers a market order when the stop price is reached", correct: true, explain: "A stop becomes a market order at its trigger. Gaps and slippage can produce a worse fill, so it does not guarantee a maximum loss. TradeHQ does not execute stop orders; this is a conceptual question. See SEC Investor.gov, Types of Orders." },
      { label: "Guarantees you exit at the exact price you set", correct: false, explain: "Slippage in fast markets means stops can fill worse than the trigger." },
      { label: "Doubles your position when price drops", correct: false, explain: "That's averaging down — the opposite of stop-losses." },
    ],
  },
  {
    id: 2, prompt: "If RSI reads 80, the asset is generally considered…",
    options: [
      { label: "Oversold — likely bounce", correct: false, explain: "Oversold is RSI <30, not 80." },
      { label: "Conventionally called overbought; not a forecast", correct: true, explain: "RSI >70 signals overbought; >80 is extreme." },
      { label: "Neutral — keep buying", correct: false, explain: "Neutral RSI is around 50." },
    ],
  },
  {
    id: 3, prompt: "What's the '2% rule' in risk management?",
    options: [
      { label: "Use 2% of current equity as this lesson's example risk budget", correct: true, explain: "If 2% is recalculated from remaining equity, 10 consecutive full-risk losses leave about 81.7% of the starting balance — roughly an 18.3% drawdown before other effects." },
      { label: "Always target 2% profit per trade", correct: false, explain: "Profit targets aren't the rule — risk per trade is." },
      { label: "Trade only 2% of the day", correct: false, explain: "Not a real risk concept." },
    ],
  },
  {
    id: 4, prompt: "Why do traders watch the VIX?",
    options: [
      { label: "It measures expected S&P 500 volatility (the 'fear gauge')", correct: true, explain: "VIX reflects option-implied S&P 500 volatility over roughly 30 days. It does not predict the direction of the next market move." },
      { label: "It tracks Bitcoin dominance", correct: false, explain: "That's BTC.D, not VIX." },
      { label: "It signals interest-rate decisions", correct: false, explain: "Rate signals come from Fed funds futures." },
    ],
  },
  {
    id: 5, prompt: "What does higher reported volume during a breakout establish?",
    options: [
      { label: "More reported trading activity during the move", correct: true, explain: "Volume measures activity under the data source’s definition. It does not prove conviction or guarantee that the move continues." },
      { label: "A trap — short immediately", correct: false, explain: "Volume alone does not establish a reliable forecast or justify an immediate directional order." },
      { label: "The trend is ending", correct: false, explain: "The amount of reported volume does not by itself establish that a trend is ending." },
    ],
  },
  {
    id: 6, prompt: "What does 'diversification' protect you from?",
    options: [
      { label: "Single-asset blow-up risk", correct: true, explain: "Spreading exposure can reduce concentration in one asset, but correlated holdings can still lose together and no allocation prevents every loss." },
      { label: "All market crashes", correct: false, explain: "In a broad crash, most assets fall together — diversification helps but isn't bulletproof." },
      { label: "Inflation", correct: false, explain: "Inflation needs hedges (commodities, TIPS), not just diversification." },
    ],
  },
  {
    id: 7, prompt: "What's 'slippage'?",
    options: [
      { label: "Difference between expected price and actual fill", correct: true, explain: "Common in fast or thin markets — eats into edge." },
      { label: "A broker fee", correct: false, explain: "Fees are separate — slippage is execution cost." },
      { label: "Profit you didn't take", correct: false, explain: "That's opportunity cost, not slippage." },
    ],
  },
  {
    id: 8, prompt: "Why is 'risk-reward ratio' so important?",
    options: [
      { label: "Fixed realized +3R wins and −1R losses at 40% wins average +0.6R before costs", correct: true, explain: "For those exact realized inputs, 0.4×3−0.6×1=0.6R before costs. Planned targets, actual outcomes and fees can differ; a stated ratio does not guarantee profit." },
      { label: "Higher win rate always = more profit", correct: false, explain: "Not if the wins are tiny and losses huge." },
      { label: "It tells you which asset to trade", correct: false, explain: "It's about trade structure, not asset selection." },
    ],
  },
];

export function getTodayBonus(now: Date = new Date()): BonusQuestion {
  return BONUS_BANK[localCalendarDayNumber(now) % BONUS_BANK.length];
}