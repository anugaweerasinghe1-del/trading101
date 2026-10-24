import assert from 'node:assert/strict';
import { starterPracticeBank as bank } from '../src/lib/dailyPracticeBank.ts';

const age = bank.exercises.find(e => e.id === 'practice-24');
assert.ok(age);
const times = age.scenario.match(/Friday at (\d+):(\d+) and the page fetch happened Sunday at (\d+):(\d+)/);
const crypto = age.scenario.match(/Crypto was observed Sunday at (\d+):(\d+)/);
assert.ok(times && crypto, 'The exercise specifies observation and fetch times in one timezone');
const [, fridayHour, fridayMinute, sundayHour, sundayMinute] = times.map(Number);
const [, cryptoHour, cryptoMinute] = crypto.map(Number);
const fetchMinute = sundayHour * 60 + sundayMinute;
const ages = [2 * 24 * 60 + fetchMinute - (fridayHour * 60 + fridayMinute), fetchMinute - (cryptoHour * 60 + cryptoMinute)];
assert.equal(age.visual.unit, 'observation age (minutes)', 'One explicit common unit avoids rounded fractional hours');
assert.deepEqual(age.visual.bars.map(b => b.value), ages, 'Chart ages must follow the stated timestamps');
assert.equal(age.questions[3].options[age.questions[3].correctAnswer], `${ages[0] / 60} hours`);
assert.equal(age.questions[4].options[age.questions[4].correctAnswer], 'Two minutes');

const turnover = bank.exercises.find(e => e.id === 'practice-18');
assert.ok(turnover);
const inputs = turnover.scenario.match(/(\d+) hypothetical transactions, each with \$(\d+) notional and a ([\d.]+)% transaction fee/);
assert.ok(inputs, 'Turnover case supplies count, notional and rate');
const [, count, notional, percent] = inputs.map(Number);
const totalFees = count * notional * percent / 100;
assert.equal(turnover.visual.unit, '$');
assert.ok(!turnover.visual.bars.some(b => b.label === 'Transactions'), 'A transaction count cannot be plotted on a dollar scale');
assert.deepEqual(turnover.visual.bars.find(b => b.label === 'Total fees'), { label:'Total fees', value:totalFees });
assert.equal(turnover.questions[1].options[turnover.questions[1].correctAnswer], `$${totalFees}`);
console.log('PASS daily chart ages derived from scenario timestamps and dollar fee chart derived from transaction inputs');
