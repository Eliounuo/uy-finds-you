
-- ============ PAYMENTS ============
CREATE TYPE public.payment_status AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE public.payment_method AS ENUM ('card','kaspi','jasyn_wallet','manual');

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'KZT',
  method public.payment_method NOT NULL DEFAULT 'manual',
  status public.payment_status NOT NULL DEFAULT 'pending',
  external_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_booking_idx ON public.payments(booking_id);
CREATE INDEX payments_client_idx ON public.payments(client_id);
CREATE INDEX payments_owner_idx ON public.payments(owner_id);

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments_insert_self" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMMISSIONS ============
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  rate numeric(5,4) NOT NULL DEFAULT 0.05,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions_admin_only" ON public.commissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ PAYOUTS ============
CREATE TYPE public.payout_status AS ENUM ('pending','paid','failed');

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'KZT',
  status public.payout_status NOT NULL DEFAULT 'pending',
  destination text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payouts_owner_idx ON public.payouts(owner_id);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_select_own_or_admin" ON public.payouts
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_payouts_updated BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ANALYTICS EVENTS ============
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event text NOT NULL,
  path text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_event_idx ON public.analytics_events(event, created_at DESC);
CREATE INDEX analytics_events_user_idx ON public.analytics_events(user_id, created_at DESC);

GRANT INSERT ON public.analytics_events TO authenticated, anon;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_insert_any" ON public.analytics_events
  FOR INSERT TO authenticated, anon
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "analytics_select_admin" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ ERROR LOGS ============
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  message text NOT NULL,
  stack text,
  path text,
  user_agent text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX error_logs_created_idx ON public.error_logs(created_at DESC);

GRANT INSERT ON public.error_logs TO authenticated, anon;
GRANT SELECT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "error_logs_insert_any" ON public.error_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "error_logs_select_admin" ON public.error_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
