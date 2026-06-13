
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
  '{"full_name":"UY Demo"}'::jsonb,
  false, '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, mode)
VALUES ('00000000-0000-0000-0000-00000000d3e0', 'UY Demo', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, owner_id, title, description, city, district, address, lat, lng, price_per_night, rooms, beds, guests, area, amenities, photos, rating, reviews_count) VALUES
('11111111-1111-1111-1111-000000000001','00000000-0000-0000-0000-00000000d3e0','Светлая студия в центре','Стильная студия с панорамным видом на горы.','Алматы','Медеуский','ул. Достык 89',43.2389,76.9456, 18000, 1, 1, 2, 38, ARRAY['wifi','washer','kitchen','tv'], ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'], 4.9, 24),
('11111111-1111-1111-1111-000000000002','00000000-0000-0000-0000-00000000d3e0','2-комнатная у Esentai Mall','Близко к ТРЦ Esentai, тихий двор, парковка.','Алматы','Бостандыкский','пр. Аль-Фараби 77',43.2206,76.9286, 28000, 2, 2, 4, 65, ARRAY['wifi','parking','washer','kitchen','ac'], ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800'], 4.8, 41),
('11111111-1111-1111-1111-000000000003','00000000-0000-0000-0000-00000000d3e0','Лофт на Арбате','Современный лофт в пешей доступности от Арбата.','Алматы','Алмалинский','ул. Жибек Жолы 50',43.2587,76.9430, 22000, 1, 2, 3, 48, ARRAY['wifi','kitchen','workspace'], ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'], 4.7, 18),
('11111111-1111-1111-1111-000000000004','00000000-0000-0000-0000-00000000d3e0','Семейные апартаменты','3 комнаты, детская кроватка, всё для семьи.','Астана','Есиль','ул. Кунаева 14',51.1283,71.4304, 32000, 3, 3, 6, 90, ARRAY['wifi','parking','washer','kitchen','crib'], ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'], 4.9, 56),
('11111111-1111-1111-1111-000000000005','00000000-0000-0000-0000-00000000d3e0','Бизнес-апарт у Хан Шатыра','Минималистичный дизайн, рядом с Хан Шатыром.','Астана','Есиль','пр. Туран 37',51.1326,71.4046, 24000, 1, 1, 2, 42, ARRAY['wifi','ac','kitchen','workspace'], ARRAY['https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800','https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800'], 4.6, 12),
('11111111-1111-1111-1111-000000000006','00000000-0000-0000-0000-00000000d3e0','Уютная 2-комн. на Левом берегу','Тёплая квартира с видом на Байтерек.','Астана','Есиль','ул. Сыганак 25',51.1289,71.4267, 26000, 2, 2, 4, 60, ARRAY['wifi','washer','kitchen','tv'], ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800','https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'], 4.8, 33),
('11111111-1111-1111-1111-000000000007','00000000-0000-0000-0000-00000000d3e0','Студия в центре Шымкента','Современный ремонт, рядом парк.','Шымкент','Аль-Фарабийский','ул. Тауке хана 5',42.3417,69.5901, 14000, 1, 1, 2, 35, ARRAY['wifi','kitchen','ac'], ARRAY['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'], 4.7, 9),
('11111111-1111-1111-1111-000000000008','00000000-0000-0000-0000-00000000d3e0','Премиум апарт у Кок-Тобе','Видовая квартира с балконом и джакузи.','Алматы','Медеуский','мкр. Кок-Тобе 12',43.2294,76.9686, 45000, 2, 2, 4, 80, ARRAY['wifi','parking','ac','kitchen','jacuzzi','tv','workspace'], ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'], 5.0, 67)
ON CONFLICT (id) DO NOTHING;
