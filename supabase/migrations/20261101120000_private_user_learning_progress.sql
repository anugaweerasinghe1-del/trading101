-- Browser progress is optional and cannot award verified trading results.
-- Each signed-in user alone can read/write their educational progress.
CREATE TABLE IF NOT EXISTS public.user_learning_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  courses jsonb NOT NULL DEFAULT '{"v":1,"tracks":{}}'::jsonb,
  journey jsonb NOT NULL DEFAULT '{"version":1,"lessonCompleted":false}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT user_learning_courses_object CHECK (jsonb_typeof(courses)='object' AND pg_column_size(courses)<=100000),
  CONSTRAINT user_learning_journey_object CHECK (jsonb_typeof(journey)='object' AND pg_column_size(journey)<=10000)
);
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_learning_progress FROM PUBLIC,anon,authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_learning_progress TO authenticated;
DROP POLICY IF EXISTS "Read own educational progress" ON public.user_learning_progress;
CREATE POLICY "Read own educational progress" ON public.user_learning_progress
  FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
DROP POLICY IF EXISTS "Create own educational progress" ON public.user_learning_progress;
CREATE POLICY "Create own educational progress" ON public.user_learning_progress
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid())=user_id);
DROP POLICY IF EXISTS "Update own educational progress" ON public.user_learning_progress;
CREATE POLICY "Update own educational progress" ON public.user_learning_progress
  FOR UPDATE TO authenticated USING ((select auth.uid())=user_id)
  WITH CHECK ((select auth.uid())=user_id);
-- Server-side timestamps: clients cannot claim another account's identity,
-- and timestamps are not used as proof of educational achievement.
CREATE OR REPLACE FUNCTION tradehq_private.touch_user_learning_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS touch_user_learning_progress ON public.user_learning_progress;
CREATE TRIGGER touch_user_learning_progress BEFORE UPDATE ON public.user_learning_progress
FOR EACH ROW EXECUTE FUNCTION tradehq_private.touch_user_learning_progress();
REVOKE ALL ON FUNCTION tradehq_private.touch_user_learning_progress() FROM PUBLIC,anon;
-- Use owner-only RLS for streaming signed-in learning updates; client re-reads the row.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='user_learning_progress') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_learning_progress;
  END IF;
END $$;
