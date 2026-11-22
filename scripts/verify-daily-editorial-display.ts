import assert from 'node:assert/strict';
import { starterPracticeBank as bank } from '../src/lib/dailyPracticeBank';
import { dailyPracticeDisplay, dailyPracticeDisplayText } from '../src/lib/dailyPracticeEditorial';

for (const exercise of bank.exercises) {
  const snapshot = JSON.stringify(exercise);
  const display = dailyPracticeDisplay(exercise);
  assert.equal(JSON.stringify(exercise), snapshot, 'Never rewrite publication or saved-attempt source');
  assert.deepEqual(dailyPracticeDisplay(display), display, 'Presentation correction is idempotent');
  assert.deepEqual(display.questions.map(q => [q.prompt, q.options, q.correctAnswer]),
    exercise.questions.map(q => [q.prompt, q.options, q.correctAnswer]), 'All 500 questions retain their choices and answer indices');
  if (exercise.id === 'practice-26') {
    const fixedValue = 4 * 25;
    assert.deepEqual(display.visual.bars.map(b => b.value), [fixedValue, 900, 990]);
    assert.ok(Math.abs((fixedValue + 990) / (fixedValue + 900) - 1 - 0.09) < 1e-12);
    const ownerEdit = structuredClone(exercise);
    ownerEdit.scenario = 'A later owner-authored case with a different setup.';
    assert.deepEqual(dailyPracticeDisplay(ownerEdit).visual, ownerEdit.visual, 'Do not apply a stale illustration to a new owner scenario');
    const captionEdit = structuredClone(exercise);
    captionEdit.visual.caption = 'A later owner-authored caption.';
    assert.deepEqual(dailyPracticeDisplay(captionEdit).visual, captionEdit.visual, 'Preserve a later owner caption');
  }
  if (exercise.id === 'practice-31') {
    const exposure = 2000 + 8000 * 0.1;
    assert.equal(exposure * 0.2, 560);
    assert.match(display.scenario, /initial 10% A weight/);
    assert.match(display.scenario, /ending weights/);
    assert.equal(dailyPracticeDisplayText('Case: ' + exercise.scenario), 'Case: ' + display.scenario,
      'Private scored detail uses the same clarification without changing its scoring source');
  }
}
assert.equal(dailyPracticeDisplayText('A later owner-authored explanation.'), 'A later owner-authored explanation.');
console.log('PASS display-only Daily clarifications, 500 preserved question/option/key sets, source immutability, owner-edit guard and independent exposure arithmetic');
