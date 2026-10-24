import assert from 'node:assert/strict';
import { starterPracticeBank as bank } from '../src/lib/dailyPracticeBank.ts';

// The illustration and keyed arithmetic must use the same stated observation.
const exercise = bank.exercises.find(e => e.id === 'practice-32');
assert.ok(exercise, 'Correlation case exists');
const observation = exercise.scenario.match(/fourth A [−-](\d+(?:\.\d+)?)%, B [−-](\d+(?:\.\d+)?)%/);
assert.ok(observation, 'Fourth observation has explicit loss magnitudes');
const losses = observation.slice(1).map(Number);
assert.equal(exercise.visual.unit, 'fourth-interval loss (%)');
assert.deepEqual(exercise.visual.bars.map(b => b.value), losses, 'Visual uses the scenario’s loss magnitudes');
const correct = (n: number) => {
  const q = exercise.questions[n];
  return Number(q.options[q.correctAnswer].replace(/[^\d.−-]/g, '').replace('−', '-'));
};
const dollars = losses.map(percent => 1000 * percent / 100);
assert.deepEqual([correct(4), correct(5)], dollars, 'Each keyed $1,000 holding loss matches the illustrated percentage');
assert.equal(correct(6), dollars.reduce((a, b) => a + b), 'Combined loss uses both holdings');
assert.equal(correct(7), -100 * dollars.reduce((a, b) => a + b) / 2000, 'Combined return uses total starting exposure');
console.log('PASS correlation illustration, stated fourth observation and keyed dollar/percentage losses agree');
