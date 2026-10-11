import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {disposableControlUrl} from './verify-repair-control-postgres.mjs';
const fixture={TRADEHQ_DISPOSABLE_CONTROL_TEST:'explicit-ci-fixture',TRADEHQ_CONTROL_TEST_URL:'postgres://tradehq_test:tradehq_ci_only@127.0.0.1:5432/tradehq_control_test'};
assert.equal(disposableControlUrl(fixture),fixture.TRADEHQ_CONTROL_TEST_URL);
for(const env of [{},{...fixture,TRADEHQ_DISPOSABLE_CONTROL_TEST:'yes'},...[
  fixture.TRADEHQ_CONTROL_TEST_URL.replace('127.0.0.1','db.production.supabase.co'),
  fixture.TRADEHQ_CONTROL_TEST_URL.replace('tradehq_control_test','postgres'),
  fixture.TRADEHQ_CONTROL_TEST_URL.replace('tradehq_test:','postgres:'),
  fixture.TRADEHQ_CONTROL_TEST_URL.replace(':5432',':6543'),
  fixture.TRADEHQ_CONTROL_TEST_URL+'?sslmode=require',fixture.TRADEHQ_CONTROL_TEST_URL+'#fragment',
  fixture.TRADEHQ_CONTROL_TEST_URL.replace('tradehq_ci_only','PRIVATE_SENTINEL'),
].map(url=>({...fixture,TRADEHQ_CONTROL_TEST_URL:url}))])assert.throws(()=>disposableControlUrl(env));
const denied=spawnSync(process.execPath,['scripts/verify-repair-control-postgres.mjs'],{
  encoding:'utf8',env:{...process.env,TRADEHQ_DISPOSABLE_CONTROL_TEST:'explicit-ci-fixture',TRADEHQ_CONTROL_TEST_URL:'postgres://user:PRIVATE_SENTINEL@db.production.supabase.co:5432/postgres'},timeout:5000});
assert.notEqual(denied.status,0);assert.ok(!denied.stderr.includes('PRIVATE_SENTINEL'));
console.log('PostgreSQL fixture guard: missing opt-in, remote/production host, wrong database/user/port/password, query/fragment and private error leakage rejected before connection.');
