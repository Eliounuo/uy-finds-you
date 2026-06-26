ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS preferred_checkin_time timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_slot text,
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_requests_is_urgent ON public.requests(is_urgent);
CREATE INDEX IF NOT EXISTS idx_requests_checkin_time ON public.requests(preferred_checkin_time);