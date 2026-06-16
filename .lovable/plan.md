# Аудит UY и план до коммерческого запуска

Объём огромный (14 направлений). Чтобы не сломать работающий функционал и не превратить ответ в мегакоммит на 50+ файлов, разбиваю работу на **5 фаз**. Каждая фаза — отдельный завершённый кусок, который можно протестировать. После каждой фазы — короткий отчёт и переход к следующей.

---

## Что уже работает (проверено по коду)
Auth, профили, заявки, офферы, бронирования, чаты + Realtime, избранное, карта, панель владельца, загрузка фото, RLS, триггер `handle_offer_accepted` (auto-booking + auto-chat + auto-close request).

## Найденные критичные пробелы (краткий список)
1. **Двойное бронирование** — нет проверки пересечения дат ни в БД, ни в триггере `handle_offer_accepted`. Два оффера на одни даты → две брони.
2. **Уведомления** — таблицы `notifications` нет вообще.
3. **Отзывы** — таблица `reviews` есть (7 колонок), но UI и агрегация рейтинга отсутствуют.
4. **Жалоб** нет.
5. **Верификации владельцев** нет (`profiles.verification_status` отсутствует).
6. **Аналитики и Sentry** нет.
7. **JaSyn ID / Wallet / Payments** — архитектуры нет.
8. **Производительность** — частично починено (staleTime, defaultPreload:false), но `useProfile` дублирует `profileQuery`, нет виртуализации длинных списков, нет lazy для карты.
9. **Mobile** — нужен проход по safe-area, bottom-nav overlap, keyboard inset.
10. **Security** — нужен повторный security scan + проверка storage policies.

---

## Фаза 1 — Критичная защита данных и денег (БЛОКЕР запуска)
**Цель:** ни одной двойной брони, ни одной утечки данных.

1. **Anti-double-booking**
   - Миграция: `EXCLUDE USING gist (property_id WITH =, daterange(check_in, check_out, '[)') WITH &&) WHERE (status IN ('confirmed','pending'))` на `bookings`.
   - Обновить `handle_offer_accepted`: внутри транзакции проверить отсутствие пересечений; при конфликте — `RAISE EXCEPTION` и оставить оффер в `pending`.
   - Хелпер `is_property_available(property_id, check_in, check_out)` для UI и Pro-формы оффера.
   - Frontend: в `pro.requests.tsx` перед отправкой оффера и в `property.$id.tsx` перед «забронировать» вызывать хелпер, показывать toast «Даты заняты».

2. **Security pass**
   - Запустить `security--run_security_scan`, исправить все critical/high.
   - Проверить storage policy для `property-photos` и `avatars` (только владелец пишет, чтение — по необходимости).

---

## Фаза 2 — Уведомления, отзывы, жалобы, верификация (нужны для UX MVP)

1. **Notifications**
   - Таблица `notifications(id, user_id, type, title, body, entity_type, entity_id, read_at, created_at)` + RLS «свои».
   - Триггеры на `messages`, `offers` (insert + status change), `bookings` (insert + status change) → INSERT в `notifications`.
   - Realtime publication + `NotificationsBell` в `AppHeader` (badge + dropdown, mark-as-read).

2. **Reviews UI + агрегация**
   - View `property_ratings(property_id, avg_rating, reviews_count)` и `owner_ratings(owner_id, avg_rating, reviews_count)`.
   - На `property.$id.tsx` — блок отзывов + форма (доступна только клиенту с завершённой бронью на этот объект, проверка через RLS+ функция `can_review`).
   - Звезда + число в `PropertyCard` и в профиле владельца.

3. **Complaints**
   - Таблица `complaints(id, reporter_id, target_type ENUM('property','owner','client'), target_id, reason, description, status ENUM('open','reviewing','resolved','rejected'), created_at, updated_at, resolved_by, resolution_note)` + RLS (reporter видит свои, admin видит все).
   - Роль `admin` через `user_roles` + `has_role` (если ещё нет — создать).
   - Кнопка «Пожаловаться» на карточке/в чате/в профиле.

