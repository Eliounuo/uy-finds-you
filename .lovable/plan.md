# Критичный бэкенд UY — план до идеала

Цель: убрать моки, связать UY Lite и UY Pro через реальную БД, добавить загрузку фото и живой чат. Всё с RLS, типами и кэшированием через TanStack Query.

## 1. Схема БД (одна миграция)

### Таблицы

**`properties`** — объекты владельцев
- `id uuid pk`, `owner_id uuid → auth.users`
- `title text`, `description text`
- `city text`, `district text`, `address text`
- `lat numeric`, `lng numeric`
- `price_per_night int`, `currency text default 'KZT'`
- `rooms int`, `beds int`, `guests int`, `area int`
- `amenities text[]` (wifi, parking, washer, ...)
- `photos text[]` (пути в storage bucket `property-photos`)
- `status text default 'active'` (active/paused/draft)
- `rating numeric default 0`, `reviews_count int default 0`
- `created_at`, `updated_at`

**`requests`** — заявки от клиентов
- `id uuid pk`, `client_id uuid → auth.users`
- `city text`, `district text`
- `check_in date`, `check_out date`
- `guests int`, `budget_max int`
- `notes text`, `amenities text[]`
- `status text default 'open'` (open/closed/cancelled)
- `created_at`, `expires_at`

**`offers`** — предложения владельцев на заявки
- `id uuid pk`, `request_id → requests`, `property_id → properties`, `owner_id → auth.users`
- `price_per_night int`, `total_price int`, `message text`
- `status text default 'pending'` (pending/accepted/declined/expired)
- `created_at`
- unique (`request_id`, `property_id`)

**`bookings`** — подтверждённые брони
- `id uuid pk`, `client_id`, `owner_id`, `property_id`, `offer_id`
- `check_in`, `check_out`, `guests`, `total_price`
- `status` (confirmed/cancelled/completed)
- `created_at`

**`chats`** — диалоги между клиентом и владельцем (по offer)
- `id uuid pk`, `client_id`, `owner_id`, `property_id`, `offer_id`
- `last_message_at`, `created_at`
- unique (`offer_id`)

**`messages`** — сообщения
- `id uuid pk`, `chat_id → chats`, `sender_id → auth.users`
- `body text`, `created_at`

**`reviews`** — отзывы
- `id uuid pk`, `booking_id`, `property_id`, `author_id`
- `rating int 1-5`, `text text`, `created_at`

**`favorites`** — избранное
- `user_id`, `property_id`, pk(user_id, property_id)

### `profiles`
Добавить столбец `mode` уже есть. Используем его как источник правды (синхронизируем localStorage).

### RLS (без рекурсии)
- `properties`: SELECT — все авторизованные (active); INSERT/UPDATE/DELETE — только owner.
- `requests`: SELECT — автор + любой авторизованный (owner может видеть open-заявки чтобы откликаться); INSERT/UPDATE/DELETE — только client.
- `offers`: SELECT — owner оффера ИЛИ автор связанной requests; INSERT — owner; UPDATE статуса — client заявки (accept/decline) ИЛИ owner (отозвать).
- `bookings`: SELECT — client ИЛИ owner; INSERT — через server function при accept offer.
- `chats`/`messages`: SELECT/INSERT — только participants.
- `favorites`, `reviews`: SELECT — все; INSERT/DELETE — автор.

Для проверки participant в `messages` — security definer функция `is_chat_participant(chat_id, user_id)`.

### Realtime
`ALTER PUBLICATION supabase_realtime ADD TABLE messages, offers, requests;`

### GRANTs
Для каждой таблицы: `GRANT SELECT,INSERT,UPDATE,DELETE ON ... TO authenticated; GRANT ALL ... TO service_role;`

## 2. Storage

Bucket `property-photos` (public для просмотра, RLS на загрузку только owner).
Политики: SELECT для всех; INSERT/UPDATE/DELETE — только если `(storage.foldername(name))[1] = auth.uid()::text`.

## 3. Клиентский слой данных

