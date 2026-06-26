// Sentry monitoring — stub mode unless VITE_SENTRY_DSN is configured.
/* eslint-disable @typescript-eslint/no-explicit-any */

let sentry: any = null;
let initialized = false;

export async function initSentry(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    console.warn("[Sentry Stub] Not initialized (VITE_SENTRY_DSN is missing)");
    return;
  }
  try {
    // @ts-expect-error optional peer dep
    const mod = await import(/* @vite-ignore */ "@sentry/react");
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
    sentry = mod;
  } catch (e) {
    console.warn("[Sentry Stub] Failed to load @sentry/react", e);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureException(error, context ? { extra: context } : undefined);
  } else {
    console.error("[Sentry]", error, context ?? "");
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (sentry) {
    sentry.captureMessage(message, level);
  } else {
    console.log("[Sentry]", level, message);
  }
}

export function setUser(id: string | null, email?: string | null): void {
  if (sentry) {
    sentry.setUser(id ? { id, email: email ?? undefined } : null);
  } else {
    console.log("[Sentry] setUser", id, email ?? "");
  }
}
