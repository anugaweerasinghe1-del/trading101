/**
 * TradeHQ Practice Arena: self-contained fictional decision exercises.
 * Prices are deliberately authored and do NOT represent historical, live, or executable market data.
 * State is browser-local and NEVER reads/writes the ranked/guest trading portfolio.
 */
export type ArenaAction = "buy" | "sell" | "hold";
export type ArenaLevel = "Beginner" | "Developing" | "Intermediate";

export interface ArenaScene {
  price: number;
  heading: string;
  context: string;
  question: string;
  insight: string;
}

export interface ArenaScenario {
  id: string;
  level: ArenaLevel;
  title: string;
  subtitle: string;
  skill: string;
  intro: string;
  completion: string;
  nextHref: string;
  nextLabel: string;
  scenes: readonly ArenaScene[];
}

export const ARENA_SCENARIOS: readonly ArenaScenario[] = [
  {
    id: "first-order", level: "Beginner", title: "Your first decision",
    subtitle: "Five small decisions. No account, no pressure.",
    skill: "Cash, holdings & simulated fees",
    intro: "You've entered an invented market. See how a price, a quantity and a 0.1% virtual fee affect your balance. No decision is required to involve a trade.",
    completion: "You can now compare your virtual cash with the value of a holding. A purchase moves most of its notional into a position; the fee is an expense. Practice results do not establish real-world readiness.",
    nextHref: "/start", nextLabel: "Continue the first-trade journey",
    scenes: [
      { price: 100, heading: "The opening snapshot", context: "Northstar is a fictional share marked at $100. You start with $10,000 in exercise-only virtual cash. Nothing is at risk.", question: "Would you observe or buy a small practice position?", insight: "The price is a classroom input, not an exchange quote. Buying converts part of cash into a holding and adds a 0.1% model fee." },
      { price: 102, heading: "A small move upward", context: "One new fictional observation arrives. Northstar is now marked at $102. No real trading venue is involved.", question: "What would you do before another observation?", insight: "A higher displayed price may lift a held position's marked value, but a small change does not establish a pattern or predict the next move." },
      { price: 99, heading: "The price reverses", context: "The next invented snapshot is $99. An earlier gain has not guaranteed a continuing rise.", question: "What do your cash and held units tell you?", insight: "Compare cash, quantity and marked holding value. An unrealised change is different from the already-recorded virtual transaction fee." },
      { price: 97, heading: "Another declining observation", context: "Northstar is marked at $97. There is no claim that this drop reflects actual volatility or a news event.", question: "Would changing the position teach you anything different?", insight: "Losses and gains are outcomes, not automatic judgments of reasoning. Before acting, make clear what your exercise is trying to test." },
      { price: 103, heading: "A bounce without a guarantee", context: "The price rebounds to a fictional $103. Your earlier choice cannot be changed retroactively.", question: "What did you learn about a changing price and a fixed fee?", insight: "Your portfolio value changes with a new mark; a paid simulator fee does not disappear when a price rises. Always separate both effects." },
      { price: 101, heading: "The closing observation", context: "The final made-up reference price is $101. Review what moved and what was charged.", question: "What can the numbers actually establish?", insight: "The finished exercise demonstrates arithmetic and choices under uncertainty, not evidence of real market expertise." },
    ],
  },
  {
    id: "size-matters", level: "Developing", title: "Size changes everything",
    subtitle: "The same market path, different exposure.",
    skill: "Position size & concentration",
    intro: "A fictional instrument moves through a volatile sequence. Choose 1, 5 or 10 units and see the difference without risking your main TradeHQ portfolio.",
    completion: "Position size changes the dollar impact of each invented price movement. This scenario does not justify a universal 'safe' position size or estimate the chance of a real loss.",
    nextHref: "/learn/article/risk-management-in-trading", nextLabel: "Study risk management",
    scenes: [
      { price: 120, heading: "The tempting opening", context: "Atlas, an invented instrument, is marked at $120. The challenge is to think about exposure, not to guess the next move.", question: "How much virtual exposure is useful for this exercise?", insight: "At $120, ten units cost roughly ten times as much as one. A higher number of units magnifies dollar changes in both directions." },
      { price: 127, heading: "A sharp fictional rally", context: "The invented reference rises to $127. A short sequence of gains may be exciting, but it says little about what comes next.", question: "Would a good outcome change your original plan?", insight: "Avoid confusing the latest favorable outcome with evidence that a larger size was justified at entry." },
      { price: 118, heading: "A complete reversal", context: "The next fictional mark is $118. All previous gains can reverse in a simple classroom scenario.", question: "Check how many dollars each unit now represents.", insight: "For any fixed position quantity, dollar change equals units times price change. Virtual fees also affect cash and total equity." },
      { price: 108, heading: "Adverse movement", context: "The invented mark moves down to $108, illustrating a larger adverse path.", question: "How does the same percentage movement affect 1 versus 10 units?", insight: "An identical percentage move creates a larger dollar change when quantity is larger. This is arithmetic, not a market-risk forecast." },
      { price: 115, heading: "Partial recovery", context: "The fictional quote recovers to $115 but remains below the initial $120 mark.", question: "What should matter more: a single bounce or your written test goal?", insight: "A partial recovery does not reveal future direction. Examine exposure, costs and the assumptions you made before the move." },
      { price: 112, heading: "Closing mark", context: "The final made-up quote is $112. The path is fixed and cannot be used for backtesting a real instrument.", question: "Which observation about position size remains valid?", insight: "Exposure and fee calculations are transparent; performance on invented data does not validate a trading system." },
    ],
  },
  {
    id: "plan-under-pressure", level: "Intermediate", title: "Stay with the plan",
    subtitle: "Make your reasoning visible, then review it.",
    skill: "Decision discipline & uncertainty",
    intro: "An invented asset moves through conflicting signals. Write a short reason, or simply observe. This is a decision-record exercise, not an invitation to trade more.",
    completion: "Review whether your decisions aligned with the purpose you stated. Neither a positive exercise return nor following a plan proves a strategy will work in a real market.",
    nextHref: "/daily", nextLabel: "Try a deeper Daily Practice case",
    scenes: [
      { price: 80, heading: "A quiet beginning", context: "Meridian is a fictional asset marked at $80. You have no confirmed trend, liquidity or economic context.", question: "What would make you act, or wait for more information?", insight: "A plan should identify a condition to observe. A chart snapshot alone cannot validate an entry or exit method." },
      { price: 84, heading: "A tempting move", context: "The next invented mark is $84. A social message claims it will continue rising, but provides no evidence.", question: "Does the message change your documented reason?", insight: "Unsupported social claims are not evidence. Distinguish an observation from an assertion about a future price." },
      { price: 82, heading: "The first setback", context: "The fictional quote slips to $82. Someone else boasts about a higher return from a larger position.", question: "Would you change exposure because of someone else's result?", insight: "A leaderboard snapshot cannot establish comparable risk or skill. An isolated positive result does not justify copying a position." },
      { price: 72, heading: "A stressful headline", context: "A fictional headline describes market uncertainty. The exercise quote drops to $72, with no realistic order-book model.", question: "How would you describe your exposure and assumptions?", insight: "Stress is a context for reviewing your stated reasoning, not proof of an emotional diagnosis or a reliable price signal." },
      { price: 77, heading: "The bounce", context: "The invented mark rises to $77. There is no guarantee this recovery will continue.", question: "Will the next decision come from your goal or from trying to erase the previous result?", insight: "Avoid a retrospective story that defines the best decision only by whether the next price moved in your favor." },
      { price: 75, heading: "Final observation", context: "The scenario closes at a made-up $75. No real trade or historical simulation was performed.", question: "What assumption would you revise in a second practice run?", insight: "Reflect on your actual reasoning, exposure and model limits. An outcome alone does not prove decision quality." },
    ],
  },
];

