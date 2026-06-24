import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Loader2, Users, Home, CalendarCheck, CreditCard, Flag, Bell, LayoutDashboard } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const isAdminQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) throw error;
      return !!data;
    },
  });

type Tab = { to: string; label: string; icon: typeof Users; exact?: boolean };
const TABS: Tab[] = [
  { to: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Юзеры", icon: Users },
  { to: "/admin/properties", label: "Объекты", icon: Home },
  { to: "/admin/bookings", label: "Брони", icon: CalendarCheck },
  { to: "/admin/payments", label: "Платежи", icon: CreditCard },
  { to: "/admin/complaints", label: "Жалобы", icon: Flag },
  { to: "/admin/alerts", label: "Алерты", icon: Bell },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useQuery(isAdminQuery(user?.id ?? null));
  const loc = useLocation();

  if (loading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return (
      <>
        <AppHeader title="Админ" back />
        <div className="px-4 pt-10 text-center text-sm text-muted-foreground">
          Доступ только для администраторов.
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Админ-панель" back />
      <nav className="sticky top-[52px] z-20 -mt-1 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
        {TABS.map((t) => {
          const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-border ${
                active ? "bg-primary text-primary-foreground ring-primary" : "bg-card"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pt-3 pb-32">
        <Outlet />
      </div>
    </>
  );
}
