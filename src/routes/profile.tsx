import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  CalendarRange,
  Star,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  Building2,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useApp } from "@/lib/app-mode";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { mode, setMode } = useApp();

  return (
    <>
      <AppHeader title="Профиль" showModeSwitcher />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_22)] p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-background/20 font-display text-xl font-bold backdrop-blur">
              А
            </div>
            <div>
              <div className="font-display text-lg font-bold">Айбек</div>
              <div className="text-xs opacity-85">+7 777 ••• 4521</div>
            </div>
          </div>
          <button className="mt-3 rounded-full bg-background/20 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            Войти через JaSyn ID
          </button>
        </div>

        <button
          onClick={() => setMode(mode === "lite" ? "pro" : "lite")}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">
              Переключиться в UY {mode === "lite" ? "Pro" : "Lite"}
            </div>
            <div className="text-xs text-muted-foreground">
              {mode === "lite" ? "Сдаёте жильё? Управляйте объектами." : "Снимайте жильё."}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <Section title="Активность">
          <Row icon={Heart} label="Избранное" to="/favorites" />
          <Row icon={CalendarRange} label="Бронирования" to="/bookings" />
          <Row icon={Star} label="Мои отзывы" />
        </Section>

        <Section title="Аккаунт">
          <Row icon={Shield} label="Безопасность" />
          <Row icon={Settings} label="Настройки" />
          <Row icon={HelpCircle} label="Поддержка" />
        </Section>

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card p-4 text-sm font-semibold text-destructive ring-1 ring-border">
          <LogOut className="h-4 w-4" /> Выйти
        </button>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">UY · v0.1 MVP</p>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return <button className="w-full text-left">{content}</button>;
}
