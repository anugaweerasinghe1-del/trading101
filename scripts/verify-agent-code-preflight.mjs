import assert from "node:assert/strict";
import { inspectAiCandidate } from "./agent-code-preflight.mjs";
const before = [
  "export default function About() {",
  "  return <main>",
  '    <h1 className="mb-4">About TradeHQ</h1>',
  "    <p>Education only; no real-money trades.</p>",
  "  </main>;",
  "}",
  "",
].join("\n");
const original = [{ path: "src/pages/About.tsx", content: before }];
const change = (after, path="src/pages/About.tsx") => [{ path, content: after }];
const safe=before.replace('mb-4', 'mb-6');
const valid=inspectAiCandidate(original,change(safe));
assert.equal(valid.checkedFiles,1);
assert.equal(valid.changedLines,2);
assert.ok(Object.values(valid.authorization).every(x => x === false));
for (const [label, candidates] of [
  ["No difference",change(before)],
  ["Unauthorized file",change(safe,"src/pages/AdminDashboard.tsx")],
  ["Unverified replacement",change(safe,"src/pages/Another.tsx")],
  ["Event handler",change(before.replace('mb-4','mb-4" onMouseEnter={capture} data-x="'))],
  ["External network reference",change(before.replace("About TradeHQ",'<img src="https://evil.example/a" />'))],
  ["Source logic",change(before.replace("  return", "  import { useState } from 'react';\n  return"))],
  ["Delete mostly",change('export default function About() {}')],
  ["Binary NUL",change(before.replace('mb-4','mb-\0'))],
  ["No selected sources",[]],
  ["Duplicate change",[...change(safe),...change(safe)]],
]) assert.throws(()=>inspectAiCandidate(original,candidates), undefined, label);
const large=before.replace('mb-4', 'mb-6') + '\n' + Array.from({length:95},(_,i)=>'// filler line '+i).join('\n');
assert.throws(()=>inspectAiCandidate(original,change(large)),/destructive|Large|bounded|source/i);
assert.throws(()=>inspectAiCandidate([{...original[0]},{...original[0]}],change(safe)),/duplicate/i);
console.log('Independent pre-write Gemini scope preflight passed: safe layout edit, path binding, diff/line/byte limits, event/network/logic guard, and malformed candidates denied.');
