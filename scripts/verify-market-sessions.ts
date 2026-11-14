import assert from "node:assert/strict";
import { MARKET_SESSIONS, sessionStatus } from "../src/lib/marketSessions";
const nyse = MARKET_SESSIONS[0];
for (const [now, opening] of [
  ["2026-11-14T15:50:00Z", "2026-11-16T14:30:00Z"],
  ["2026-11-15T02:00:00Z", "2026-11-16T14:30:00Z"],
  ["2026-11-13T22:00:00Z", "2026-11-16T14:30:00Z"],
  ["2026-03-06T22:00:00Z", "2026-03-09T13:30:00Z"],
  ["2026-10-30T21:00:00Z", "2026-11-02T14:30:00Z"],
]) {
  const instant = new Date(now);
  assert.deepEqual(sessionStatus(nyse, instant), { open: false, nextEventInMin: (Date.parse(opening) - +instant) / 60000 });
}
assert.deepEqual(sessionStatus(nyse, new Date("2026-11-16T15:00:00Z")), {open:true,nextEventInMin:360});
for (const session of MARKET_SESSIONS) {
  const result = sessionStatus(session, new Date("2026-11-14T00:00:00Z"));
  assert.equal(result.open, false);
  assert.ok(result.nextEventInMin > 24 * 60, session.name + " must skip the weekend");
}
console.log("Regular weekday session countdowns, Friday close, weekend, Monday open and DST transitions pass.");

const tokyo = MARKET_SESSIONS[2];
assert.deepEqual(sessionStatus(tokyo, new Date("2026-11-16T03:00:00Z")), {open:false,nextEventInMin:30});
assert.deepEqual(sessionStatus(tokyo, new Date("2026-11-16T06:15:00Z")), {open:true,nextEventInMin:15});
