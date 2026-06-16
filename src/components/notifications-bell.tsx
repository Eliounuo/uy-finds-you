import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import {
  notificationsQuery,
  markNotificationRead,
  markAllNotificationsRead,
  notificationHref,
} from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/mock-data";

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data = [] } = useQuery(notificationsQuery(user?.id ?? null));
  const unread = data.filter((n) => !n.read_at).length;

  // Realtime: refresh on new notification
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
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
            {unread > 0 && (
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
        </div>
      )}
    </div>
  );
}
