import { useMemo, useState } from 'react';
import { DAILY_CATEGORIES, normalized, type DailyExercise } from '../../../supabase/functions/_shared/dailyPractice';
import { reviewPracticeExercises, type PracticeReviewFinding } from '../../../supabase/functions/_shared/dailyPracticeReview';

function describe(finding: PracticeReviewFinding): string {
  if (finding.kind === 'similar-case') return `Scenario wording overlaps exercise ${finding.relatedExerciseIndex + 1}. Check that it teaches a distinct case.`;
  if (finding.kind === 'similar-question') return `Question ${finding.questionIndex! + 1} has similar wording to question ${finding.relatedQuestionIndex! + 1}. Check the teaching point and inputs.`;
  return `Question ${finding.questionIndex! + 1} reuses the explanation from question ${finding.relatedQuestionIndex! + 1}. Check answer and explanation agreement.`;
}

export function PracticeReviewSummary({ exercises, historicalExercises = [], onInspect }: {
  exercises: DailyExercise[]; historicalExercises?: DailyExercise[]; onInspect: (index: number) => void;
}) {
  const findings = useMemo(() => reviewPracticeExercises(exercises), [exercises]);
  const historicalMatches = useMemo(() => {
    const oldPrompts = new Set(historicalExercises.flatMap(exercise => exercise.questions.map(question => normalized(question.prompt))));
    return exercises.flatMap((exercise, exerciseIndex) =>
      exercise.questions.flatMap((question, questionIndex) =>
        oldPrompts.has(normalized(question.prompt)) ? [{ exerciseIndex, questionIndex }] : []));
  }, [exercises, historicalExercises]);
  const [showAll, setShowAll] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  return <section aria-label="Editorial review overview" className="rounded-2xl border border-white/15 p-5 space-y-4">
    <div><h2 className="font-semibold">Review overview</h2><p className="mt-1 text-sm text-muted-foreground">{exercises.length} exercises · {exercises.reduce((total, exercise) => total + exercise.questions.length, 0)} scored questions · {findings.length} wording checks to inspect</p></div>
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Category coverage">{DAILY_CATEGORIES.map(category => <li key={category}>{category}: {exercises.filter(exercise => exercise.category === category).length}</li>)}</ul>
    <p className="text-xs text-muted-foreground leading-relaxed">These local wording checks can miss duplicates or flag useful repetition. They do not verify facts, calculations, source relevance or correct answers. Review each answer beside its explanation before approval.</p>
    {historicalMatches.length > 0 && <aside role="status" className="rounded-xl border border-amber-500/25 p-3 space-y-2">
      <p className="text-sm font-semibold">Historical question wording: {historicalMatches.length} exact matches</p>
      <p className="text-xs text-muted-foreground">These are editorial flags, not automatic proof that the case or answer is duplicated. Compare each question with earlier approved practice and edit if it repeats the same teaching point.</p>
      <ul className="space-y-1">{(showAllHistory ? historicalMatches : historicalMatches.slice(0, 8)).map(match =>
        <li key={match.exerciseIndex + '-' + match.questionIndex}><button type="button" className="text-sm text-primary underline text-left"
          onClick={() => onInspect(match.exerciseIndex)}>Inspect exercise {match.exerciseIndex + 1}, question {match.questionIndex + 1}</button></li>
      )}</ul>
      {historicalMatches.length > 8 && <button type="button" className="text-xs text-primary underline"
        onClick={() => setShowAllHistory(!showAllHistory)}>{showAllHistory ? 'Show fewer matches' : 'Show all ' + historicalMatches.length + ' matches'}</button>}
    </aside>}
    {findings.length ? <><ul className="space-y-3">{(showAll ? findings : findings.slice(0, 8)).map((finding, i) => <li key={i} className="text-sm border-t border-white/10 pt-3">
      <button type="button" className="text-primary underline text-left" onClick={() => onInspect(finding.exerciseIndex)}>Inspect exercise {finding.exerciseIndex + 1}: {exercises[finding.exerciseIndex].title}</button>
      <p className="mt-1 text-muted-foreground">{describe(finding)}</p>
      {finding.kind === 'similar-case' && <button type="button" className="text-xs text-primary underline mt-1" onClick={() => onInspect(finding.relatedExerciseIndex)}>Compare exercise {finding.relatedExerciseIndex + 1}</button>}
    </li>)}</ul>{findings.length > 8 && <button type="button" className="text-sm text-primary underline" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer checks' : `Show all ${findings.length} checks`}</button>}</>
      : <p className="text-sm text-muted-foreground">No repeated wording found by these checks. Editorial review is still required.</p>}
  </section>;
}
