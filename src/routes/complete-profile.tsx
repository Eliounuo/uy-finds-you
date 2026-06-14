import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/lib/use-profile";
import {
  validateFullName,
  validatePhone,
  normalizePhone,
  isProfileComplete,
} from "@/lib/profile-validation";

export const Route = createFileRoute("/complete-profile")({
  component: CompleteProfile,
});

function CompleteProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, reload } = useProfile();
  const searchRaw = useRouterState({ select: (s) => s.location.search });
  const search = (searchRaw as unknown as Record<string, unknown>) ?? {};

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  // Redirect unauthenticated users to /auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  // Prefill from existing data (Apple full name, email, etc.)
  useEffect(() => {
    if (!profile && !user) return;
    const metaName =
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      "";
    const candidateName = profile?.full_name && !validateFullName(profile.full_name)
      ? profile.full_name
      : metaName && !validateFullName(metaName)
        ? metaName
        : "";
    setFullName((prev) => prev || candidateName);
    setPhone((prev) => prev || profile?.phone || "");
  }, [profile, user]);

  // If profile is already complete, bounce away (unless explicitly editing)
  useEffect(() => {
    if (profileLoading) return;
    if (profile && isProfileComplete(profile)) {
      const next = typeof search?.next === "string" ? (search.next as string) : "/";
      navigate({ to: next });
    }
  }, [profile, profileLoading, navigate, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const nameErr = validateFullName(fullName);
    const phoneErr = validatePhone(phone);
    setErrors({ name: nameErr ?? undefined, phone: phoneErr ?? undefined });
    if (nameErr || phoneErr) return;

    setSubmitting(true);
    try {
      const cleanName = fullName.trim().replace(/\s+/g, " ");
      const cleanPhone = normalizePhone(phone);
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, full_name: cleanName, phone: cleanPhone },
          { onConflict: "id" }
        );
      if (error) throw error;
      await reload();
      toast.success("Профиль готов");
      const next = typeof (search as Record<string, unknown>)?.next === "string"
        ? ((search as Record<string, string>).next as string)
        : "/";
      navigate({ to: next });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Завершите регистрацию
            </h1>
            <p className="text-xs text-muted-foreground">Нужно ещё пару данных</p>
          </div>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">
          Чтобы вы могли получать предложения и общаться с владельцами, заполните имя
          и номер телефона. Это обязательно.
        </p>

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
              placeholder="Например, Алия Нурланова"
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Номер телефона
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+7 700 123 45 67"
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
            />
            {errors.phone ? (
              <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                В международном формате, начиная с «+»
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Сохранить и продолжить"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Данные используются только для связи владельцев с вами по заявкам.
        </p>
      </div>
    </div>
  );
}
