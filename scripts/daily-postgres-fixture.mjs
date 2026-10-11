/** Disposable PostgreSQL fixture for existing Daily lifecycle tests. No remote URL accepted. */
import assert from 'node:assert/strict';
import postgres from 'postgres';
export function dailyFixtureControlUrl(env){
  assert.equal(env.TRADEHQ_DISPOSABLE_CONTROL_TEST,'explicit-ci-fixture','Disposable fixture opt-in required');
  assert.equal(env.TRADEHQ_CONTROL_TEST_URL,'postgres://tradehq_test:tradehq_ci_only@127.0.0.1:5432/tradehq_control_test','Only the fixed disposable loopback fixture is accepted');
  return env.TRADEHQ_CONTROL_TEST_URL;
}
export async function createDailyPostgresFixture(env=process.env){
  assert.equal(env.TRADEHQ_DAILY_POSTGRES_TEST,'explicit-ci-fixture','Explicit Daily fixture opt-in required');
  const control=dailyFixtureControlUrl(env);
  const options={max:1,prepare:false,connect_timeout:5,onnotice:()=>{},
    // Fixture net.http_post returns bigint 1; values in this bounded test are
    // small and must match PGlite's numeric semantics, not arbitrary int8 data.
    types:{bigint:{to:20,from:[20],serialize:value=>String(value),parse:value=>{
      const n=Number(value);assert.ok(Number.isSafeInteger(n),'Unsafe fixture bigint');return n;
    }}}};
  const admin=postgres(control,options);
  let client;
  try{
    const identity=(await admin.unsafe("SELECT current_database() AS db,current_user AS owner,current_setting('server_version_num')::int AS version"))[0];
    assert.ok(identity.db==='tradehq_control_test'&&identity.owner==='tradehq_test'&&identity.version>=170000&&identity.version<180000,'Wrong disposable PostgreSQL identity');
    // Never reuse or drop an existing database; a rerun gets a new CI service.
    assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM pg_database WHERE datname='tradehq_daily_test'"))[0].n,0,'Daily fixture already exists; refuse reuse');
    await admin.unsafe('CREATE DATABASE tradehq_daily_test');
    const url=new URL(control);url.pathname='/tradehq_daily_test';
    client=postgres(url.href,options);
    await client.unsafe("SET statement_timeout='15s'; SET lock_timeout='5s'");
    // Roles are cluster-wide and were created by the preceding controls test.
    assert.equal((await client.unsafe("SELECT count(*)::int AS n FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role')"))[0].n,3,'Prior disposable controls roles required');
    return {
      async exec(sql){
        // Existing fixture setup creates the same three roles for PGlite.
        const source=sql.replace(/^CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;/,'');
        return client.unsafe(source);
      },
      async query(sql,args=[]){
        // postgres.js serializes JSONB parameters itself. Convert the existing
        // PGlite fixture's JSON text to objects once instead of double-encoding.
        const bound=args.map((value,i)=>new RegExp('\\$'+(i+1)+'::jsonb\\b').test(sql)&&typeof value==='string'
          ? client.json(JSON.parse(value)) : value);
        return {rows:await client.unsafe(sql,bound)};
      } ,
      async close(){await client.end({timeout:2})},
    };
  }catch(error){if(client)await client.end({timeout:1});throw error}
  finally{await admin.end({timeout:1})}
}
