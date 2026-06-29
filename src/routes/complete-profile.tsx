import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile, useProfileCache } from "@/lib/use-profile";
import { validateFullName, normalizePhone, isProfileComplete } from "@/lib/profile-validation";

export const Route = createFileRoute("/complete-profile")({
  component: CompleteProfile,
});

function CompleteProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { setProfile: setCachedProfile } = useProfileCache();
  const searchRaw = useRouterState({ select: (s) => s.location.search });
  const search = (searchRaw as unknown as Record<string, unknown>) ?? {};

  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameErr, setNameErr] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile && !user) return;
    const metaName =
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      "";
    const candidate =
      profile?.full_name && !validateFullName(profile.full_name)
        ? profile.full_name
        : metaName && !validateFullName(metaName)
          ? metaName
          : "";
    setFullName((prev) => prev || candidate);
  }, [profile, user]);

  useEffect(() => {
    if (profileLoading) return;
    if (profile && isProfileComplete(profile)) {
      const next = typeof search?.next === "string" ? search.next : "/";
      navigate({ to: next });
    }
  }, [profile, profileLoading, navigate, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const err = validateFullName(fullName);
    setNameErr(err ?? undefined);
    if (err) return;

    setSubmitting(true);
    try {
      const cleanName = fullName.trim().replace(/\s+/g, " ");
      const phone = user.phone ? normalizePhone(user.phone) : null;

      const { data: updated, error: updateErr } = await supabase
        .from("profiles")
        .update({ full_name: cleanName, ...(phone ? { phone } : {}) })
        .eq("id", user.id)
        .select("id");
      if (updateErr) {
        toast.error(updateErr.message || `Ошибка ${updateErr.code}`);
        return;
      }

      if (!updated || updated.length === 0) {
        const { error: insertErr } = await supabase
          .from("profiles")
          .insert({ id: user.id, full_name: cleanName, ...(phone ? { phone } : {}) });
        if (insertErr) {
          toast.error(insertErr.message || `Ошибка ${insertErr.code}`);
          return;
        }
      }

      // Push confirmed save into shared TanStack Query cache immediately —
      // ProfileGate reads the same cache and won't redirect.
      setCachedProfile({ full_name: cleanName, ...(phone ? { phone } : {}) });

      toast.success("Профиль готов!");
      const next = typeof search?.next === "string" ? search.next : "/";
      navigate({ to: next });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Не удалось сохранить профиль";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="h-dvh overflow-hidden grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-background flex flex-col px-5">
      <div
        className="shrink-0"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Завершите регистрацию
              </h1>
              <p className="text-xs text-muted-foreground">Осталось указать ваше имя</p>
            </div>
          </div>

          {user?.phone && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 ring-1 ring-border">
              <span className="text-sm text-muted-foreground">Телефон:</span>
              <span className="text-sm font-semibold">{user.phone}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Имя и фамилия
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                autoComplete="name"
                autoFocus
                placeholder="Например, Алия Нурланова"
                className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
              />
              {nameErr && <p className="mt-1.5 text-xs text-destructive">{nameErr}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить и продолжить"}
            </button>
          </form>
        </div>
      </div>

      <p className="pb-6 shrink-0 text-center text-[11px] text-muted-foreground">
        Имя отображается владельцам, к которым вы обращаетесь по заявкам.
      </p>
    </div>
  );
}
