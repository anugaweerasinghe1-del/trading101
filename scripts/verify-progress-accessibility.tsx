import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Progress } from '../src/components/ui/progress.tsx';

// Exercise the public component contract through the actual Radix rendering.
for (const value of [0, 25, 62.5, 100]) {
  const html = renderToStaticMarkup(<Progress value={value} aria-label="Lesson completion" />);
  assert.ok(html.includes(`aria-valuenow="${value}"`), `Determinate ${value}% must reach assistive technology`);
  assert.ok(html.includes('aria-valuemin="0"') && html.includes('aria-valuemax="100"'));
  assert.ok(html.includes('aria-label="Lesson completion"'));
  assert.ok(html.includes(`data-state="${value === 100 ? 'complete' : 'loading'}"`));
}
const pending = renderToStaticMarkup(<Progress aria-label="Loading exercise" />);
assert.ok(pending.includes('data-state="indeterminate"'));
assert.ok(!pending.includes('aria-valuenow='), 'An unspecified value remains honestly indeterminate');
console.log('PASS progress exposes determinate zero, intermediate, fractional and complete values; unspecified remains indeterminate');
