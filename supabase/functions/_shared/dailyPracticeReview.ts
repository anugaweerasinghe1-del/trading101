import { normalized, type DailyExercise } from './dailyPractice.ts';

type Case = Pick<DailyExercise, 'title' | 'scenario'>;
export interface PracticeReviewFinding {
  exerciseIndex: number;
  questionIndex?: number;
  relatedExerciseIndex: number;
  relatedQuestionIndex?: number;
  kind: 'similar-case' | 'similar-question' | 'repeated-explanation';
}

const words = (value: string) => new Set(normalized(value).split(' ').filter(word => word.length > 3));
const overlap = (a: Set<string>, b: Set<string>) => [...a].filter(word => b.has(word)).length / Math.max(a.size, b.size, 1);
/** Wording overlap, not a factual, mathematical or semantic quality judgement. */
export function similarPracticeScenarios(a: string, b: string): boolean {
  return overlap(words(a), words(b)) > 0.72;
}

/** Checks the new part against history AND its own earlier cases. No extra model call. */
export function hasRepeatedPracticeCase(items: Case[], previous: Case[] = []): boolean {
  const seen = previous.map(item => ({ title: normalized(item.title), scenario: words(item.scenario) }));
  for (const item of items) {
    const candidate = { title: normalized(item.title), scenario: words(item.scenario) };
    if (seen.some(other => candidate.title === other.title || overlap(candidate.scenario, other.scenario) > 0.72)) return true;
    seen.push(candidate);
  }
  return false;
}

/** Local editorial triage only. A finding never approves, rejects or publishes content. */
export function reviewPracticeExercises(exercises: DailyExercise[]): PracticeReviewFinding[] {
  const findings: PracticeReviewFinding[] = [];
  const scenarios = exercises.map(exercise => words(exercise.scenario));
  exercises.forEach((exercise, exerciseIndex) => {
    for (let relatedExerciseIndex = 0; relatedExerciseIndex < exerciseIndex; relatedExerciseIndex++) {
      if (overlap(scenarios[exerciseIndex], scenarios[relatedExerciseIndex]) > 0.72) {
        findings.push({ kind: 'similar-case', exerciseIndex, relatedExerciseIndex });
        break; // One useful comparison per case; avoid a flood from the same repeated passage.
      }
    }
    const prompts = exercise.questions.map(question => words(question.prompt));
    exercise.questions.forEach((question, questionIndex) => {
      for (let earlier = 0; earlier < questionIndex; earlier++) {
        const other = exercise.questions[earlier];
        const x = prompts[questionIndex], y = prompts[earlier];
        if (normalized(question.prompt) === normalized(other.prompt) || (Math.min(x.size, y.size) >= 6 && overlap(x, y) > 0.85)) {
          findings.push({ kind: 'similar-question', exerciseIndex, questionIndex, relatedExerciseIndex: exerciseIndex, relatedQuestionIndex: earlier });
          break;
        }
      }
      const repeated = exercise.questions.findIndex((other, earlier) => earlier < questionIndex && normalized(other.explanation) === normalized(question.explanation));
      if (repeated >= 0) findings.push({ kind: 'repeated-explanation', exerciseIndex, questionIndex, relatedExerciseIndex: exerciseIndex, relatedQuestionIndex: repeated });
    });
  });
  return findings;
}
