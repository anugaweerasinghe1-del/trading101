/**
 * Educational questions derived from the simulator's recorded market-order
 * model. Rotating prompts prevent learners from merely memorizing option 1.
 * No market predictions, scoring badges or trading nudges.
 */
export interface TradeReviewQuestion {
  id: string;
  question: string;
  options: readonly [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

const FIRST_BUY: TradeReviewQuestion = {
  id: "buy-cash",
  question: "What happens to your virtual cash when a simulated buy order is recorded?",
  options: [
    "It increases by the displayed Bitcoin value.",
    "It decreases by the confirmed purchase cost including the simulated fee.",
    "It remains the same because the position is virtual.",
  ],
  correctIndex: 1,
  explanation: "A simulated buy uses virtual cash. The recorded execution cost and fee—not a later chart quote—determine the cash movement.",
};

const FIRST_SELL: TradeReviewQuestion = {
  id: "sell-cash",
  question: "What happens to virtual cash when a recorded practice position is sold?",
  options: [
    "It decreases by the displayed market value.",
    "It remains unchanged because it is not real money.",
    "It increases by the recorded sale proceeds after the simulated fee.",
  ],
  correctIndex: 2,
  explanation: "A simulated sale returns recorded net proceeds to virtual cash after the transaction fee. It does not create real-money proceeds.",
};

const RECALL: readonly TradeReviewQuestion[] = [
  {
    id: "execution",
    question: "The current chart quote has changed. Which number explains what your old simulated order actually cost?",
    options: ["The latest displayed quote", "The asset's highest past price", "The recorded execution and its fee"],
    correctIndex: 2,
    explanation: "A chart shows a reference or simulated price at a particular time; the saved execution and fee describe the earlier recorded transaction.",
  },
  {
    id: "position-size",
    question: "At an unchanged simulated execution price, what increases the dollar cost of a virtual buy?",
    options: ["Increasing the quantity purchased", "Choosing a different chart colour", "Refreshing the page"],
    correctIndex: 0,
    explanation: "Total practice cost depends on price × quantity plus the applicable simulated fee. More quantity increases exposure even if price stays fixed.",
  },
  {
    id: "limits",
    question: "What can a profitable virtual trade NOT establish?",
    options: ["The recorded virtual cash change", "That a real trade would fill and earn the same return", "The simulated fee shown on the order"],
    correctIndex: 1,
    explanation: "Simulated fills omit some real-world spreads, liquidity constraints, slippage and emotional effects. Virtual returns cannot predict real outcomes.",
  },
  {
    id: "sell-proceeds",
    question: "When reviewing a simulated sale, what is the correct way to explain the cash received?",
    options: ["Use the gross sale price without fees", "Read the newest chart price as if it were the historical fill", "Use confirmed sale proceeds after the simulated fee"],
    correctIndex: 2,
    explanation: "The saved sale value after its fee explains virtual cash received. Quotes displayed later do not rewrite the trade history.",
  },
] as const;

/** The question is stable across reloads during the same UTC date. */
export function tradeReviewQuestion(side: "buy" | "sell", recall: boolean, now = Date.now()): TradeReviewQuestion {
  if (!recall) return side === "sell" ? FIRST_SELL : FIRST_BUY;
  const day = Number.isFinite(now) ? Math.max(0, Math.floor(now / 86_400_000)) : 0;
  return RECALL[day % RECALL.length];
}
