import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/lib/use-profile";
import { validateFullName, normalizePhone, isProfileComplete } from "@/lib/profile-validation";

export const Route = createFileRoute("/complete-profile")({
  component: CompleteProfile,
});

function CompleteProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const searchRaw = useRouterState({ select: (s) => s.location.search });
  const search = (searchRaw as unknown as Record<string, unknown>) ?? {};

  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameErr, setNameErr] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  // Prefill name from existing data or auth metadata
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

  // Bounce if already complete
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
      // Phone comes from phone auth — sync it to the profiles table
      const phone = user.phone ? normalizePhone(user.phone) : null;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: cleanName, ...(phone ? { phone } : {}) })
        .eq("id", user.id);
      if (error) {
        toast.error(error.message || `Ошибка ${error.code}`);
        return;
      }
      toast.success("Профиль готов!");
      const next = typeof search?.next === "string" ? search.next : "/";
      window.location.assign(next);
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
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-5 pb-10 pt-10">
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

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

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Имя отображается владельцам, к которым вы обращаетесь по заявкам.
        </p>
      </div>
    </div>
  );
}
