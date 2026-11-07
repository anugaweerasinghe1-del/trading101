// Isolated PostgreSQL verification. Never connects to a production database.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;`);
  for (const path of [
    'drizzle/migrations/0000_api_rate_limits.sql',
    'supabase/migrations/20260610151910_4c7658ff-770a-42b2-8725-2c9d8fe96252.sql',
    'supabase/migrations/20260802024211_00f706fa-25c6-4a1e-9f9e-17b13547e1b7.sql',
    'supabase/migrations/20260927200000_harden_duel_mutations.sql',
    'supabase/migrations/20261007110226_public_profiles_with_privacy_control.sql',
  ]) await db.exec(readFileSync(repo + path, 'utf8'));
  const migrations = readdirSync(repo + 'supabase/migrations').filter(name => /server_recorded_practice_scores|freeze_server_duel_scores|restore_account_trade_history|preserve_previous_practice_results|automatic_public_leaderboard|protect_price_refresh_queue|expand_crypto_quote_cache|normalize_signup_usernames|reject_stale_execution_quotes|restrict_browser_table_privileges|phase4a_backend_access_integrity|public_practice_trade_history_opt_in|private_profiles_and_review_approval/.test(name)).sort();
  for (const path of migrations) {
    if (path.includes('preserve_previous_practice_results')) await db.exec(readFileSync(repo + 'scripts/verify-previous-results-setup.sql', 'utf8'));
    if (path.includes('automatic_public_leaderboard')) {
      await db.exec(readFileSync(repo + 'scripts/verify-previous-results.sql', 'utf8'));
      // A local stand-in for Vault; no production credentials or network calls.
      await db.exec('CREATE SCHEMA vault; CREATE TABLE vault.decrypted_secrets(name text,decrypted_secret text);');
    }
    await db.exec(readFileSync(repo + 'supabase/migrations/' + path, 'utf8'));
  }
  for (const path of ['scripts/verify-private-signup.sql', 'scripts/verify-server-practice.sql', 'scripts/verify-server-duels.sql', 'scripts/verify-automatic-portfolios.sql', 'scripts/verify-phase2-security.sql', 'scripts/verify-phase4a-backend.sql', 'scripts/verify-public-practice-trade-privacy.sql']) {
    const results = await db.exec(readFileSync(repo + path, 'utf8'));
    for (const result of results) for (const row of result.rows) if (row.verification) console.log(row.verification);
    console.log('PASS', path);
  }
} catch (error) {
  console.error('Backend verification failed:', error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
