// Pure public source export. Enumeration does not attest a review.
import {writeFileSync,readFileSync} from 'node:fs';
import {lessonData} from '../../../../src/lib/lessonData';
import {ARENA_SCENARIOS} from '../../../../src/lib/practiceArena';
import {MENTOR_TOPICS,getSmartMentorReply} from '../../../../src/lib/smartMentor';
import {getTodayChallenge,getTodayBonus} from '../../../../src/lib/dailyChallenge';
import {ASSETS} from '../../../../src/lib/assets';
import {CATEGORY_INTROS,getAssetContent,getAssetFAQs,generateMarketOutlook,generateStudentUseSection} from '../../../../src/lib/assetContent';
import {dailyPracticeDisplay} from '../../../../src/lib/dailyPracticeEditorial';
import {tradeReviewQuestion} from '../../../../src/lib/tradeReviewQuestions';
import {starterPracticeBank} from '../../../../src/lib/dailyPracticeBank';
const publisherAssets=new Set(readFileSync('docs/audits/issue-430/completion-2026-11-22/evidence/current-source/editorial-block-evidence.jsonl','utf8').trim().split('\n').map(row=>new URL(JSON.parse(row).url).pathname).filter(path=>path.startsWith('/trade/')).map(path=>path.split('/').at(-1)));
const challenges=new Map(),bonus=new Map();for(let i=0;i<366;i++){const d=new Date(Date.UTC(2026,0,1+i));const c=getTodayChallenge(d),b=getTodayBonus(d);challenges.set(c.id,c);bonus.set(b.id,b);}
writeFileSync('docs/audits/issue-430/completion-2026-11-22/evidence/current-additional-educational-source.json',JSON.stringify({assetIndex:ASSETS.map(a=>({id:a.id,type:a.type})),tradeReview:[tradeReviewQuestion('buy',false),tradeReviewQuestion('sell',false),...[0,1,2,3].map(day=>tradeReviewQuestion('buy',true,day*86400000))],numericLessons:lessonData,arena:ARENA_SCENARIOS,quick:[...challenges.values()],bonus:[...bonus.values()],mentorCommon:[['greeting',getSmartMentorReply('hello')],['fallback',getSmartMentorReply('unrecognized term xyzzy')]],categoryIntros:CATEGORY_INTROS,nonpublisherAssetTemplates:ASSETS.filter(a=>!publisherAssets.has(a.id)).map(a=>({id:a.id,name:a.name,symbol:a.symbol,type:a.type,content:getAssetContent(a.id),faqs:getAssetFAQs(a.id),outlook:generateMarketOutlook(a),student:generateStudentUseSection(a)})),dailyDisplay:starterPracticeBank.exercises.map(dailyPracticeDisplay)},null,2));
