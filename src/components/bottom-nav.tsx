import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Map as MapIcon,
  Heart,
  MessageCircle,
  User,
  Inbox,
  Building2,
  CalendarDays,
  BarChart3,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-mode";

const liteTabsBase = [
  { to: "/", labelKey: "nav.home", icon: Home, exact: true },
  { to: "/map", labelKey: "nav.map", icon: MapIcon },
  { to: "/requests", labelKey: "nav.requests", icon: Inbox },
  { to: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  { to: "/profile", labelKey: "nav.profile", icon: User },
];

const proTabsBase = [
  { to: "/pro", labelKey: "nav.properties", icon: Building2, exact: true },
  { to: "/pro/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { to: "/pro/requests", labelKey: "nav.requests", icon: Inbox },
  { to: "/pro/chat", labelKey: "nav.chat", icon: MessageCircle },
  { to: "/pro/stats", labelKey: "nav.analytics", icon: BarChart3 },
  { to: "/profile", labelKey: "nav.profile", icon: User },
];


const HIDDEN_PATTERNS = [
  /^\/auth$/,
  /^\/complete-profile$/,
  /^\/profile\/edit$/,
  /^\/profile\/theme$/,
  /^\/profile\/language$/,
  /^\/create-request$/,
  /^\/become-host$/,
  /^\/chat\/[^/]+$/,
  /^\/pro\/properties(\/|$)/,
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { mode } = useApp();
  const { t } = useTranslation();

  if (HIDDEN_PATTERNS.some((re) => re.test(pathname))) return null;
  const inProArea = mode === "pro";
  const tabs = inProArea ? proTabsBase : liteTabsBase;


  return (
    <nav className="safe-bottom sticky bottom-0 z-30 mt-auto border-t border-border bg-card/95 px-2 pt-2 backdrop-blur-lg">
      <ul className={cn("grid", tabs.length === 6 ? "grid-cols-6" : "grid-cols-5")}>
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className="truncate">{t(tab.labelKey)}</span>

                {active && <span className="-mt-0.5 h-1 w-1 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function FavoritesTab() {
  return (
    <Link
      to="/favorites"
      className="fixed bottom-24 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-pop ring-1 ring-border"
      aria-label="Избранное"
    >
      <Heart className="h-5 w-5" />
    </Link>
  );
}
