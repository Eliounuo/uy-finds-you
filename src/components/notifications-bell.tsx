import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import {
  notificationsQuery,
  markNotificationRead,
  markAllNotificationsRead,
  notificationHref,
  type Notification as AppNotification,
} from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/mock-data";

type PushPermission = "default" | "granted" | "denied" | "unsupported";

function getPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

function showSystemNotification(n: AppNotification, href: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const note = new Notification(n.title, {
      body: n.body ?? undefined,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `uy-${n.id}`,
      data: { href },
    });
    note.onclick = () => {
      window.focus();
      window.location.assign(href);
      note.close();
    };
    setTimeout(() => note.close(), 8000);
  } catch {
    /* noop */
  }
}

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<PushPermission>(getPermission);
  const ref = useRef<HTMLDivElement>(null);
  const { data = [] } = useQuery(notificationsQuery(user?.id ?? null));
  const unread = data.filter((n) => !n.read_at).length;

  // Realtime updates handled globally by usePushNotifications (root).


  // close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const enablePush = useCallback(async () => {
    if (!("Notification" in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPerm(res as PushPermission);
      if (res === "granted") {
        new Notification("Уведомления включены", {
          body: "Вы будете получать пуш-уведомления от YURTA",
          icon: "/icons/icon-192.png",
        });
      }
    } catch {
      /* noop */
    }
  }, []);

  

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border active:scale-95 transition-transform"
        aria-label="Уведомления"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-display text-sm font-bold">Уведомления</span>
            {user && unread > 0 && (
              <button
                onClick={async () => {
                  await markAllNotificationsRead(user.id);
                  qc.invalidateQueries({ queryKey: ["notifications", user.id] });
                }}
                className="text-[11px] text-primary"
              >
                Прочитать всё
              </button>
            )}
          </div>

          {!user && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Войдите, чтобы получать уведомления
            </div>
          )}

          {user && perm === "default" && (
            <button
              onClick={enablePush}
              className="flex w-full items-center gap-2 border-b border-border bg-primary/5 px-3 py-2.5 text-left text-xs hover:bg-primary/10"
            >
              <BellRing className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">Включить пуш-уведомления</div>
                <div className="text-muted-foreground">Узнавай о новых офферах и сообщениях мгновенно</div>
              </div>
            </button>
          )}
          {user && perm === "denied" && (
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              <BellOff className="h-3.5 w-3.5 shrink-0" />
              <span>Пуши заблокированы. Разрешите их в настройках браузера.</span>
            </div>
          )}

          {user && (
            <div className="max-h-96 overflow-y-auto">
              {data.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">Пусто</div>
              )}
              {data.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    if (!n.read_at) {
                      await markNotificationRead(n.id);
                      qc.invalidateQueries({ queryKey: ["notifications", user.id] });
                    }
                    setOpen(false);
                    navigate({ to: notificationHref(n) });
                  }}
                  className={`block w-full border-b border-border/50 px-3 py-2 text-left text-xs last:border-0 ${
                    n.read_at ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="font-semibold">{n.title}</div>
                  {n.body && <div className="mt-0.5 line-clamp-2 text-muted-foreground">{n.body}</div>}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

