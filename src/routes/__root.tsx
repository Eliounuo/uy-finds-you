import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppModeProvider } from "@/lib/app-mode";
import { BottomNav } from "@/components/bottom-nav";
import { ProfileGate } from "@/components/profile-gate";
import { Onboarding } from "@/components/onboarding";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { installGlobalErrorHandlers, logError } from "@/lib/analytics";
import { usePushNotifications } from "@/lib/use-push-notifications";


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
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    void logError(error, { boundary: "root" });
    // Auto-recover from stale chunk errors (after preview rebuilds / deploys).
    // Throttle: at most one auto-reload per 10s to avoid loops.
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
              try { sessionStorage.removeItem(RELOAD_FLAG); } catch {}
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { title: "YURTA — посуточная аренда в Казахстане" },
      {
        name: "description",
        content:
          "YURTA — посуточная аренда жилья в Казахстане. Создайте заявку — и квартиры найдут вас сами.",
      },
      { name: "theme-color", content: "#9B1C1C" },
      { name: "application-name", content: "YURTA" },
      // iOS standalone PWA
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "YURTA" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "format-detection", content: "telephone=no" },
      { name: "apple-touch-fullscreen", content: "yes" },
      { name: "msapplication-TileColor", content: "#ffffff" },
      { property: "og:title", content: "YURTA — посуточная аренда в Казахстане" },
      { property: "og:description", content: "Квартиры ищут клиента, а не наоборот." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PushNotificationsMount() {
  usePushNotifications();
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();



  useEffect(() => {
    // Clear any stale chunk-reload flag from a previous session.
    try { sessionStorage.removeItem(RELOAD_FLAG); } catch {}
    installGlobalErrorHandlers();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Ignore TOKEN_REFRESHED / INITIAL_SESSION — they fire frequently and
      // would otherwise invalidate every query, causing visible refetch jank.
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
        <Onboarding />
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

