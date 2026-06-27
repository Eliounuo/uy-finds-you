# CLAUDE.md — uy-finds-you

Аренда жилья в Казахстане (PWA). Сейчас работает через Lovable Cloud. Цель — независимая сборка.

## Stack

- **React 19** + TypeScript
- **TanStack Router** (file-based) + **TanStack Query** + **TanStack Start** (SSR)
- **Vite 8** bundler, **Bun** package manager
- **Tailwind CSS v4** + **shadcn/ui** + Radix UI
- **Supabase** — Postgres, Auth, Storage, Edge Functions, Realtime
- **React Hook Form** + **Zod**
- **Leaflet** + react-leaflet (карты)
- **PWA**: `manifest.webmanifest` + иконки уже готовы

## Планируемые интеграции

| Сервис | Цель | Статус |
|--------|------|--------|
| **Vercel** | Хостинг + Edge | не добавлен |
| **Sentry** | Error tracking | не добавлен |
| **PostHog** | Analytics + feature flags | не добавлен |

## Миграция из Lovable (план на после финала дизайна)

### 1. Удалить Lovable-зависимости

| Файл | Действие |
|------|----------|
| `src/integrations/lovable/index.ts` | Заменить `lovable.auth.signInWithOAuth` → `supabase.auth.signInWithOAuth` напрямую |
| `src/lib/lovable-error-reporting.ts` | Заменить на Sentry `captureException` |
| `src/lib/analytics.ts` | Заменить на PostHog |
| `src/integrations/supabase/client.ts` | Убрать сообщение "Connect Supabase in Lovable Cloud" |
| `package.json` | Удалить `@lovable.dev/cloud-auth-js`, `@lovable.dev/vite-tanstack-config` |

### 2. Push-уведомления (Web Push + Supabase)

Таблица `notifications` уже есть. Добавить Web Push:

```
public/sw.js                         ← Service Worker (push handler)
src/lib/push-subscription.ts        ← subscribe/unsubscribe логика
supabase/functions/send-push/       ← Edge Function для отправки
supabase/migrations/xxx_push.sql    ← таблица push_subscriptions
```

**Схема `push_subscriptions`:**
```sql
user_id uuid references auth.users
endpoint text
p256dh  text
auth    text
created_at timestamptz
```

**Триггер:** при INSERT в `notifications` → вызвать Edge Function `send-push`.

### 3. Vercel деплой

```
vercel.json                          ← конфиг (headers, rewrites для SPA)
.env.production                      ← VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
```

### 4. Sentry

```typescript
// src/main.tsx
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
// src/lib/lovable-error-reporting.ts → заменить на:
import * as Sentry from '@sentry/react'
export const captureError = Sentry.captureException
```

### 5. PostHog

```typescript
// src/lib/analytics.ts → заменить на PostHog:
import posthog from 'posthog-js'
posthog.init(import.meta.env.VITE_POSTHOG_KEY, { api_host: 'https://eu.posthog.com' })
```

## Dev команды

```bash
bun run dev       # dev server
bun run build     # prod build
bun run lint      # eslint
bun run format    # prettier
```

## Ключевые пути

- `src/components/ui/` — shadcn base (не трогать)
- `src/components/` — компоненты приложения
- `src/hooks/` — кастомные хуки
- `src/integrations/supabase/` — Supabase client, types, auth
- `src/lib/notifications.ts` — in-app уведомления (TanStack Query)

## ECC скиллы для этого проекта

| Задача | Команда |
|--------|---------|
| React code review | `/ecc:react-review` |
| Fix build | `/ecc:react-build` |
| E2E тесты | `/ecc:react-test` |
| TDD | `/ecc:tdd-workflow` |
| Security (Supabase RLS, push) | `/ecc:security-scan` |
| DB миграции | `database-migrations` skill |
| Performance | `react-performance` skill |

## Конвенции

- Conventional commits: `feat/fix/chore/docs/test`
- Zod для всех внешних данных
- RLS включён на всех таблицах Supabase
- Секреты только в `.env` (никогда в коде)
- Тест-покрытие: 80%+
