-- Restrict public readers to review display and policy-filter columns.
-- Keep RLS and service-role moderation permissions unchanged.
REVOKE SELECT ON public.reviews FROM PUBLIC, anon, authenticated;
REVOKE SELECT (ip_hash) ON public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, name, content, rating, is_visible, is_featured, created_at, updated_at, owner_reply, owner_reply_updated_at, deleted_at) ON public.reviews TO anon, authenticated;
DO $$ BEGIN
  IF has_column_privilege('anon','public.reviews','ip_hash','SELECT') OR has_column_privilege('authenticated','public.reviews','ip_hash','SELECT') THEN
    RAISE EXCEPTION 'Review moderation hash must not be publicly accessible';
  END IF;
  IF NOT has_column_privilege('service_role','public.reviews','ip_hash','SELECT') OR NOT has_column_privilege('service_role','public.reviews','ip_hash','INSERT') THEN
    RAISE EXCEPTION 'Review moderation service privileges must remain available';
  END IF;
END $$;
