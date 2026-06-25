
-- 1. Bookings INSERT policy (defense in depth; bookings are created by SECURITY DEFINER trigger)
CREATE POLICY "Clients insert own bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- 2. Chats INSERT policy
CREATE POLICY "Participants create chat" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

-- 3. Payouts: created server-side only (service_role). No INSERT/UPDATE policy by design.
COMMENT ON TABLE public.payouts IS 'Payouts are created and updated server-side only (service_role). Owners can read via payouts_select_own_or_admin policy.';

-- 4. Verification-docs storage UPDATE policy
CREATE POLICY "Users update own verification docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5/6. Lock down SECURITY DEFINER functions.
-- Trigger functions: not callable directly.
REVOKE ALL ON FUNCTION public.bump_chat_last_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_open_requests_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_offer_accepted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_booking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_offer() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_offer_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_verification_decided() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_availability_from_booking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_offer_total_price() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_global_user_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_public_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Admin-only maintenance functions: revoke from anon/authenticated; admins call via service_role / cron.
REVOKE ALL ON FUNCTION public.check_alerts() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: callable by RLS engine (SECURITY DEFINER) but not directly by anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_property_available(uuid, date, date, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_contacts(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_review_booking(uuid) FROM PUBLIC, anon;

-- App RPCs: keep callable by signed-in users only.
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_contact_info(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.match_properties_for_request(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.become_landlord() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_properties_for_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.become_landlord() TO authenticated;

-- 7. Pin search_path on every custom function (fixes "search_path mutable" warnings).
ALTER FUNCTION public.bump_chat_last_message() SET search_path = public, pg_catalog;
ALTER FUNCTION public.enforce_open_requests_limit() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_offer_accepted() SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_on_booking() SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_on_message() SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_on_offer() SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_on_offer_status() SET search_path = public, pg_catalog;
ALTER FUNCTION public.on_verification_decided() SET search_path = public, pg_catalog;
ALTER FUNCTION public.prevent_profile_privilege_escalation() SET search_path = public, pg_catalog;
ALTER FUNCTION public.sync_availability_from_booking() SET search_path = public, pg_catalog;
ALTER FUNCTION public.validate_offer_total_price() SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_global_user_id() SET search_path = public, pg_catalog;
ALTER FUNCTION public.assign_public_id() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_alerts() SET search_path = public, pg_catalog;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_chat_participant(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_request_client(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_property_available(uuid, date, date, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.can_view_contacts(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.can_review_booking(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_public_profile(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_contact_info(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.match_properties_for_request(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.become_landlord() SET search_path = public, pg_catalog;

-- 8. Document profile contact column exposure rules.
COMMENT ON COLUMN public.profiles.phone IS 'Sensitive: only readable by the owner via direct profile SELECT. Other users must use get_contact_info() RPC which checks can_view_contacts().';
COMMENT ON COLUMN public.profiles.whatsapp IS 'Sensitive: only readable by the owner via direct profile SELECT. Other users must use get_contact_info() RPC.';
COMMENT ON COLUMN public.profiles.telegram IS 'Sensitive: only readable by the owner via direct profile SELECT. Other users must use get_contact_info() RPC.';
