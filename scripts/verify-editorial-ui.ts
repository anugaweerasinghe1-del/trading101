import React from 'react';
import './verify-progress-accessibility.tsx';
import { renderToStaticMarkup } from 'react-dom/server';
import { TradeAnalytics } from '../src/components/TradeAnalytics';
import type { Portfolio, Trade } from '../src/lib/types';
/** Read-only unit regressions: educational arithmetic, preserved course identities and truthful missing metrics. */
import assert from 'node:assert/strict';
import { lessonData } from '../src/lib/lessonData';
import { formatPrice, ASSETS } from '../src/lib/assets';
import { getPortfolioMentorReply, getSmartMentorReply, MENTOR_TOPICS, type PortfolioContext } from '../src/lib/smartMentor';

assert.deepEqual(lessonData.map(l => l.id), [1,2,3,4,5,6]);
assert.deepEqual(lessonData.map(l => l.subtopics.length), [4,4,4,4,4,4]);
assert.deepEqual(lessonData.map(l => l.quiz.length), [5,5,4,2,2,2]);
for (const lesson of lessonData) {
  assert.ok(lesson.references?.length, `Lesson ${lesson.id}: inspectable source links`);
  for (const topic of lesson.subtopics) assert.ok(topic.content.length && topic.content.every(s => s.data || s.value));
  for (const question of lesson.quiz) assert.ok(question.options[question.correctAnswer] && question.explanation);
}
const near = (a:number,b:number) => assert.ok(Math.abs(a-b)<0.00001, `${a} != ${b}`);
near(300*.25 - 100*.75, 0);
near((100+5)/(300+100), .2625);
near((50*(1-.2)+50*(1+.1))/100-1, -.05);
near((100+102+104)/3, 102);
near(100-100/(1+2/1), 66.6666666667);
near((105-103)-1.5, .5);
near(160+40, 200); near((160-40)/200, .6); near((40+40)/200, .4);
near((20+20)/Math.abs(-10), 4);
near(600/400, 1.5);
assert.equal(lessonData[1].quiz[2].options[lessonData[1].quiz[2].correctAnswer], '25%');
const lossOfSize = ASSETS.filter(a => a.price > 0 && a.price < .0001);
assert.ok(lossOfSize.length >= 2, 'Positive tiny-price coverage');
for (const asset of lossOfSize) assert.ok(Number(formatPrice(asset.price, asset.type).replaceAll(',','')) > 0, `${asset.symbol}: price must not display zero`);
assert.equal(formatPrice(NaN,'stock'), '—');
assert.equal(formatPrice(0,'stock'), '0.0000');
assert.equal(formatPrice(123.45,'stock'), '123.45');
const context:PortfolioContext = {cash:0,totalValue:0,positionsCount:0,tradesCount:12,winRate:null,selectedSymbol:'TEST',selectedChangePct:null,priceOnlySellComparisonPct:50};
const mentorReplies = [
  ...MENTOR_TOPICS.map(topic => getSmartMentorReply(topic.keywords[0])),
  ...['', 'hello', 'unrecognized zqxv', 'my portfolio', 'risk', 'review my trades', 'analyze this asset'].map(prompt => getPortfolioMentorReply(prompt,context)),
];
for(const reply of mentorReplies) {
  assert.doesNotMatch(reply,/\*\*|_\(Educational/,'Plain-text mentor messages must not expose authored Markdown delimiters');
  assert.ok(reply.endsWith('(Educational simulation only — not financial advice.)'));
}
console.log('PASS authored mentor topics, greeting/fallback and portfolio branches preserve disclaimers without literal formatting markers.');
const portfolio = getPortfolioMentorReply('my portfolio',context);
assert.ok(portfolio.includes('percentage unavailable') && portfolio.includes('Realized win rate: unavailable') && portfolio.includes('not a realized win rate'));
assert.ok(!/NaN|Infinity/.test(portfolio));
const history = getPortfolioMentorReply('review my trades',context);
assert.ok(history.includes('Realized win rate: unavailable') && !history.includes('0% win rate'));
assert.ok(getPortfolioMentorReply('analyze this asset',context).includes('Percentage change is unavailable'));
assert.ok(getPortfolioMentorReply('review my trades',{...context,tradesCount:0}).includes('No recorded practice trades'));
assert.ok(getPortfolioMentorReply('my portfolio',{...context,winRate:75,priceOnlySellComparisonPct:null}).includes('Realized win rate: 75%'));
console.log('PASS six preserved legacy lesson identities/quizzes, independent worked arithmetic, tiny positive display prices, unknown metrics and distinct price-only mentor comparison. No order, balance or database mutations.');

const renderPerformance = (trades: Trade[]) => renderToStaticMarkup(React.createElement(TradeAnalytics, {
  portfolio: {cash: 100000, totalValue: 100000, positions: [], trades} satisfies Portfolio,
}));
const emptyPerformance = renderPerformance([]);
assert.ok(emptyPerformance.includes('No completed sells'));
assert.ok(emptyPerformance.includes('Unavailable without recorded losses'));
assert.doesNotMatch(emptyPerformance, /0\.0%|Infinity|NaN/, 'No observations must not look like a measured zero rate');
const buy: Trade = {id:'b',assetId:'btc',symbol:'BTC',type:'buy',quantity:1,price:100,total:100.1,timestamp:new Date('2026-01-01T00:00:00Z')};
const sale = (price:number):Trade => ({...buy,id:'s',type:'sell',price,total:price*0.999,timestamp:new Date('2026-01-02T00:00:00Z')});
const winningPerformance=renderPerformance([buy,sale(120)]);
assert.ok(winningPerformance.includes('100.0%'));
assert.ok(winningPerformance.includes('Unavailable without recorded losses'));
assert.doesNotMatch(winningPerformance, /Infinity|NaN/);
const losingPerformance=renderPerformance([buy,sale(90)]);
assert.ok(losingPerformance.includes('0.0%'), 'A genuine zero win rate is distinct from no completed sells');
assert.doesNotMatch(losingPerformance, /\+\-|shares @/, 'Negative best-relative outcomes and token quantities need truthful labels');
assert.ok(losingPerformance.includes('units @'));
console.log('PASS rendered empty, winning-only and losing-only performance displays; accounting inputs and calculations unchanged.');
