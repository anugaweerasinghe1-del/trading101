import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Progress } from '../src/components/ui/progress.tsx';
import { ASSETS } from '../src/lib/assets.ts';
import type { Portfolio } from '../src/lib/types.ts';

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

// Render real consumers with disposable read-only storage. No effects or writes
// run during server rendering, and these fixtures never access a real account.
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const reactDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'React');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
// The command-line test uses the root tsconfig's classic JSX transform.
Object.defineProperty(globalThis, 'React', { configurable: true, value: React });
try {
  const { LearningProgressTracker } = await import('../src/components/LearningProgressTracker.tsx');
  const { RiskManagement } = await import('../src/components/RiskManagement.tsx');
  const { PortfolioAnalytics } = await import('../src/components/PortfolioAnalytics.tsx');
  const bars = (html: string) => [...html.matchAll(/<[^>]+role="progressbar"[^>]*>/g)].map(match => match[0]);
  const named = (html: string, expected: Array<[string, number]>) => {
    const rendered = bars(html);
    assert.equal(rendered.length, expected.length);
    for (const [name, value] of expected) {
      const bar = rendered.find(tag => tag.includes(`aria-label="${name}"`));
      assert.ok(bar, `Missing accessible progress name: ${name}`);
      assert.ok(bar.includes(`aria-valuenow="${value}"`), `${name}: numeric value preserved`);
    }
  };
  named(renderToStaticMarkup(<LearningProgressTracker />), [['Experience Points', 0]]);
  const empty: Portfolio = { cash: 100000, totalValue: 100000, positions: [], trades: [] };
  named(renderToStaticMarkup(<RiskManagement portfolio={empty} />), [['Cash Share of Account', 100], ['Largest Position Share of Account', 0]]);
  named(renderToStaticMarkup(<PortfolioAnalytics portfolio={empty} />), [['Cash Reserve', 100]]);
  const asset = ASSETS.find(asset => asset.type === 'stock')!;
  const invested: Portfolio = { ...empty, cash: 50000, positions: [{
    asset, quantity: 10, avgPrice: 5000,
    currentValue: 50000, profitLoss: 0, profitLossPercent: 0,
  }] };
  named(renderToStaticMarkup(<RiskManagement portfolio={invested} />), [['Cash Share of Account', 50], ['Largest Position Share of Account', 50]]);
  named(renderToStaticMarkup(<PortfolioAnalytics portfolio={invested} />), [['STOCK allocation', 100], ['Cash Reserve', 50]]);
} finally {
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  if (reactDescriptor) Object.defineProperty(globalThis, 'React', reactDescriptor);
  else Reflect.deleteProperty(globalThis, 'React');
}
console.log('PASS named XP, cash and allocation indicators in actual empty and invested components; existing numeric values preserved');
