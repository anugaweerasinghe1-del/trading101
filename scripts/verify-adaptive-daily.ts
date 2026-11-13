import assert from 'node:assert/strict';
import { starterPracticeBank as bank } from '../src/lib/dailyPracticeBank.ts';
import { exerciseForDate } from '../supabase/functions/_shared/dailyPractice.ts';
import { choosePracticeExercise, newPractice, readPracticeHistory, savePractice } from '../src/lib/dailyPracticeProgress.ts';

const date = '2026-10-22';
const original = newPractice(bank, '2026-10-09');
const missed = { ...original, answers: original.exercise.questions.map((q, i) =>
  i === 0 ? (q.correctAnswer + 1) % 3 : q.correctAnswer) };
const perfect = { ...original, answers: original.exercise.questions.map(q => q.correctAnswer) };

assert.equal(newPractice(bank, date).exercise.id, exerciseForDate(bank, date).id,
  'First-time visitors retain the reviewed calendar rotation');
assert.equal(choosePracticeExercise(bank, date, [perfect]).id, exerciseForDate(bank, date).id,
  'Fully correct practice must not invent a topic weakness');
const suggested = choosePracticeExercise(bank, date, [missed]);
assert.equal(suggested.category, original.exercise.category,
  'A completed missed-answer topic should guide the next reviewed case');
assert.notEqual(suggested.id, original.exercise.id,
  'Avoid recycling a just-completed reviewed case from the same bank');
assert.equal(newPractice(bank, date, [missed]).exercise.id, suggested.id,
  'The recommendation remains deterministic for the same date and history');
assert.equal(choosePracticeExercise(bank, date, [missed]).id, suggested.id);
assert.equal(choosePracticeExercise(bank, '2026-11-20', [missed]).id,
  exerciseForDate(bank, '2026-11-20').id, 'Older mistakes expire from the 30-day recommendation window');

const store = new Map<string, string>();
const storage = { getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); } };
assert.equal(savePractice(missed, storage).saved, true);
assert.deepEqual(readPracticeHistory(date, storage), [missed],
  'Only complete, validated earlier answers are eligible');
assert.deepEqual(readPracticeHistory('2026-10-09', storage), [],
  'Do not treat a same-day or future attempt as past performance');
store.set('tradehq:deeper-practice:v1', JSON.stringify([{ date: null },
  { ...missed, date: '2026-10-10', answers: [0] }, missed]));
assert.deepEqual(readPracticeHistory(date, storage), [missed],
  'Damaged and incomplete attempts do not contaminate recommendations');
assert.deepEqual(readPracticeHistory(date, { getItem: () => '{broken' }), [],
  'Disabled or corrupted browser storage falls back safely');

console.log('PASS Daily adaptive case: deterministic, reviewed-bank-only, recent mistakes, no repeats, safe browser history and first-time fallback');
