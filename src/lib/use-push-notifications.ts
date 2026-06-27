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
  return /^(id-preview--|preview--)/.test(h);
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

function showNotification(reg: ServiceWorkerRegistration | null, n: AppNotification, href: string) {
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

  // Subscribe to native Web Push using VAPID and persist on the server.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission !== "granted") return;
        const reg = swReg.current ?? (await navigator.serviceWorker.getRegistration());
        if (!reg || cancelled) return;
        const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
        if (!publicKey || cancelled) return;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
          });
        }
        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: user!.id,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            user_agent: navigator.userAgent,
          },
          { onConflict: "endpoint" },
        );
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Trigger a server-side push via the `send-push` Edge Function.
 * Only callable from privileged contexts (the function verifies service-role auth).
 */
export async function triggerServerPush(
  userId: string,
  title: string,
  body?: string,
  url?: string,
): Promise<{ sent: number; failed: number } | null> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: { userId, title, body, url },
    });
    if (error) return null;
    return data as { sent: number; failed: number };
  } catch {
    return null;
  }
}
