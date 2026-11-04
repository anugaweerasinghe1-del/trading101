import assert from "node:assert/strict";
import { compareMemberRank, withPublicMemberPositions } from "../src/lib/memberActivity";

const members = [
  { userId: "zero", username: "aaa", trades: 0, previousTrades: 0, portfolioStatus: "not_started", practiceRank: null },
  { userId: "past", username: "past", trades: 0, previousTrades: 5, portfolioStatus: "not_started", practiceRank: null },
  { userId: "import", username: "import", trades: 0, previousTrades: 0, portfolioStatus: "imported", practiceRank: null },
  { userId: "return", username: "return", trades: 1, previousTrades: 0, portfolioStatus: "ranked", practiceRank: 1 },
  { userId: "active", username: "active", trades: 3, previousTrades: 0, portfolioStatus: "ranked", practiceRank: 2 },
];
const sorted = [...members].sort(compareMemberRank);
assert.deepEqual(sorted.map(m => m.userId), ["return", "active", "past", "import", "zero"]);
assert.equal(sorted[0].practiceRank, 1, "return rank must lead even when another member has more trades");
assert.equal(sorted[2].practiceRank, null, "past reported trades must not create a verified rank");
assert.deepEqual(members.map(m => m.userId), ["zero", "past", "import", "return", "active"]);
assert.deepEqual([...members].reverse().sort(compareMemberRank), sorted, "stable order across refreshed RPC results");

const refreshed = members.map(m => ({ ...m, practiceRank: m.userId === "return" ? 2 : m.userId === "active" ? 1 : null }));
assert.deepEqual(refreshed.sort(compareMemberRank).map(m => m.userId), ["active", "return", "past", "import", "zero"], "new server ranks must reorder the board on refresh");
const tied = [
  { ...members[3], userId: "tie-low", practiceRank: 1 },
  { ...members[4], userId: "tie-high", practiceRank: 1 },
  { ...members[3], userId: "third", practiceRank: 3 },
];
assert.deepEqual(tied.sort(compareMemberRank).map(m => m.userId), ["tie-high", "tie-low", "third"], "activity may break a shared-rank tie without moving lower ranks above it");
assert.deepEqual(tied.map(m => m.practiceRank), [1, 1, 3], "display sorting must preserve shared ranks and gaps supplied by the server");
console.log("Member order passed: return ranks first, automatic reordering, shared ranks preserved, unranked activity retained");

const listed = withPublicMemberPositions(members);
assert.deepEqual(listed.map(m => [m.userId, m.listPosition, m.practiceRank]), [
  ["return", 1, 1], ["active", 2, 2], ["past", 3, null],
  ["import", 4, null], ["zero", 5, null],
], "every public member, even zero-trade members, gets a continuing directory position");
assert.equal("listPosition" in members[0], false, "server data must remain unmodified");
const seventyFive = [
  ...Array.from({ length: 17 }, (_, i) => ({...members[3], userId: "ranked-" + i, username: "ranked-" + i, practiceRank: i + 1})),
  ...Array.from({ length: 58 }, (_, i) => ({...members[0], userId: "learning-" + i, username: "learning-" + i})),
];
const fullBoard = withPublicMemberPositions(seventyFive);
assert.deepEqual([fullBoard[16].listPosition, fullBoard[17].listPosition, fullBoard[74].listPosition], [17,18,75]);
assert.equal(fullBoard[74].practiceRank, null, "a directory position must not invent a verified return rank");
const withTies = withPublicMemberPositions(tied);
assert.deepEqual(withTies.map(m => m.listPosition), [1,2,3]);
assert.deepEqual(withTies.map(m => m.practiceRank), [1,1,3], "return rank ties remain distinct from numbered positions");
console.log("PASS: continuous 1–75 public member positions, zero-trade members and shared return-rank integrity");
