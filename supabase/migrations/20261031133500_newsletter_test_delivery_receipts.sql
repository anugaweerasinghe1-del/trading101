-- Owner-only newsletter test ledger. It never imports or mails legacy subscribers.
-- An approved revision can trigger at most one test request. A provider timeout
-- remains unknown rather than triggering an unsafe automatic resend.
CREATE TABLE IF NOT EXISTS public.newsletter_test_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.newsletter_editions(id) ON DELETE CASCADE,
  edition_revision integer NOT NULL CHECK (edition_revision >= 1),
  test_to text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','unknown')),
  provider_id text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (edition_id, edition_revision)
);
CREATE INDEX IF NOT EXISTS newsletter_test_delivery_recent_idx
  ON public.newsletter_test_deliveries(created_at DESC);
ALTER TABLE public.newsletter_test_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_test_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.newsletter_test_deliveries TO service_role;
COMMENT ON TABLE public.newsletter_test_deliveries IS
  'Private, owner-key-protected test email receipts. Provider accepted does not prove inbox delivery; historical subscribers are never included.';