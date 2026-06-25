import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { notificationHref, type Notification as AppNotification } from "@/lib/notifications";

function isPreviewOrDev(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  return (
    /^(id-preview--|preview--)/.test(h) ||
    /\.lovableproject(-dev)?\.com$/.test(h) ||
    /\.beta\.lovable\.dev$/.test(h)
  );
}

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (isPreviewOrDev()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

function showNotification(
  reg: ServiceWorkerRegistration | null,
  n: AppNotification,
  href: string,
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const title = n.title;
  const body = n.body ?? "";
  const tag = `uy-${n.id}`;
  if (reg) {
    try {
      reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag,
        data: { url: href },
      });
      return;
    } catch {
      /* fallthrough */
    }
  }
  try {
    const note = new Notification(title, { body, icon: "/icon-192.png", tag });
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

/**
 * Global push pipeline for the authenticated user:
 * - registers /sw.js in production
 * - subscribes to realtime inserts on notifications
 * - shows a native notification when the tab is hidden
 * - keeps the notifications cache fresh for the bell
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const swReg = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let alive = true;
    void registerSW().then((reg) => {
      if (alive) swReg.current = reg;
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`push:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          const n = payload.new as AppNotification;
          if (typeof document !== "undefined" && !document.hidden) return;
          showNotification(swReg.current, n, notificationHref(n));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);
}
