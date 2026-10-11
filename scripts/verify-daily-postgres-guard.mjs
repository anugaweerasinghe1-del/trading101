import assert from 'node:assert/strict';
import {createDailyPostgresFixture,dailyFixtureControlUrl} from './daily-postgres-fixture.mjs';
const ok={TRADEHQ_DAILY_POSTGRES_TEST:'explicit-ci-fixture',TRADEHQ_DISPOSABLE_CONTROL_TEST:'explicit-ci-fixture',TRADEHQ_CONTROL_TEST_URL:'postgres://tradehq_test:tradehq_ci_only@127.0.0.1:5432/tradehq_control_test'};
assert.equal(dailyFixtureControlUrl(ok),ok.TRADEHQ_CONTROL_TEST_URL);
await assert.rejects(createDailyPostgresFixture({}),/opt-in/);
for(const text of ['postgres://u:PRIVATE@production.supabase.co/postgres',ok.TRADEHQ_CONTROL_TEST_URL+'?sslmode=require',ok.TRADEHQ_CONTROL_TEST_URL+'#fragment',ok.TRADEHQ_CONTROL_TEST_URL.replace('127.0.0.1','localhost'),ok.TRADEHQ_CONTROL_TEST_URL.replace('tradehq_control_test','postgres')]){
  const denied={...ok,TRADEHQ_CONTROL_TEST_URL:text};
  assert.throws(()=>dailyFixtureControlUrl(denied),/fixed disposable/);
  await assert.rejects(createDailyPostgresFixture(denied),/fixed disposable/);
}
console.log('Daily PostgreSQL guard: exact opt-in, fixed loopback/user/database/password; remote, altered database, query and fragments rejected before connection');
