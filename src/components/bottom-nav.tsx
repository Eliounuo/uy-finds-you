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

import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-mode";

const liteTabs = [
  { to: "/", label: "Главная", icon: Home, exact: true },
  { to: "/map", label: "Карта", icon: MapIcon },
  { to: "/requests", label: "Заявки", icon: Inbox },
  { to: "/chat", label: "Чат", icon: MessageCircle },
  { to: "/profile", label: "Профиль", icon: User },
];

const proTabs = [
  { to: "/pro", label: "Объекты", icon: Building2, exact: true },
  { to: "/pro/calendar", label: "Календарь", icon: CalendarDays },
  { to: "/pro/requests", label: "Заявки", icon: Inbox },
  { to: "/pro/chat", label: "Чат", icon: MessageCircle },
  { to: "/pro/stats", label: "Аналитика", icon: BarChart3 },
  { to: "/profile", label: "Профиль", icon: User },
];

const HIDDEN_PATTERNS = [
  /^\/auth$/,
  /^\/complete-profile$/,
  /^\/profile\/edit$/,
  /^\/profile\/theme$/,
  /^\/create-request$/,
  /^\/become-host$/,
  /^\/chat\/[^/]+$/,
  /^\/pro\/properties(\/|$)/,
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { mode } = useApp();
  if (HIDDEN_PATTERNS.some((re) => re.test(pathname))) return null;
  const inProArea = mode === "pro";
  const tabs = inProArea ? proTabs : liteTabs;


  return (
    <nav className="safe-bottom sticky bottom-0 z-30 mt-auto border-t border-border bg-card/95 px-2 pt-2 backdrop-blur-lg">
      <ul className={cn("grid", tabs.length === 6 ? "grid-cols-6" : "grid-cols-5")}>
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className="truncate">{t.label}</span>
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
