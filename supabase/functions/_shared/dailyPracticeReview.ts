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
const phrases = (value: string) => {
  const tokens = normalized(value).split(' ').filter(word => word.length > 3);
  return new Set(tokens.slice(1).map((word, index) => tokens[index] + ' ' + word));
};
/** Wording overlap for editorial triage, NOT an automatic rejection criterion. */
export function similarPracticeScenarios(a: string, b: string): boolean {
  return overlap(words(a), words(b)) > 0.72;
}
export interface PracticeRepeat {
  caseIndex: number; relatedIndex: number; location: 'history' | 'part'; kind: 'title' | 'near-copy';
}
/** The hard gate rejects exact titles and near-verbatim scenarios, not shared finance vocabulary.
 * High bag-of-words overlap alone is merely a human-review finding: two different
 * numerical lessons may naturally use the same financial terms. */
export function findRepeatedPracticeCase(items: Case[], previous: Case[] = []): PracticeRepeat | null {
  const seen = previous.map(item => ({
    title: normalized(item.title), text: normalized(item.scenario),
    words: words(item.scenario), phrases: phrases(item.scenario),
  }));
  for (const [caseIndex, item] of items.entries()) {
    const candidate = {
      title: normalized(item.title), text: normalized(item.scenario),
      words: words(item.scenario), phrases: phrases(item.scenario),
    };
    for (const [relatedIndex, other] of seen.entries()) {
      const kind = candidate.title === other.title ? 'title'
        : candidate.text === other.text ||
          (overlap(candidate.words, other.words) > 0.72 &&
            overlap(candidate.phrases, other.phrases) > 0.55) ? 'near-copy' : null;
      if (kind) return { caseIndex, relatedIndex: relatedIndex < previous.length ? relatedIndex : relatedIndex - previous.length,
        location: relatedIndex < previous.length ? 'history' : 'part', kind };
    }
    seen.push(candidate);
  }
  return null;
}
/** Compatibility wrapper for callers checking only whether a hard duplicate exists. */
export function hasRepeatedPracticeCase(items: Case[], previous: Case[] = []): boolean {
  return findRepeatedPracticeCase(items, previous) !== null;
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
