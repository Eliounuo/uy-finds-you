// PostHog analytics — stub mode unless VITE_POSTHOG_KEY is configured.
/* eslint-disable @typescript-eslint/no-explicit-any */

let ph: any = null;
let initialized = false;

export async function initPostHog(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://app.posthog.com";
  if (!key) {
    console.log("[PostHog Stub] Not initialized (VITE_POSTHOG_KEY is missing)");
    return;
  }
  try {
    const pkg = "posthog-js";
    // @ts-expect-error optional peer dep, resolved at runtime
    const mod = await import(/* @vite-ignore */ pkg);
    const posthog = (mod as any).default ?? mod;
    posthog.init(key, { api_host: host, autocapture: false });
    ph = posthog;
  } catch (e) {
    console.warn("[PostHog Stub] Failed to load posthog-js", e);
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (ph) {
    ph.capture(event, properties);
  } else {
    console.log("[Analytics]", event, properties ?? "");
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (ph) {
    ph.identify(userId, traits);
  } else {
    console.log("[Analytics] identify", userId, traits ?? "");
  }
}

export function pageView(page: string): void {
  if (ph) {
    ph.capture("$pageview", { page });
  } else {
    console.log("[Analytics] pageview", page);
  }
}
