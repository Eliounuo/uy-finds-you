CREATE OR REPLACE FUNCTION public.notify_landlords_on_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_landlord record;
  v_title text;
  v_body text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'open' THEN
    RETURN NEW;
  END IF;

  v_title := 'Новая заявка: ' || COALESCE(NEW.city, 'жильё');
  v_body := COALESCE(NEW.district || ', ', '')
            || COALESCE(NEW.guests::text || ' гост., ', '')
            || 'до ' || COALESCE(NEW.budget_max::text, '?') || ' ₸/сут';

  FOR v_landlord IN
    SELECT id FROM public.profiles
    WHERE is_landlord = true AND id <> NEW.client_id
  LOOP
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (v_landlord.id, 'request_new', v_title, v_body, 'request', NEW.id);
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_landlords_on_request ON public.requests;
CREATE TRIGGER trg_notify_landlords_on_request
AFTER INSERT ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.notify_landlords_on_request();

REVOKE EXECUTE ON FUNCTION public.notify_landlords_on_request() FROM public, anon;

-- Ensure realtime delivers full row payloads for notifications inserts.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;