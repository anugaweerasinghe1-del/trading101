import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BACKUP_FORMAT, GUEST_IMPORT_MARKER, RESTORE_UNDO_KEY,
  applyUnverifiedGuestRestore, exportPracticeBackup, isGuestImportUnverified,
  parsePracticeBackup, readPreviousGuestPortfolio, restorePreviousProvenance,
} from "../src/lib/portfolioRecovery.ts";
import type { Portfolio } from "../src/lib/types.ts";

const values = new Map<string,string>();
const mockStorage = {
  getItem: (k: string) => values.get(k) ?? null,
  setItem: (k: string, v: string) => { values.set(k,v); },
  removeItem: (k: string) => { values.delete(k); }
};
Object.defineProperty(globalThis, "localStorage", { configurable:true, value:mockStorage });
const initial: Portfolio = { cash:100000, totalValue:100000, positions:[], trades:[] };
const imported: Portfolio = {
  cash:98999, totalValue:99999, positions:[{
    asset:{id:"aapl",symbol:"AAPL",name:"Example company",type:"stock",price:100,change:0,changePercent:0},
    quantity:10, avgPrice:100, currentValue:1000, profitLoss:0, profitLossPercent:0
  }],
  trades:[{id:"test-1",assetId:"aapl",symbol:"AAPL",type:"buy",quantity:10,price:100,total:1001,timestamp:new Date("2026-10-31T10:00:00Z")}],
};
const save = (p:Portfolio) => mockStorage.setItem("tradehq_portfolio",JSON.stringify(p));
save(initial);
assert.equal(parsePracticeBackup(exportPracticeBackup(imported)).trades.length,1);
applyUnverifiedGuestRestore(imported,initial,save);
assert.equal(JSON.parse(values.get("tradehq_portfolio")!).trades.length,1);
assert.equal(isGuestImportUnverified(),true);
assert.equal(readPreviousGuestPortfolio()?.cash,100000);
assert.ok(values.get(RESTORE_UNDO_KEY));
const previous=readPreviousGuestPortfolio()!;
save(previous);
restorePreviousProvenance();
assert.equal(JSON.parse(values.get("tradehq_portfolio")!).trades.length,0);
assert.equal(isGuestImportUnverified(),false);
assert.equal(values.get(GUEST_IMPORT_MARKER),undefined);

function invalid(patch:(p:Portfolio)=>void) {
  const p=JSON.parse(JSON.stringify(imported)) as Portfolio;
  patch(p);
  return JSON.stringify({format:BACKUP_FORMAT,version:1,exportedAt:new Date().toISOString(),portfolio:p});
}
assert.throws(()=>parsePracticeBackup(invalid(p=>{p.trades[0].id="";})),/duplicate or missing trade IDs/);
assert.throws(()=>parsePracticeBackup(invalid(p=>{p.trades.push({...p.trades[0]});})),/duplicate or missing trade IDs/);
assert.throws(()=>parsePracticeBackup(invalid(p=>{p.positions[0].quantity=-1;})),/(invalid holdings|missing valid portfolio information)/);
assert.throws(()=>parsePracticeBackup(invalid(p=>{p.totalValue=99999999;})),/does not match/);
assert.throws(()=>parsePracticeBackup(invalid(p=>{p.trades[0].price=0;})),/(invalid simulated trade|missing valid portfolio information)/);
assert.throws(()=>parsePracticeBackup('{"format":"not-tradehq","version":1,"portfolio":{}}'),/not a TradeHQ/);
assert.equal(values.get("tradehq_portfolio"),JSON.stringify(initial),"invalid files must not overwrite guest data");

const panel=readFileSync("src/components/portfolio/PortfolioRecoveryPanel.tsx","utf8");
const cloud=readFileSync("src/lib/cloudPortfolio.ts","utf8");
assert.match(panel,/Choose backup to restore/);
assert.match(panel,/Preview backup before restoring/);
assert.match(panel,/Confirm guest restore/);
assert.match(panel,/Undo my last restore/);
assert.match(panel,/signedIn \|\| authLoading/);
assert.match(panel,/silent: true/);
assert.match(panel,/UNVERIFIED|unverified/);
assert.match(cloud,/server-recorded orders/);
console.log("PASS guest preview, rollback, unverified import flag, malformed file rejection and account separation");
