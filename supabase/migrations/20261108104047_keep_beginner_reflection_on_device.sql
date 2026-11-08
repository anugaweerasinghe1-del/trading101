BEGIN;

-- Older browser builds may still send reflection text. Prevent new storage
-- without rewriting existing account data or changing access to legacy notes.
CREATE FUNCTION tradehq_private.keep_beginner_reflection_on_device()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF jsonb_typeof(NEW.journey) <> 'object' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.journey ? 'reflection' THEN
      NEW.journey := jsonb_set(NEW.journey, '{reflection}', OLD.journey->'reflection');
      RETURN NEW;
    END IF;
  END IF;
  NEW.journey := NEW.journey - 'reflection';
  RETURN NEW;
END;
$$;

CREATE TRIGGER keep_beginner_reflection_on_device
BEFORE INSERT OR UPDATE OF journey ON public.user_learning_progress
FOR EACH ROW EXECUTE FUNCTION tradehq_private.keep_beginner_reflection_on_device();

REVOKE ALL ON FUNCTION tradehq_private.keep_beginner_reflection_on_device()
FROM PUBLIC, anon, authenticated;

COMMIT;
