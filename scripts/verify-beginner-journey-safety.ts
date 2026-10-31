import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BACKUP_FORMAT, exportPracticeBackup, parsePracticeBackup, parsePracticePortfolio, readRecoveryPortfolio, writeRecoveryPortfolio } from "../src/lib/portfolioRecovery.ts";
import { JOURNEY_KEY, journeyStage, readJourney, saveJourney, markJourneyTrade } from "../src/lib/beginnerJourney.ts";

const memory = new Map<string,string>();
Object.defineProperty(globalThis, "localStorage", { configurable:true, value:{
  getItem:(k:string)=>memory.get(k) ?? null,
  setItem:(k:string,v:string)=>{memory.set(k,v);},
  removeItem:(k:string)=>{memory.delete(k);}
}});
const portfolio = {
 cash: 99749.75, totalValue: 99999.75,
 positions:[{asset:{id:"aapl",symbol:"AAPL",name:"Apple",type:"stock",price:250,change:0,changePercent:0},quantity:1,avgPrice:250,currentValue:250,profitLoss:0,profitLossPercent:0}],
 trades:[{id:"test-trade-1",assetId:"aapl",symbol:"AAPL",type:"buy",quantity:1,price:250,total:250.25,timestamp:new Date("2026-10-31T08:00:00Z"),journal:{notes:"private",emotions:[],reasoning:"learn"}}],
} as const;
const backup = exportPracticeBackup(portfolio as any);
assert.equal(JSON.parse(backup).format, BACKUP_FORMAT);
const restored = parsePracticeBackup(backup);
assert.equal(restored.trades[0].timestamp instanceof Date,true);
assert.equal(restored.trades[0].journal?.notes,"private");
assert.deepEqual(restored.cash,portfolio.cash);
assert.equal(writeRecoveryPortfolio(restored),true);
assert.equal(readRecoveryPortfolio()?.trades.length,1);
assert.equal(parsePracticePortfolio({cash:"invalid",totalValue:1,positions:[],trades:[]}),null);
assert.throws(()=>parsePracticeBackup('{"format":"foreign","version":1}'),/not a TradeHQ/);
assert.throws(()=>parsePracticeBackup('{"format":'),/valid JSON/);

const empty = readJourney();
assert.equal(journeyStage(empty),0);
markJourneyTrade(restored.trades[0]);
assert.equal(readJourney().tradeId,null,"No order marks the journey before lesson completion");
saveJourney({ lessonCompleted:true });
assert.equal(journeyStage(readJourney()),1);
markJourneyTrade(restored.trades[0]);
assert.equal(journeyStage(readJourney()),2);
saveJourney({ portfolioExplained:true });
assert.equal(journeyStage(readJourney()),3);
saveJourney({ reflection:"I learned that virtual order fees affect my cash and that price isn't guaranteed." });
assert.equal(journeyStage(readJourney()),4);
assert.ok(localStorage.getItem(JOURNEY_KEY));
const before = readJourney();
saveJourney({ completedAt:new Date().toISOString() });
assert.equal(readJourney().tradeId,before.tradeId);

const read=(path:string)=>readFileSync(path,"utf8");
const app=read("src/App.tsx"), trade=read("src/pages/Trade.tsx");
const start=read("src/pages/BeginnerJourney.tsx"), nav=read("src/components/Navigation.tsx");
const portfolioCode=read("src/lib/portfolio.ts");
const panel=read("src/components/portfolio/PortfolioRecoveryPanel.tsx");
const publicTrader=read("src/pages/PublicTrader.tsx");
const board=read("src/pages/Leaderboard.tsx");
const migration=read("supabase/migrations/20261031185000_public_practice_trade_history_opt_in.sql");
const privacy=read("src/lib/privacyCopy.ts");

assert.match(app,/path="\/start"/);
assert.match(nav,/to: "\/start", label: "Start Here"/);
assert.match(start,/saveJourney/);
assert.match(start,/loadProgress\(\)\.lastLesson/);
assert.match(start,/to="\/daily"/);
assert.match(start,/to="\/trade\?journey=1"/);
assert.match(start,/investor\.gov/);
assert.doesNotMatch(start,/executeTrade\(/,"Journey must never execute an order directly");
assert.match(trade,/if \(guidedPractice && result\.portfolio\.trades\[0\]\)/);
assert.match(trade,/markJourneyTrade/);
assert.match(portfolioCode,/readRecoveryPortfolio\(/);
assert.match(portfolioCode,/UNREADABLE_KEY/);
assert.match(portfolioCode,/writeRecoveryPortfolio\(portfolio\)/);
assert.match(panel,/window\.confirm/);
assert.match(panel,/authLoading/);
assert.match(panel,/signedIn/);
assert.match(board,/Community Practice Board/);
assert.match(board,/Learning members · not yet ranked/);
assert.match(board,/Sim\. return/);
assert.match(publicTrader,/get_public_practice_trades/);
assert.match(publicTrader,/p\.show_public_trades/);
assert.match(publicTrader,/not a prediction/);
assert.match(migration,/show_public_trades boolean NOT NULL DEFAULT false/);
assert.match(migration,/pf\.is_public IS TRUE/);
assert.match(migration,/pf\.show_public_trades IS TRUE/);
assert.match(migration,/t\.cycle_id = pp\.cycle_id/);
assert.match(migration,/LIMIT GREATEST\(1, LEAST\(COALESCE\(p_limit, 20\), 20\)\)/);
assert.doesNotMatch(migration,/journal|notes/i,"Private notes must not be projected into public trade RPC");
assert.match(privacy,/off by default/i);
console.log("PASS portable guest recovery, resilient journey progress, voluntary orders, daily habit and private-by-default public history");
