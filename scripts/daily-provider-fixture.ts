import type { DailyExercise } from "../supabase/functions/_shared/dailyPractice";

function splitText(text: string): [string, string] {
  const split = text.indexOf(" ", Math.floor(text.length / 2));
  return [text.slice(0, split), text.slice(split + 1)];
}

export function dailyProviderExercises(exercises: DailyExercise[]) {
  return exercises.map(exercise => ({
    ...exercise,
    reflectionGuide: splitText(exercise.reflectionGuide),
    questions: Object.fromEntries(exercise.questions.map((question, index) => [`q${index + 1}`, { ...question, explanation: splitText(question.explanation) }])),
  }));
}