Создать `src/lib/queries/` с queryOptions:
- `propertiesQueryOptions(filters)`, `propertyQueryOptions(id)`
- `myPropertiesQueryOptions()` (для Pro)
- `requestsQueryOptions()` (open для Pro), `myRequestsQueryOptions()` (для Lite)
- `offersForRequestQueryOptions(requestId)`, `myOffersQueryOptions()`
- `bookingsQueryOptions()`, `chatsQueryOptions()`, `messagesQueryOptions(chatId)`
- `favoritesQueryOptions()`

Все через прямые `supabase.from(...)` (RLS обеспечивает безопасность). Никаких server functions для CRUD не нужно — публичная анонка не требуется, всё авторизованное.

## 4. Обновлённые экраны

### UY Lite
- `index.tsx` — лента из `properties` (active), фильтры city/price/guests.
- `create-request.tsx` — INSERT в `requests`, redirect на `/requests/$id`.
- `requests.tsx` + `requests.$id.tsx` (новый) — список моих заявок + входящие офферы; кнопки Accept/Decline.
- `favorites.tsx` — джойн favorites + properties.
- `bookings.tsx` — реальные брони.
- `property.$id.tsx` — реальный объект + кнопка "Добавить в избранное" (toggle).

### UY Pro
- `pro/index.tsx` — мои объекты + быстрая статистика (count, revenue из bookings).
- `pro/properties.new.tsx` + `pro/properties.$id.edit.tsx` — форма с upload фото в storage.
- `pro/requests.tsx` — лента open-заявок; кнопка "Сделать предложение" — bottom sheet с выбором property + цена + сообщение → INSERT offer.
- `pro/calendar.tsx` — занятость из bookings.

### Чат (общий)
- `chat.index.tsx` — мои чаты (по `chats`), порядок по `last_message_at`.
- `chat.$id.tsx` — сообщения + realtime subscription через `supabase.channel`. Send → INSERT message + UPDATE `chats.last_message_at`.

### Profile / Mode
- `app-mode.tsx`: при логине читать `profiles.mode`; `setMode` → UPDATE profiles + локальный state. localStorage остаётся как fallback для незалогиненных.
- Realtime subscribe на profile, чтобы мульти-устройство синкалось.

## 5. Авто-создание chat и booking

Триггеры:
- При `offers.status → 'accepted'`: создать `bookings` и `chats` если ещё нет.
- Защита от двойного accept (только если pending).

## 6. Очистка моков

`src/lib/mock-data.ts` оставить только для seed-демо (через миграцию seed insert) — на проде убрать. Все компоненты переключить на queryOptions.

## 7. Защищённые маршруты

Перенести `bookings`, `favorites`, `create-request`, `requests*`, `chat*`, `pro*`, `profile` (только при необходимости) под `src/routes/_authenticated/`. Layout `_authenticated/route.tsx` уже управляется интеграцией.

Публичные: `index` (лента), `property.$id` (карточка для шеринга), `map`, `auth`.

## 8. Seed-данные

В миграции добавить 6-8 демо-объектов на фиктивного владельца (через `gen_random_uuid()` profile), чтобы лента не была пустой у новых пользователей.

## Технические детали

```text
Порядок выполнения:
1. Миграция: схема + RLS + GRANT + триггеры + realtime + seed.
2. Storage bucket + политики (отдельная миграция/тулза).
3. queries/ модули + типы из обновлённого types.ts.
4. Переписать экраны Lite → Pro → Chat.
5. Перенос под _authenticated.
6. Удалить mock-data.ts (или урезать до утилит форматирования).
```

Зависимости новых пакетов не нужны — `@supabase/supabase-js` уже подключён, realtime в нём же.

## Что НЕ входит в этот этап
- Push-уведомления
- Оплата / Kaspi
- Верификация владельцев и роли admin
- iCal экспорт
- Кластеризация маркеров
- i18n

Это пойдёт следующими итерациями.

---

Готов начать с миграции схемы. Подтвердите план — и поехали.
