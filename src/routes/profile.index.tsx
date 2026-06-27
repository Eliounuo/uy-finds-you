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
  Languages,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/app-header";
import { useApp } from "@/lib/app-mode";
import { useAuth } from "@/lib/use-auth";
import { useAvatarUrl, useProfile } from "@/lib/use-profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/")({
  component: Profile,
});

function Profile() {
  const { isLandlord, mode, setMode } = useApp();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: isAdmin } = useQuery(
    queryOptions({
      queryKey: ["is-admin", user?.id ?? null],
      enabled: !!user,
      staleTime: 60_000,
      queryFn: async () => {
        if (!user) return false;
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        return !!data;
      },
    }),
  );

  const displayName = profile?.full_name?.trim() || t("common.guest");
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("common.signOut"));
    navigate({ to: "/auth" });
  };

  return (
    <>
      <AppHeader title={t("profile.title")} />

      <div className="space-y-4 px-4 pt-2 pb-32">
        <div className="rounded-2xl bg-gradient-to-br from-[#7F1D1D] to-[#450A0A] p-4 text-white">
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
                {profile?.phone || user?.email || t("profile.loginPrompt")}
              </div>
              {profile?.public_id && (
                <div className="mt-0.5 font-mono text-[10px] tracking-wider opacity-70">
                  ID: {profile.public_id}
                </div>
              )}
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
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow ring-2 ring-white/20"
            >
              <LogIn className="h-3.5 w-3.5" /> {t("profile.loginCta")}
            </Link>
          )}
        </div>

        {user && (
          <Section title={t("profile.sections.profile")}>
            <Row icon={Pencil} label={t("profile.editProfile")} to="/profile/edit" />
          </Section>
        )}

        <Section title={t("profile.sections.renting")}>
          {!isLandlord ? (
            <Link to="/become-host" className="flex items-center gap-3 px-4 py-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                🏠
              </div>
              <div className="flex-1">
                <div className="font-display font-bold">{t("profile.becomeHost")}</div>
                <div className="text-xs text-muted-foreground">{t("profile.becomeHostHint")}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="font-display text-sm font-bold">{t("profile.modeTitle")}</div>
                    <div className="text-[11px] text-muted-foreground">{t("profile.modeHint")}</div>
                  </div>
                </div>
                <div className="relative grid grid-cols-2 rounded-xl bg-muted p-1">
                  <div
                    className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-background shadow-sm ring-1 ring-border transition-transform duration-300"
                    style={{
                      transform: mode === "pro" ? "translateX(calc(100% + 4px))" : "translateX(0)",
                    }}
                  />
                  <button
                    onClick={() => setMode("lite")}
                    className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                      mode === "lite" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <HomeIcon className="h-3.5 w-3.5" /> {t("profile.modeClient")}
                  </button>
                  <button
                    onClick={() => setMode("pro")}
                    className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                      mode === "pro" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> {t("profile.modeOwner")}
                  </button>
                </div>
              </div>
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
                  <div className="font-display font-bold">🏢 {t("profile.ownerCabinet")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("profile.ownerCabinetHint")}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </>
          )}
        </Section>

        <Section title={t("profile.sections.activity")}>
          <Row icon={Heart} label={t("profile.favorites")} to="/favorites" />
          <Row icon={CalendarRange} label={t("profile.bookings")} to="/bookings" />
          <Row icon={Star} label={t("profile.myReviews")} />
        </Section>

        <Section title={t("profile.sections.account")}>
          <Row icon={Shield} label={t("profile.verification")} to="/profile/verification" />
          <Row icon={Settings} label={t("profile.settings")} to="/profile/notifications" />
          <Row icon={Lock} label="Безопасность" to="/profile/security" />
          <Row icon={Languages} label={t("profile.languageRow")} to="/profile/language" />
          <Row icon={Moon} label={t("profile.theme")} to="/profile/theme" />
          <Row icon={HelpCircle} label={t("profile.support")} to="/profile/support" />
        </Section>

        {isAdmin && (
          <Section title={t("profile.sections.admin")}>
            <Row icon={Shield} label={t("profile.adminPanel")} to="/admin" />
            <Row icon={AlertTriangle} label={t("profile.adminAlerts")} to="/admin/alerts" />
          </Section>
        )}

        {user && (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card p-4 text-sm font-semibold text-destructive ring-1 ring-border"
          >
            <LogOut className="h-4 w-4" /> {t("profile.signOutBtn")}
          </button>
        )}

        <p className="pt-2 text-center text-[11px] text-muted-foreground">YURTA · v0.1 MVP</p>
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
