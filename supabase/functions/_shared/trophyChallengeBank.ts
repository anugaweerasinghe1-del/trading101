/** Authored, versioned, fictional educational challenges.
 * Correct-answer keys stay in the server bundle and never go to the read action.
 * These assessments measure completion of a scored exercise, not trading skill.
 */
export const TROPHY_CHALLENGE_VERSION = "trophy-cases-v1";
export type TrophyQuestion = { prompt: string; options: readonly [string, string, string]; correct: number; explanation: string };
export type TrophyChallenge = {
  id: string; title: string; detail: string; category: "case" | "arena" | "review" | "followup";
  questions: readonly TrophyQuestion[];
};
const q = (prompt: string, options: [string, string, string], correct: number, explanation: string): TrophyQuestion =>
  ({ prompt, options, correct, explanation });

export const TROPHY_CHALLENGES: readonly TrophyChallenge[] = [
  { id: "exit-planning", title: "Exit Planner", category: "case",
    detail: "A fictional exit plan is a worksheet, never a guaranteed order or outcome.",
    questions: [
      q("A fictional holding has 10 units. If an exit fills at $45 per unit, what are gross proceeds before fees?",
        ["$450", "$405", "$45"], 0, "Ten units times $45 is $450 before charges."),
      q("You plan to sell at $45, but the next executable quote is $43. Which statement is sound?",
        ["The plan guarantees $45", "A future fill is not guaranteed by the plan", "The original quote must be restored"], 1,
        "A planned price is not execution evidence; quotes and market conditions can change."),
      q("A position falls from $50 to $45 and no sale occurs. How should the change be described?",
        ["Realized trading profit", "A guaranteed stop order", "An unrealized marked decrease"], 2,
        "Without an executed sale, the change is an unrealized valuation difference."),
    ] },
  { id: "fees-and-spreads", title: "Cost Counter", category: "case",
    detail: "Work through a hypothetical spread and transaction fee.",
    questions: [
      q("The displayed bid is $99 and ask $101. What is the spread?",
        ["$1", "$2", "$200"], 1, "The ask minus the bid is $2 per unit."),
      q("A fictional purchase has $2,000 notional and a 0.1% fee. What is the fee?",
        ["$2", "$20", "$0.20"], 0, "0.001 times $2,000 is $2."),
      q("A buy incurs $2 in fees and a later sale incurs $2. What total fees reduce the round-trip result?",
        ["$0", "$2", "$4"], 2, "Both buy-side and sell-side fees contribute to the total cost."),
    ] },
  { id: "allocation-exposure", title: "Portfolio Lens", category: "case",
    detail: "Interpret concentration and changing allocation in a hypothetical account.",
    questions: [
      q("A portfolio contains $8,000 cash and $2,000 of a fictional asset. What is that asset's allocation?",
        ["20%", "25%", "80%"], 0, "$2,000 divided by $10,000 is 20%."),
      q("That $2,000 position rises 10% while cash stays unchanged. What is the whole-account gain?",
        ["10%", "20%", "2%"], 2, "The $200 position gain is 2% of the initial $10,000 account."),
      q("A single asset is 90% of a portfolio. Which statement is sound?",
        ["It guarantees higher returns", "There is substantial concentration exposure", "Its value cannot fluctuate"], 1,
        "Concentration changes exposure, without establishing future returns."),
    ] },
  { id: "arena-first-order", title: "Arena — Your first decision", category: "arena",
    detail: "Scored review of Northstar, the Arena's fictional first-order path.",
    questions: [
      q("Northstar's fictional price is $100. What is the pre-fee cost of 5 units?",
        ["$500", "$5", "$505"], 0, "Five units times $100 is $500 before the modeled fee."),
      q("At a 0.1% transaction fee, what is the fee on that $500 notional?",
        ["$5", "$0.50", "$50"], 1, "0.001 times $500 is $0.50."),
      q("After the imaginary price changes, what remains valid?",
        ["A single bounce predicts the next price", "The fee disappears after a gain", "Marked value and paid fees are separate"], 2,
        "A changed quote affects marked value, while an incurred fee remains an expense."),
    ] },
  { id: "arena-size-matters", title: "Arena — Size changes everything", category: "arena",
    detail: "A scored exercise using Atlas's authored $120 to $108 path.",
    questions: [
      q("The fictional price drops from $120 to $108. What is the change per unit?",
        ["−$12", "−$120", "−$1.20"], 0, "The marked decrease is $12 per unit."),
      q("How much larger is a fixed price movement's dollar impact on 10 units than on 1 unit?",
        ["Equal", "10 times", "100 times"], 1, "With the same price change, ten times as many units yields ten times the dollar change."),
      q("What can these invented prices actually establish?",
        ["A safe future position size", "Future market direction", "The arithmetic effect of exposure"], 2,
        "An authored classroom path demonstrates arithmetic, not real-world performance."),
    ] },
  { id: "arena-plan-under-pressure", title: "Arena — Stay with the plan", category: "arena",
    detail: "A scored review of decisions under uncertainty, not a reward for profit.",
    questions: [
      q("A new rumor arrives without a verifiable source. Which response respects uncertainty?",
        ["Pause and evaluate the evidence", "Assume it must be correct", "Increase size because others are excited"], 0,
        "Pausing can be an appropriate educational choice when evidence is incomplete."),
      q("An invented price rises immediately after a buy. What does that prove?",
        ["The plan always works", "Only the outcome of that one fictional step", "The next step will rise"], 1,
        "One outcome does not validate a general strategy."),
      q("What belongs in a useful reflection after a hypothetical decision?",
        ["A promise of guaranteed returns", "A hidden real-money tip", "The assumption, decision and alternative considered"], 2,
        "Good reflection makes the initial assumption and considered alternatives explicit."),
    ] },
  { id: "arena-pause", title: "Arena — Pause Button", category: "arena",
    detail: "Choose to hold and explain why in a scored uncertainty scenario.",
    questions: [
      q("In the designated fictional Arena moment, an unverified rumor contradicts the written plan. What action best avoids pretending certainty?",
        ["Buy", "Hold / observe", "Sell automatically"], 1,
        "Holding is a valid decision when the information is insufficient."),
      q("Why might holding be appropriate in this particular invented case?",
        ["It guarantees a profit", "It is always optimal in real markets", "The new information lacks verification"], 2,
        "The claim is unverified. This does not say holding is universally optimal."),
      q("What should a learner record before deciding again?",
        ["The missing evidence and planned reassessment", "A certain forecast", "An invented trade confirmation"], 0,
        "A decision journal can identify the unresolved question without forecasting."),
    ] },
  { id: "arena-decision-review", title: "Arena — Decision Review", category: "review",
    detail: "A structured review becomes eligible after one scored Arena scenario.",
    questions: [
      q("Which is a complete decision review?",
        ["I won, so my reasoning was perfect", "Assumption, decision, observed outcome and alternative", "The chart went up"], 1,
        "Review both the reasoning and the outcome, which can diverge."),
      q("If a favorable outcome followed weak reasoning, what can you conclude?",
        ["The method must be reliable", "No review is needed", "Outcome alone does not establish reasoning quality"], 2,
        "A positive result cannot prove the underlying decision was sound."),
      q("A review identifies an assumption as unsupported. What is the useful next step?",
        ["Record the uncertainty and reconsider it next time", "Rewrite the original outcome", "Claim a live-market prediction"], 0,
        "Reflection should preserve what was observed and what needs further checking."),
    ] },
  { id: "second-look-initial", title: "Second Look — First attempt", category: "followup",
    detail: "A genuine incorrect first answer is saved privately. Then try a different follow-up example.",
    questions: [
      q("An account starts with $9,000 cash and a $1,000 position. The position rises 10%. What is the whole account's percentage gain?",
        ["10%", "1%", "0.1%"], 1, "The gain is $100 on the initial $10,000 account, or 1%."),
    ] },
  { id: "second-look-followup", title: "Second Look — Follow-up", category: "followup",
    detail: "Correct the same concept with a different question after a recorded miss.",
    questions: [
      q("An account has a $4,000 position and $16,000 cash. The position rises 5%. What is the whole-account percentage gain?",
        ["1%", "5%", "20%"], 0, "The gain is $200 divided by the initial $20,000 account: 1%."),
    ] },
];

export function trophyChallenge(id: unknown): TrophyChallenge | null {
  return typeof id === "string" ? TROPHY_CHALLENGES.find(challenge => challenge.id === id) ?? null : null;
}
export function publicTrophyChallenge(challenge: TrophyChallenge) {
  return { id: challenge.id, title: challenge.title, detail: challenge.detail, category: challenge.category,
    questions: challenge.questions.map(({ prompt, options }) => ({ prompt, options })) };
}
export function gradeTrophyChallenge(challenge: TrophyChallenge, answers: unknown) {
  if (!Array.isArray(answers) || answers.length !== challenge.questions.length ||
      answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 ||
        answer >= challenge.questions[index].options.length)) return null;
  const points = challenge.questions.filter((question,index) => question.correct === answers[index]).length;
  return { points, possible: challenge.questions.length,
    passed: challenge.id === "second-look-initial" ? points === 0 : points === challenge.questions.length,
    explanations: challenge.questions.map(q => q.explanation) };
}