4. **Owner verification**
   - `profiles.verification_status ENUM('unverified','pending','verified')`, default `unverified`.
   - `verification_requests(id, user_id, doc_url, status, reviewed_by, created_at)`.
   - Badge «Проверен» в `PropertyCard` и в шапке профиля.
   - Экран `/profile/verification` — загрузка документа, статус.

---

## Фаза 3 — Аналитика, ошибки, монетизация-каркас

1. **PostHog** (через npm `posthog-js`), init только в браузере, capture: `request_created`, `offer_created`, `offer_accepted`, `offer_declined`, `booking_created`, `message_sent`, `signup`, `verification_submitted`. Ключ через secret `VITE_POSTHOG_KEY`.

2. **Sentry** (`@sentry/react`), DSN через `VITE_SENTRY_DSN`, обернуть `ErrorComponent` + `captureException` в `src/lib/error-capture.ts`.

3. **Payments / commissions / payouts (только схема, без логики)**
   - `payments(id, booking_id, amount, currency, status, provider, provider_ref, created_at)`
   - `commissions(id, booking_id, amount, rate, status)`
   - `payouts(id, owner_id, amount, status, period_start, period_end, paid_at)`
   - RLS: владелец видит свои payouts/commissions, клиент — свои payments. Без edge-функций оплаты на этом этапе.

---

## Фаза 4 — JaSyn-задел

1. `profiles.global_user_id UUID UNIQUE` (заполняется = id, но колонка готова к внешнему IdP).
2. `wallet_balance(user_id PK, balance numeric, currency, status ENUM('active','frozen','closed'), updated_at)`.
3. `wallet_transactions(id, user_id, type ENUM('credit','debit','hold','release'), amount, currency, reference_type, reference_id, status, created_at)`.
4. RLS «свои», без UI — только архитектура.

---

## Фаза 5 — Производительность и мобильная полировка

1. **Perf**
   - `useProfile` → переписать на `useQuery(profileQuery)` (убрать двойной fetch, который оставался TODO).
   - Виртуализация (`@tanstack/react-virtual`) для длинных списков `requests`, `chat list`, `pro.requests`.
   - Карта: `lazy()` + Suspense, маркеры — кластеризация (если используется leaflet) или ограничение видимого bounds.
   - Изображения: `loading="lazy"`, `decoding="async"`, `sizes` + переход на webp в `SignedImg`.
   - Уберу любые лишние invalidateQueries.

2. **Mobile**
   - `viewport-fit=cover` + `env(safe-area-inset-*)` в `BottomNav` и формах.
   - Inputs: `inputmode`, `enterkeyhint`, `autocomplete`.
   - Проверка через `browser--set_viewport_size` (iPhone 14, Pixel 7) + скриншоты ключевых экранов.

---

## Технический раздел (для разработчика)
- Все миграции — отдельными вызовами `supabase--migration`, каждая с GRANT-блоком.
- Для exclusion-constraint нужно `CREATE EXTENSION IF NOT EXISTS btree_gist`.
- Все триггеры — `SECURITY DEFINER SET search_path=public`.
- `useProfile` → тонкая обёртка над `useQuery(profileQuery(user?.id))` для обратной совместимости.
- PostHog/Sentry — динамический import внутри `__root.tsx` `useEffect`, чтобы не утяжелять SSR-бандл.

---

## Что я НЕ трогаю (по твоему запросу)
- Существующую архитектуру TanStack Start / Supabase / RLS-модель.
- Бизнес-логику офферов и чатов (только добавляю триггеры уведомлений сверху).
- Дизайн-систему.

---

## Вопрос перед стартом
Подтверди: **начинаем с Фазы 1** (anti-double-booking + security scan) — это самый критичный блокер. После её завершения я дам короткий отчёт и пойду в Фазу 2. Либо скажи, если хочешь переставить приоритеты или сократить scope (например, отложить JaSyn Wallet).

Финальный сводный отчёт (% готовности MVP, готовность к 100/1000 квартирам, рекомендации по Кокшетау и РК) дам после Фазы 5 — на основе фактически внедрённого, а не обещаний.
