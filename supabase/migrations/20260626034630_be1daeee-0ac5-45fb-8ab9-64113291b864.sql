
CREATE TYPE public.pricing_kind AS ENUM ('package','service','subscription');
CREATE TYPE public.pricing_period AS ENUM ('one_time','month','year','week');

CREATE TABLE public.pricing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.pricing_kind NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'KZT',
  period public.pricing_period NOT NULL DEFAULT 'one_time',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_items TO anon, authenticated;
GRANT ALL ON public.pricing_items TO service_role;

ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active pricing"
  ON public.pricing_items FOR SELECT
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage pricing"
  ON public.pricing_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pricing_items_updated
  BEFORE UPDATE ON public.pricing_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed
INSERT INTO public.pricing_items (kind, code, name, description, price, period, features, sort_order) VALUES
  ('package','start','Start','Базовое продвижение объявления',320,'one_time','["Поднять в ТОП","Небольшой прирост показов","Значок Новое"]'::jsonb,10),
  ('package','gold','Gold','Усиленное продвижение',420,'one_time','["Выше в поиске","Выделение карточки","Увеличенный охват","Приоритет в рекомендациях"]'::jsonb,20),
  ('package','premium','Premium','Максимальное продвижение',485,'one_time','["Максимальный приоритет","Premium Badge","Максимальный охват","Рекомендации на главной","Цветное оформление карточки","Увеличенные фотографии","Наивысший приоритет в поиске"]'::jsonb,30),

  ('service','boost_top','Поднять в ТОП',NULL,320,'one_time','[]'::jsonb,10),
  ('service','highlight','Выделить цветом',NULL,190,'one_time','[]'::jsonb,20),
  ('service','vip','VIP',NULL,490,'one_time','[]'::jsonb,30),
  ('service','urgent','Срочно',NULL,30,'one_time','[]'::jsonb,40),
  ('service','pin_first','Закрепить первым',NULL,650,'one_time','[]'::jsonb,50),
  ('service','views_week','Увеличить показы на неделю',NULL,1590,'week','[]'::jsonb,60),
  ('service','views_month','Увеличить показы на месяц',NULL,2650,'month','[]'::jsonb,70),
  ('service','show_home','Показывать на главной',NULL,990,'one_time','[]'::jsonb,80),
  ('service','show_similar','Показывать в похожих объявлениях',NULL,390,'one_time','[]'::jsonb,90),

  ('subscription','starter','Starter','Базовый тариф',0,'month','["Бесплатно"]'::jsonb,10),
  ('subscription','pro_month','Pro (месяц)',NULL,2990,'month','[]'::jsonb,20),
  ('subscription','pro_year','Pro (год)','2 месяца бесплатно',29900,'year','[]'::jsonb,21),
  ('subscription','business_month','Business (месяц)',NULL,8990,'month','[]'::jsonb,30),
  ('subscription','business_year','Business (год)','2 месяца бесплатно',89900,'year','[]'::jsonb,31);
