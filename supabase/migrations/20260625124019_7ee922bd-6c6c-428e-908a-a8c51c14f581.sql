
-- 1) match_properties_for_request: read-only, can run as INVOKER (properties has public SELECT on active)
ALTER FUNCTION public.match_properties_for_request(uuid) SECURITY INVOKER;

-- 2) Lock down EXECUTE on all callable DEFINER helpers — remove PUBLIC/anon, keep authenticated where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_review_booking(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_contacts(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_property_available(uuid, date, date, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_contact_info(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_property_contact(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.become_landlord() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.match_properties_for_request(uuid) FROM PUBLIC, anon;

-- 3) check_alerts: admin/cron only — service_role exclusively
REVOKE EXECUTE ON FUNCTION public.check_alerts() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_alerts() TO service_role;

-- 4) Ensure authenticated still has what it legitimately needs
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_booking(uuid)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_contacts(uuid, uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_property_available(uuid, date, date, uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_info(uuid)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_contact(uuid)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid)                TO authenticated;
GRANT EXECUTE ON FUNCTION public.become_landlord()                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_properties_for_request(uuid)             TO authenticated;
