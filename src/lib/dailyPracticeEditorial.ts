import type { DailyExercise } from "../../supabase/functions/_shared/dailyPractice";

// Exact-text display clarifications also cover saved and already-published cases.
// Stored source, answer keys, options and learner attempts are never rewritten.
const textPatches: readonly (readonly [string, string])[] = [
  [
    "Your hypothetical $10,000 account holds $2,000 of stock A and $8,000 of an ETF. For this worksheet the ETF has a fixed 10% exposure to stock A. Ignore other assets, fees and changing weights. Although you see two account rows, part of both rows depends on the same company. Look through the fund rather than counting labels.\n\nIn a separate sensitivity worksheet, stock A falls 20% and every other ETF holding stays unchanged. Keep the ETF\u2019s 10% A weight fixed for this calculation, with no fees or trades. Trace the direct holding and the indirect slice separately before adding their losses. The result is conditional on these assumptions; actual fund weights and other constituents can also change.",
    "Your hypothetical $10,000 account holds $2,000 of stock A and $8,000 of an ETF. At the start of this worksheet the ETF has a 10% exposure to stock A. Assume no other account holdings and ignore fees. Although you see two account rows, part of both rows depends on the same company. Look through the fund rather than counting labels.\n\nIn a separate sensitivity worksheet, stock A falls 20% and every other ETF holding stays unchanged. Use the ETF\u2019s initial 10% A weight to calculate its starting exposure, with no fees or trades. The price change can alter the fund\u2019s ending weights. Trace the direct holding and the indirect slice separately before adding their losses. The result is conditional on these assumptions; actual fund weights and other constituents can also change."
  ],
  [
    "Ten percent of the $8,000 ETF position is $800 under the assumed fixed weight. A fund holding can contain exposure to an asset already held directly, even though it appears as another row.",
    "Ten percent of the $8,000 ETF position is $800 under the assumed initial weight. A fund holding can contain exposure to an asset already held directly, even though it appears as another row."
  ],
  [
    "Add the $400 direct loss and $160 indirect loss. The $560 total is 5.6% of account equity under the fixed-weight, other-assets-unchanged assumptions.",
    "Add the $400 direct loss and $160 indirect loss. The $560 total is 5.6% of account equity under the initial-exposure, other-assets-unchanged assumptions."
  ]
];
const fixedMarkScenario = "A hypothetical portfolio holds an asset with a fixed simulator quote of $25. The provider has no usable mapping for that asset. Another holding has a valid provider snapshot. The fixed asset remains worth the same marked amount while the provider-priced holding changes. This is a fallback valuation, not evidence that the first asset\u2019s real market stopped moving.\n\nAssume the account holds four units of the unsupported asset at its fixed $25 simulator mark, plus a provider-priced position worth $900. Later that second position rises to $990 while the unsupported mark stays fixed. No trades occur. A classmate claims that a functioning refresh makes both positions live-priced. Check the contribution of each holding and identify what the combined total can and cannot establish.";

export function dailyPracticeDisplayText(text: string): string {
  for (const [expected, replacement] of textPatches) text = text.replace(expected, replacement);
  return text;
}

export function dailyPracticeDisplay(exercise: DailyExercise): DailyExercise {
  const scenario = dailyPracticeDisplayText(exercise.scenario);
  const questions = exercise.questions.map(question => {
    const explanation = dailyPracticeDisplayText(question.explanation);
    return explanation === question.explanation ? question : { ...question, explanation };
  });
  const clarifyVisual = exercise.id === "practice-26" && exercise.scenario === fixedMarkScenario
    && exercise.visual.caption === "Hypothetical case inputs — not a live market chart"
    && exercise.visual.unit === "$" && JSON.stringify(exercise.visual.bars.map(b => [b.label, b.value]))
      === JSON.stringify([["Fixed mark", 25], ["Provider mark", 38]]);
  const visual = clarifyVisual ? {
    caption: "Hypothetical position values — fixed mark and provider snapshots",
    unit: "$",
    bars: [{ label: "Fixed-mark holding", value: 100 }, { label: "Provider holding before", value: 900 }, { label: "Provider holding after", value: 990 }],
  } : exercise.visual;
  if (scenario === exercise.scenario && visual === exercise.visual
    && questions.every((question, index) => question === exercise.questions[index])) return exercise;
  return { ...exercise, scenario, visual, questions };
}
