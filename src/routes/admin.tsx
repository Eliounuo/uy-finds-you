import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { Users, Home, CalendarCheck, CreditCard, Flag, Bell, LayoutDashboard, Activity } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userRes.user.id,
      _role: "admin",
    });
    if (error || !data) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

type Tab = { to: string; label: string; icon: typeof Users; exact?: boolean };
const TABS: Tab[] = [
  { to: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { to: "/admin/health", label: "Health", icon: Activity },
  { to: "/admin/users", label: "Юзеры", icon: Users },
  { to: "/admin/properties", label: "Объекты", icon: Home },
  { to: "/admin/bookings", label: "Брони", icon: CalendarCheck },
  { to: "/admin/payments", label: "Платежи", icon: CreditCard },
  { to: "/admin/complaints", label: "Жалобы", icon: Flag },
  { to: "/admin/alerts", label: "Алерты", icon: Bell },
];

function AdminLayout() {
  const loc = useLocation();


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
              to={t.to as "/admin"}
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
