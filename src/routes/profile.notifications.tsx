import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  BellRing,
  MessageCircle,
  Calendar,
  Tag,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/notifications")({
  component: NotificationsPage,
});

type NotifPrefs = {
  chat: boolean;
  offers: boolean;
  bookings: boolean;
  reminders: boolean;
};

const PREF_KEY = "uy:notif-prefs";

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw) as NotifPrefs;
  } catch {}
  return { chat: true, offers: true, bookings: true, reminders: true };
}

type PermState = "default" | "granted" | "denied" | "unsupported";

function getPermState(): PermState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

function NotificationsPage() {
  const [perm, setPerm] = useState<PermState>(getPermState);
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const updatePref = useCallback((key: keyof NotifPrefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPerm(res as PermState);
      if (res === "granted") {
        new Notification("YURTA", {
          body: "Уведомления успешно включены",
          icon: "/icon-192.png",
        });
      }
    } catch {}
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 pb-2 pt-4 backdrop-blur-lg">
        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Уведомления</h1>
      </header>

      <main className="space-y-4 px-4 pt-4 pb-24">
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                perm === "granted"
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : perm === "denied"
                    ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-primary/10 text-primary",
              )}
            >
              {perm === "granted" ? (
                <Bell className="h-5 w-5" />
              ) : perm === "denied" ? (
                <BellOff className="h-5 w-5" />
              ) : (
                <BellRing className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {perm === "granted" && "Push-уведомления включены"}
                {perm === "denied" && "Уведомления заблокированы"}
                {perm === "default" && "Push-уведомления отключены"}
                {perm === "unsupported" && "Браузер не поддерживает"}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {perm === "granted" && "Получаете уведомления на это устройство"}
                {perm === "denied" && "Разрешите в настройках браузера → Сайты"}
                {perm === "default" && "Нажмите, чтобы получать уведомления"}
                {perm === "unsupported" && "Попробуйте открыть в другом браузере"}
              </div>
            </div>
            {perm === "default" && (
              <button
                onClick={requestPermission}
                className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                Включить
              </button>
            )}
            {perm === "granted" && (
              <span className="shrink-0 text-xs font-semibold text-green-600 dark:text-green-400">
                ✓ Активно
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Типы уведомлений
          </h3>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <PrefRow
              icon={MessageCircle}
              label="Новые сообщения"
              desc="Сообщения от арендаторов и владельцев"
              checked={prefs.chat}
              onChange={() => updatePref("chat")}
            />
            <PrefRow
              icon={Tag}
              label="Предложения аренды"
              desc="Когда владелец откликается на заявку"
              checked={prefs.offers}
              onChange={() => updatePref("offers")}
            />
            <PrefRow
              icon={Calendar}
              label="Бронирования"
              desc="Обновление статусов и подтверждения"
              checked={prefs.bookings}
              onChange={() => updatePref("bookings")}
            />
            <PrefRow
              icon={RefreshCw}
              label="Напоминания"
              desc="Напоминание о заезде и выезде"
              checked={prefs.reminders}
              onChange={() => updatePref("reminders")}
            />
          </div>
        </div>

        {perm === "denied" && (
          <p className="px-1 text-[11px] text-muted-foreground">
            Чтобы включить снова: настройки браузера → Сайты →{" "}
            {typeof window !== "undefined" ? window.location.hostname : "yurta.app"} → Уведомления →
            Разрешить.
          </p>
        )}
      </main>
    </div>
  );
}

function PrefRow({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
