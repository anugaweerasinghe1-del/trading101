-- Harden browser-facing database roles without changing legitimate row-level
-- SELECT/INSERT/UPDATE/DELETE access granted by dedicated RLS policies.
-- TRUNCATE bypasses RLS and TRIGGER allows a role to install table triggers.
-- Old Supabase bootstrap grants permitted both on several exposed tables.
REVOKE TRUNCATE, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
-- Do not inherit these privileges via the shared PUBLIC pseudo-role.
REVOKE TRUNCATE, TRIGGER ON ALL TABLES IN SCHEMA public FROM PUBLIC;
-- Keep profile, course, portfolio and learner data exactly as stored.
