
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TYPE public.alert_kind AS ENUM ('error_rate','event_spike');

CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind public.alert_kind NOT NULL,
  event_name text, -- required when kind = 'event_spike'
  window_minutes int NOT NULL DEFAULT 5 CHECK (window_minutes BETWEEN 1 AND 1440),
  threshold int NOT NULL CHECK (threshold > 0),
  enabled boolean NOT NULL DEFAULT true,
  notify_admins boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_rules_admin_all" ON public.alert_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_alert_rules_updated BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.alert_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  count int NOT NULL,
  threshold int NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alert_incidents_rule_idx ON public.alert_incidents(rule_id, created_at DESC);

GRANT SELECT ON public.alert_incidents TO authenticated;
GRANT ALL ON public.alert_incidents TO service_role;
ALTER TABLE public.alert_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_incidents_admin_select" ON public.alert_incidents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Worker: check all enabled rules; create incidents + notify admins
CREATE OR REPLACE FUNCTION public.check_alerts()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count int;
  v_start timestamptz;
  v_end timestamptz := now();
  v_incident_id uuid;
  v_total int := 0;
  v_admin record;
BEGIN
  FOR r IN SELECT * FROM public.alert_rules WHERE enabled LOOP
    v_start := v_end - make_interval(mins => r.window_minutes);

    IF r.kind = 'error_rate' THEN
      SELECT count(*) INTO v_count FROM public.error_logs
        WHERE created_at >= v_start AND created_at < v_end;
    ELSE
      SELECT count(*) INTO v_count FROM public.analytics_events
        WHERE created_at >= v_start AND created_at < v_end
          AND event = COALESCE(r.event_name, event);
    END IF;

    IF v_count >= r.threshold THEN
      -- de-dupe: skip if an incident for this rule fired within the last hour
      IF NOT EXISTS (
        SELECT 1 FROM public.alert_incidents
        WHERE rule_id = r.id AND created_at > now() - interval '1 hour'
      ) THEN
        INSERT INTO public.alert_incidents(rule_id, count, threshold, window_start, window_end)
        VALUES (r.id, v_count, r.threshold, v_start, v_end)
        RETURNING id INTO v_incident_id;
        v_total := v_total + 1;

        IF r.notify_admins THEN
          FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
            INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
            VALUES (
              v_admin.user_id,
              'alert',
              '⚠️ Алерт: ' || r.name,
              v_count || ' за ' || r.window_minutes || ' мин (порог ' || r.threshold || ')',
              'alert_incident',
              v_incident_id
            );
          END LOOP;
        END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN v_total;
END $$;

REVOKE EXECUTE ON FUNCTION public.check_alerts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_alerts() TO service_role;

-- Seed defaults
INSERT INTO public.alert_rules(name, kind, window_minutes, threshold, enabled)
VALUES
  ('Всплеск ошибок', 'error_rate', 5, 10, true),
  ('Всплеск входов', 'event_spike', 5, 50, false);

UPDATE public.alert_rules SET event_name = 'sign_in' WHERE name = 'Всплеск входов';

-- Schedule every minute
SELECT cron.schedule('uy-check-alerts', '* * * * *', $$SELECT public.check_alerts();$$);
