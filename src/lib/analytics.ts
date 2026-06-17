import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight self-hosted analytics. Fire-and-forget; never throws.
 * Replace with PostHog later by swapping the body of `track`.
 */
export async function track(event: string, payload: Record<string, unknown> = {}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      payload,
    });
  } catch {
    // swallow — analytics must never break UX
  }
}

export async function logError(err: unknown, meta: Record<string, unknown> = {}) {
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("error_logs").insert({
      user_id: user?.id ?? null,
      message: e.message.slice(0, 1000),
      stack: e.stack?.slice(0, 4000) ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      meta,
    });
  } catch {
    // ignore
  }
}

/** Install global handlers for unhandled errors/rejections. Call once on mount. */
export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __uy_err_installed?: boolean }).__uy_err_installed) return;
  (window as unknown as { __uy_err_installed?: boolean }).__uy_err_installed = true;

  window.addEventListener("error", (e) => {
    void logError(e.error ?? e.message, { kind: "window.error" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    void logError(e.reason, { kind: "unhandledrejection" });
  });
}
