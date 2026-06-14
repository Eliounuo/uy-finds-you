import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Inbox,
  Send,
  Wallet,
  History,
  Settings,
  ChevronRight,
  Home as HomeIcon,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useApp } from "@/lib/app-mode";
import { useAuth } from "@/lib/use-auth";
import { myPropertiesQuery, ownerBookingsQuery } from "@/lib/queries";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/owner")({
  component: OwnerCabinet,
});

function OwnerCabinet() {
  const { user } = useAuth();
  const { isLandlord, setMode } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setMode("pro");
  }, [setMode]);

  useEffect(() => {
    if (user && !isLandlord) navigate({ to: "/become-host" });
  }, [user, isLandlord, navigate]);

  const { data: props = [] } = useQuery(myPropertiesQuery(user?.id ?? null));
  const { data: bookings = [] } = useQuery(ownerBookingsQuery(user?.id ?? null));
  const revenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.total_price, 0);

  const items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    to?: string;
    onClick?: () => void;
    hint?: string;
  }[] = [
    { icon: Building2, label: "Мои квартиры", to: "/pro", hint: `${props.length} объектов` },
    { icon: Plus, label: "Добавить квартиру", to: "/pro/properties/new" },
    { icon: Inbox, label: "Заявки клиентов", to: "/pro/requests" },
    { icon: Send, label: "Предложения", to: "/pro/requests" },
    { icon: Wallet, label: "Баланс", hint: formatKZT(revenue) },
    { icon: History, label: "История операций" },
    { icon: Settings, label: "Настройки владельца" },
  ];

  return (
    <>
      <AppHeader title="Кабинет владельца" />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_22)] p-5 text-primary-foreground shadow-glow">
          <div className="text-[11px] font-semibold uppercase tracking-widest opacity-90">
            Арендодатель · активирован
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Stat label="Объектов" value={String(props.length)} />
            <Stat label="Доход" value={formatKZT(revenue)} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {items.map((it, i) => {
            const Icon = it.icon;
            const content = (
              <div
                className={
                  "flex items-center gap-3 px-4 py-3.5" +
                  (i < items.length - 1 ? " border-b border-border" : "")
                }
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-sm font-semibold">{it.label}</span>
                {it.hint && (
                  <span className="text-xs font-medium text-muted-foreground">{it.hint}</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            );
            if (it.to) return <Link key={it.label} to={it.to}>{content}</Link>;
            return (
              <button
                key={it.label}
                onClick={it.onClick}
                className="block w-full text-left"
              >
                {content}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setMode("lite");
            navigate({ to: "/" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card p-3.5 text-sm font-semibold text-muted-foreground ring-1 ring-border"
        >
          <HomeIcon className="h-4 w-4" /> Вернуться к поиску жилья
        </button>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/15 p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wider opacity-85">{label}</div>
      <div className="mt-0.5 font-display text-lg font-bold">{value}</div>
    </div>
  );
}
