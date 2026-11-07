/** Real workerd regression: no upstream network or production credentials. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, delimiter } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
if (!process.argv.includes('--runtime')) {
  // Reuse the same Wrangler major already required for the Pages bundle gate.
  execFileSync('npx', ['--yes', '--package=wrangler@4', '--', 'node', fileURLToPath(import.meta.url), '--runtime'], { stdio: 'inherit' });
} else {
  const packageRoot = process.env.PATH.split(delimiter).map(path => join(dirname(path), 'miniflare'))
    .find(path => existsSync(join(path, 'package.json')));
  assert.ok(packageRoot, 'Wrangler workerd harness unavailable; cannot claim runtime verification');
  const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const { Miniflare, convertV4MiniflareOptions } = await import(pathToFileURL(join(packageRoot, pkg.main)));
  const temp = mkdtempSync(join(tmpdir(), 'tradehq-fx-workerd-'));
  const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  writeFileSync(join(temp, 'model.mjs'), compile(readFileSync('src/lib/fxReference.ts', 'utf8')));
  writeFileSync(join(temp, 'handler.mjs'), compile(readFileSync('src/server/fxReference.ts', 'utf8')).replace('../lib/fxReference.js', './model.mjs'));
  writeFileSync(join(temp, 'worker.mjs'), `import {createFxReferenceHandler} from './handler.mjs';
const read=createFxReferenceHandler({now:()=>Date.parse('2026-11-06T14:00:00Z')});
export default {fetch:request=>read(request)};`);
  let calls = 0;
  const rows = ['EUR','GBP','JPY','CHF','AUD','CAD','NZD','HKD','SGD','MXN','ZAR','TRY']
    .map((quote, i) => ({ base: 'USD', quote, date: '2026-11-05', rate: (i + 1) / 2 }));
  const modules = ['worker.mjs', 'handler.mjs', 'model.mjs'].map(name => ({ type: 'ESModule', path: join(temp, name), contents: readFileSync(join(temp, name), 'utf8') }));
  const options = { modules, modulesRoot: temp, compatibilityDate: '2024-01-01',
    outboundService: async request => {
      calls++;
      assert.equal(new URL(request.url).origin, 'https://api.frankfurter.dev');
      assert.equal(request.headers.get('cookie'), null);
      assert.equal(request.headers.get('authorization'), null);
      return Response.json(rows);
    } };
  const mf = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
  try {
    const read = async () => {
      const r = await mf.dispatchFetch('https://reference.test/api/fx-reference', { headers: { Cookie: 'PRIVATE_SENTINEL', Authorization: 'PRIVATE_SENTINEL' } });
      assert.equal(r.status, 200, 'Actual Workers runtime must return rates');
      const value = await r.json();
      assert.equal(Object.values(value.rates).filter(Boolean).length, 15);
      assert.equal(value.rates.eurusd.rate, 2);
    };
    await read();
    // Each dispatch owns a different I/O context; cached Response bodies fail here.
    await read();
    await Promise.all(Array.from({ length: 8 }, read));
    assert.equal(calls, 1, 'Separate Workers requests reuse cached values without provider calls');
    console.log('PASS actual Workers FX reference: supported fetch options, all 15 pairs, separate request contexts, concurrent cache reads, private headers excluded; stub upstream only.');
  } finally { await mf.dispose(); rmSync(temp, { recursive: true, force: true }); }
}
