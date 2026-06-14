import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  LogIn,
  Home as HomeIcon,
  CheckCircle2,
  ArrowRight,
  Pencil,
  UserCircle2,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { useApp } from "@/lib/app-mode";
import { useAuth } from "@/lib/use-auth";
import { useAvatarUrl, useProfile } from "@/lib/use-profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/")({
  component: Profile,
});

function Profile() {
  const { isLandlord, setMode } = useApp();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const displayName = profile?.full_name?.trim() || "Гость";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    navigate({ to: "/auth" });
  };

  return (
    <>
      <AppHeader title="Профиль" />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_22)] p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-background/20 backdrop-blur">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : user ? (
                <div className="grid h-full w-full place-items-center font-display text-xl font-bold">
                  {initial}
                </div>
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <UserCircle2 className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-bold">{displayName}</div>
              <div className="truncate text-xs opacity-85">
                {profile?.phone || user?.email || "Войдите, чтобы создавать заявки"}
              </div>
            </div>
            {user && (
              <Link
                to="/profile/edit"
                aria-label="Редактировать профиль"
                className="grid h-9 w-9 place-items-center rounded-full bg-background/20 backdrop-blur"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            )}
          </div>
          {user ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                <HomeIcon className="h-3 w-3" /> Арендатор
              </span>
              {isLandlord && (
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-bold text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Арендодатель активирован
                </span>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-bold text-primary"
            >
              <LogIn className="h-3.5 w-3.5" /> Войти или зарегистрироваться
            </Link>
          )}
        </div>

        {user && (
          <Section title="Профиль">
            <Row icon={Pencil} label="Редактировать профиль" to="/profile/edit" />
          </Section>
        )}

        {/* Сдача недвижимости */}
        <Section title="Сдача недвижимости">
          {!isLandlord ? (
            <Link
              to="/become-host"
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                🏠
              </div>
              <div className="flex-1">
                <div className="font-display font-bold">Сдача недвижимости</div>
                <div className="text-xs text-muted-foreground">
                  Зарабатывайте на своей квартире
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ) : (
            <button
              onClick={() => {
                setMode("pro");
                navigate({ to: "/owner" });
              }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold">🏢 Кабинет владельца</div>
                <div className="text-xs text-muted-foreground">
                  Объекты, заявки, баланс
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </Section>

        <Section title="Активность">
          <Row icon={Heart} label="Избранное" to="/favorites" />
          <Row icon={CalendarRange} label="Бронирования" to="/bookings" />
          <Row icon={Star} label="Мои отзывы" />
        </Section>

        <Section title="Аккаунт">
          <Row icon={Shield} label="Безопасность" />
          <Row icon={Settings} label="Настройки" />
          <Row icon={Moon} label="Тема" to="/profile/theme" />
          <Row icon={HelpCircle} label="Поддержка" />
        </Section>

        {user && (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card p-4 text-sm font-semibold text-destructive ring-1 ring-border"
          >
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        )}

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
