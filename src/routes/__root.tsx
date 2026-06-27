import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { captureException } from "@/lib/monitoring/sentry";
import { AppModeProvider } from "@/lib/app-mode";
import { BottomNav } from "@/components/bottom-nav";
import { ProfileGate } from "@/components/profile-gate";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { installGlobalErrorHandlers, logError } from "@/lib/analytics";
import { usePushNotifications } from "@/lib/use-push-notifications";
import { initSentry } from "@/lib/monitoring/sentry";
import { initPostHog } from "@/lib/analytics/posthog";
import "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /Importing a module script failed|Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk|Loading CSS chunk/i.test(
    msg,
  );
}

const RELOAD_FLAG = "__uy_chunk_reload_at";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    captureException(error, { boundary: "root" });
    void logError(error, { boundary: "root" });
    if (typeof window !== "undefined" && isChunkLoadError(error)) {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуйте обновить страницу или вернуться домой.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem(RELOAD_FLAG);
              } catch {}
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function PushNotificationsMount() {
  usePushNotifications();
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {}
    installGlobalErrorHandlers();
    void initSentry();
    void initPostHog();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else if (event === "SIGNED_IN") {
        queryClient.invalidateQueries();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppModeProvider>
        <PushNotificationsMount />
        <ProfileGate />
        <OnboardingTour />
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <main className="flex flex-1 flex-col pb-2">
            <Outlet />
          </main>
          <BottomNav />
          <Toaster />
        </div>
      </AppModeProvider>
    </QueryClientProvider>
  );
}
