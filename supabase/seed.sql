-- Local development seed only. NOT applied to production.
-- Run manually via `supabase db reset` in local dev.

-- Demo owner: fixed UUID so seed is idempotent across environments
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-00000000d3e0',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo-owner@uy.kz',
  crypt('uy-demo-disabled', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"YURTA Demo"}'::jsonb,
  false, '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, mode)
VALUES ('00000000-0000-0000-0000-00000000d3e0', 'YURTA Demo', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, owner_id, title, description, city, district, address, lat, lng, price_per_night, rooms, beds, guests, area, amenities, photos, rating, reviews_count) VALUES
('11111111-1111-1111-1111-000000000001','00000000-0000-0000-0000-00000000d3e0','Светлая студия в центре','Стильная студия с панорамным видом на горы.','Алматы','Медеуский','ул. Достык 89',43.2389,76.9456, 18000, 1, 1, 2, 38, ARRAY['wifi','washer','kitchen','tv'], ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'], 4.9, 24),
('11111111-1111-1111-1111-000000000002','00000000-0000-0000-0000-00000000d3e0','2-комнатная у Esentai Mall','Близко к ТРЦ Esentai, тихий двор, парковка.','Алматы','Бостандыкский','пр. Аль-Фараби 77',43.2206,76.9286, 28000, 2, 2, 4, 65, ARRAY['wifi','parking','washer','kitchen','ac'], ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800'], 4.8, 41)
ON CONFLICT (id) DO NOTHING;