export const ARENA_STORAGE_KEY = "tradehq:practice-arena:v1";
export const ARENA_START_CASH = 10_000;
export const ARENA_FEE_RATE = 0.001;
export const ARENA_SIZES = [1, 5, 10] as const;
export type ArenaUnits = typeof ARENA_SIZES[number];

export interface ArenaDecision {
  step: number;
  action: ArenaAction;
  units: number;
  price: number;
  nextPrice: number;
  fee: number;
  cashAfter: number;
  holdingAfter: number;
  markedEquity: number;
  note: string;
}

export interface ArenaSession {
  scenarioId: string;
  index: number;
  cash: number;
  holdings: number;
  fees: number;
  decisions: ArenaDecision[];
  pendingReview: boolean;
  finishedAt: string | null;
  /** Optional learner-authored closing reflection; remains browser-local. */
  finalReflection?: string;
}

export interface ArenaStored {
  version: 1;
  active: ArenaSession | null;
  completions: Record<string, { at: string; count: number }>;
}

export function scenarioById(id: string) { return ARENA_SCENARIOS.find(s => s.id === id); }
export function roundMoney(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
export function freshArena(): ArenaStored { return { version: 1, active: null, completions: {} }; }
export function beginArena(id: string): ArenaSession {
  if (!scenarioById(id)) throw Error("Unknown practice scenario");
  return { scenarioId: id, index: 0, cash: ARENA_START_CASH, holdings: 0, fees: 0, decisions: [], pendingReview: false, finishedAt: null };
}
export function currentMark(session: ArenaSession): number {
  return scenarioById(session.scenarioId)?.scenes[Math.min(session.index, scenarioById(session.scenarioId)!.scenes.length - 1)].price ?? 0;
}
export function markedEquity(session: ArenaSession): number { return roundMoney(session.cash + session.holdings * currentMark(session)); }

/** Price effect includes marks on open positions, so it is NOT labelled realized P&L. */
export function arenaOutcome(session: ArenaSession) {
  const equity = markedEquity(session);
  const totalChange = roundMoney(equity - ARENA_START_CASH);
  const fees = roundMoney(session.fees);
  return { equity, totalChange, fees, priceEffect: roundMoney(totalChange + fees) };
}

export function recordArenaDecision(session: ArenaSession, action: ArenaAction, units: ArenaUnits, note = ""): ArenaSession {
  const scenario = scenarioById(session.scenarioId);
  if (!scenario || session.pendingReview || session.finishedAt || session.index >= scenario.scenes.length - 1) throw Error("This round is not available.");
  if (!["buy", "sell", "hold"].includes(action) || !ARENA_SIZES.includes(units)) throw Error("Invalid practice decision.");
  const price = scenario.scenes[session.index].price;
  const quantity = action === "hold" ? 0 : units;
  const notional = quantity * price;
  const fee = action === "hold" ? 0 : roundMoney(notional * ARENA_FEE_RATE);
  if (action === "buy" && roundMoney(notional + fee) > session.cash) throw Error("Not enough exercise cash.");
  if (action === "sell" && quantity > session.holdings) throw Error("You cannot sell units you do not hold.");
  const cashAfter = roundMoney(session.cash + (action === "sell" ? notional - fee : action === "buy" ? -notional - fee : 0));
  const holdingAfter = session.holdings + (action === "buy" ? quantity : action === "sell" ? -quantity : 0);
  const nextPrice = scenario.scenes[session.index + 1].price;
  const decision: ArenaDecision = {
    step: session.index + 1, action, units: quantity, price, nextPrice, fee,
    cashAfter, holdingAfter, markedEquity: roundMoney(cashAfter + holdingAfter * nextPrice),
    note: note.slice(0, 240).trim(),
  };
  return {
    ...session, index: session.index + 1, cash: cashAfter, holdings: holdingAfter,
    fees: roundMoney(session.fees + fee), decisions: [...session.decisions, decision],
    pendingReview: true,
  };
}
export function continueArena(session: ArenaSession, at = new Date().toISOString()): ArenaSession {
  if (!session.pendingReview) return session;
  const final = session.index === (scenarioById(session.scenarioId)?.scenes.length ?? 1) - 1;
  return { ...session, pendingReview: false, finishedAt: final ? at : null };
}
export function isArenaSession(value: unknown): value is ArenaSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as Partial<ArenaSession>;
  const scenario = scenarioById(String(s.scenarioId ?? ""));
  if (!scenario || !Number.isInteger(s.index) || s.index! < 0 || s.index! >= scenario.scenes.length) return false;
  if (![s.cash, s.holdings, s.fees].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1_000_000)) return false;
  if (!Array.isArray(s.decisions) || s.decisions.length !== s.index || typeof s.pendingReview !== "boolean") return false;
  if (!(s.finishedAt === null || (typeof s.finishedAt === "string" && !Number.isNaN(Date.parse(s.finishedAt))))) return false;
  if (s.pendingReview && !s.decisions.length) return false;
  if (s.finalReflection !== undefined && (typeof s.finalReflection !== "string" || s.finalReflection.length > 400)) return false;
  if (s.finishedAt && (s.index !== scenario.scenes.length - 1 || s.pendingReview)) return false;
  return s.decisions.every((d, i) => d && typeof d === "object" && d.step === i + 1 &&
    ["buy", "sell", "hold"].includes(d.action) && typeof d.note === "string" && d.note.length <= 240 &&
    [d.price, d.nextPrice, d.fee, d.cashAfter, d.holdingAfter, d.markedEquity, d.units].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1_000_000));
}
export function parseArena(raw: string | null): ArenaStored {
  if (!raw || raw.length > 120_000) return freshArena();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return freshArena();
    const value = parsed as Partial<ArenaStored>;
    if (value.version !== 1) return freshArena();
    const active = isArenaSession(value.active) ? value.active : null;
    const completions: ArenaStored["completions"] = Object.create(null) as ArenaStored["completions"];
    for (const scenario of ARENA_SCENARIOS) {
      const entry = value.completions && typeof value.completions === "object" && !Array.isArray(value.completions)
        ? value.completions[scenario.id] : null;
      if (entry && typeof entry.at === "string" && !Number.isNaN(Date.parse(entry.at)) && Number.isInteger(entry.count) && entry.count > 0 && entry.count <= 10000)
        completions[scenario.id] = { at: entry.at, count: entry.count };
    }
    return { version: 1, active, completions };
  } catch { return freshArena(); }
}
export function loadArena(): ArenaStored {
  if (typeof window === "undefined") return freshArena();
  try { return parseArena(window.localStorage.getItem(ARENA_STORAGE_KEY)); } catch { return freshArena(); }
}
export function storeArena(value: ArenaStored): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(value)); } catch { /* Private mode: session still works in memory. */ }
}
export function completeArena(store: ArenaStored, session: ArenaSession): ArenaStored {
  if (!session.finishedAt || !scenarioById(session.scenarioId)) return store;
  const prior = store.completions[session.scenarioId];
  if (store.active?.finishedAt === session.finishedAt && prior?.at === session.finishedAt) return store;
  return { version: 1, active: session, completions: { ...store.completions, [session.scenarioId]: {
    at: session.finishedAt, count: (prior?.count ?? 0) + 1,
  } } };
}
