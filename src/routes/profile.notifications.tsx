import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellOff, MessageCircle, Calendar, Tag, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/notifications")({
  component: NotificationsPage,
});

type NotifPrefs = {
  push: boolean;
  chat: boolean;
  offers: boolean;
  bookings: boolean;
  reminders: boolean;
};

const PREF_KEY = "uy:notif-prefs";

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { push: true, chat: true, offers: true, bookings: true, reminders: true, ...JSON.parse(raw) };
  } catch {}
  return { push: true, chat: true, offers: true, bookings: true, reminders: true };
}

type PermState = "default" | "granted" | "denied" | "unsupported";

function getPermState(): PermState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
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

  const handlePushToggle = useCallback(async () => {
    if (perm === "unsupported") return;
    if (perm === "denied") {
      // Can't re-enable programmatically — open browser settings hint
      return;
    }
    if (perm === "granted") {
      // Can't revoke permission via JS, update pref only
      updatePref("push");
      return;
    }
    // perm === "default"
    try {
      const res = await Notification.requestPermission();
      setPerm(res as PermState);
      if (res === "granted") {
        setPrefs((prev) => {
          const next = { ...prev, push: true };
          localStorage.setItem(PREF_KEY, JSON.stringify(next));
          return next;
        });
        new Notification("YURTA", { body: "Уведомления включены", icon: "/icon-192.png" });
      }
    } catch {}
  }, [perm, updatePref]);

  const pushOn = perm === "granted" && prefs.push;
  const pushDenied = perm === "denied";

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
        <div>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Push-уведомления
          </h3>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                pushOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {pushOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {pushDenied ? "Уведомления заблокированы" : pushOn ? "Уведомления включены" : "Push-уведомления"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {pushDenied
                    ? "Разрешите в настройках браузера → Сайты"
                    : perm === "unsupported"
                    ? "Браузер не поддерживает"
                    : pushOn
                    ? "Вы получаете уведомления на это устройство"
                    : "Включите, чтобы не пропускать важные события"}
                </div>
              </div>
              <Toggle
                checked={pushOn}
                onChange={handlePushToggle}
                disabled={perm === "unsupported" || pushDenied}
              />
            </div>
            {pushDenied && (
              <div className="border-t border-border px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Настройки браузера → Конфиденциальность → Уведомления → найдите сайт → Разрешить
                </p>
              </div>
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
              desc="От арендаторов и владельцев"
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
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
