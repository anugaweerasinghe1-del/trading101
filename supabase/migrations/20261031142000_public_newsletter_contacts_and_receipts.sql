-- Real permission-based newsletter registry, isolated from legacy public.subscribers.
CREATE TABLE IF NOT EXISTS public.newsletter_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','confirmed','unsubscribed','bounced','complained')),
 source text NOT NULL DEFAULT 'website',
 created_at timestamptz NOT NULL DEFAULT now(),
 confirmed_at timestamptz,
 unsubscribed_at timestamptz,
 confirmation_token_hash text,
 confirmation_expires_at timestamptz,
 confirmation_sent_at timestamptz,
 unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'),
 CONSTRAINT newsletter_contact_lower_email CHECK(email = lower(btrim(email))),
 CONSTRAINT newsletter_contact_email_unique UNIQUE(email),
 CONSTRAINT newsletter_unsubscribe_token_unique UNIQUE(unsubscribe_token)
);
CREATE INDEX IF NOT EXISTS newsletter_confirm_token_idx ON public.newsletter_contacts(confirmation_token_hash) WHERE confirmation_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS newsletter_contact_status_idx ON public.newsletter_contacts(status);
ALTER TABLE public.newsletter_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_contacts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.newsletter_contacts TO service_role;

CREATE TABLE IF NOT EXISTS public.newsletter_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 edition_id uuid NOT NULL REFERENCES public.newsletter_editions(id) ON DELETE CASCADE,
 revision integer NOT NULL CHECK(revision >= 1),
 contact_id uuid NOT NULL REFERENCES public.newsletter_contacts(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','accepted','rejected','unknown','delivered','bounced','complained')),
 provider_id text,
 error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(edition_id,contact_id)
);
CREATE INDEX IF NOT EXISTS newsletter_delivery_created_idx ON public.newsletter_deliveries(created_at);
CREATE INDEX IF NOT EXISTS newsletter_delivery_provider_idx ON public.newsletter_deliveries(provider_id) WHERE provider_id IS NOT NULL;
ALTER TABLE public.newsletter_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.newsletter_deliveries TO service_role;
COMMENT ON TABLE public.newsletter_contacts IS 'Only explicit email-confirmed newsletter subscribers; legacy subscribers never imported automatically.';
COMMENT ON TABLE public.newsletter_deliveries IS 'One delivery reservation per edition and contact; retries cannot automatically resend on ambiguous provider outcomes.';