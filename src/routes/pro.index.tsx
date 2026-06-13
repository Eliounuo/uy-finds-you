import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, MoreVertical, TrendingUp, CalendarDays, MessageCircle, Building2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { proProperties, formatKZT, incomingRequests } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/")({
  component: ProDashboard,
});

function ProDashboard() {
  return (
    <>
      <AppHeader showModeSwitcher />
      <div className="space-y-5 px-4 pt-2 pb-32">
        <div>
          <h1 className="font-display text-2xl font-bold">Добрый день, Айгерим</h1>
          <p className="text-sm text-muted-foreground">Сегодня у вас 2 заезда</p>
        </div>

        {/* Stat cards 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Выручка / мес" value="412 000 ₸" hint="+18%" tone="primary" />
          <StatCard label="Загрузка" value="74%" hint="июнь" />
          <StatCard label="Заявок ждут" value={String(incomingRequests.length)} hint="новых" tone="primary" />
          <StatCard label="Рейтинг" value="4.9" hint="42 отзыва" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          <Quick to="/pro/calendar" icon={CalendarDays} label="Календарь" />
          <Quick to="/pro/requests" icon={Building2} label="Заявки" />
          <Quick to="/pro/chat" icon={MessageCircle} label="Чат" />
          <Quick to="/pro/stats" icon={TrendingUp} label="Аналитика" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <h3 className="font-display text-lg font-bold">Мои объекты</h3>
          <button className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
            <Plus className="h-3.5 w-3.5" />
            Добавить
          </button>
        </div>

        <div className="space-y-3">
          {proProperties.map((p) => (
            <Link
              key={p.id}
              to="/property/$id"
              params={{ id: p.id }}
              className="flex gap-3 rounded-2xl bg-card p-2 shadow-card ring-1 ring-border"
            >
              <img src={p.images[0]} alt={p.title} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="truncate font-display font-bold">{p.title}</h4>
                  <button className="-mt-1 -mr-1 p-1 text-muted-foreground" onClick={(e) => e.preventDefault()}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">{p.city}, {p.district}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-base font-bold text-primary">{formatKZT(p.price)}</span>
                  <span className="text-[11px] text-muted-foreground">/ ночь</span>
                </div>
                <div className="mt-1 flex gap-1.5">
                  <Tag color="success">Активен</Tag>
                  <Tag>★ {p.rating}</Tag>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "primary";
}) {
  return (
    <div
      className={
        "rounded-2xl p-4 ring-1 " +
        (tone === "primary"
          ? "bg-foreground text-background ring-foreground"
          : "bg-card text-foreground ring-border")
      }
    >
      <div className="text-[11px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] opacity-70">{hint}</div>}
    </div>
  );
}

function Quick({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 ring-1 ring-border"
    >
      <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: "success" }) {
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
        (color === "success" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")
      }
    >
      {children}
    </span>
  );
}
