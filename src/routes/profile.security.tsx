import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Loader2, Trash2, Eye, EyeOff, ShieldAlert, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isEmailUser = user?.identities?.some((i) => i.provider === "email") ?? false;
  const isPhoneUser = user?.identities?.some((i) => i.provider === "phone") ?? false;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 pb-2 pt-4 backdrop-blur-lg">
        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Безопасность</h1>
      </header>

      <main className="space-y-4 px-4 pt-4 pb-24">
        <ChangeEmailSection currentEmail={user?.email} isPhoneUser={isPhoneUser} />

        {isEmailUser ? (
          <ChangePasswordSection />
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3.5 ring-1 ring-border">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Пароль не используется — вход по SMS-коду.
            </p>
          </div>
        )}

        <DeleteAccountSection onDeleted={() => navigate({ to: "/auth" })} />
      </main>
    </div>
  );
}

function ChangeEmailSection({
  currentEmail,
  isPhoneUser,
}: {
  currentEmail?: string;
  isPhoneUser: boolean;
}) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Введите корректный email");
      return;
    }
    if (trimmed === currentEmail) {
      toast.error("Это уже ваш текущий email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setSent(true);
      toast.success("Подтвердите email — письмо отправлено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось обновить email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {isPhoneUser && !currentEmail ? "Добавить email" : "Email"}
      </h3>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        {sent ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Письмо отправлено на{" "}
              <span className="font-semibold text-foreground">{email}</span>. Перейдите по ссылке
              для подтверждения.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="border-b border-border px-4 py-3.5">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {currentEmail ? "Изменить email" : "Email для уведомлений"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-muted py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {!currentEmail && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Необязательно — используется для уведомлений и восстановления доступа.
                </p>
              )}
            </div>
            <div className="px-4 py-3">
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : currentEmail ? (
                  "Изменить email"
                ) : (
                  "Добавить email"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      toast.error("Минимум 6 символов");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Пароли не совпадают");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Пароль изменён");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Смена пароля
      </h3>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-card ring-1 ring-border"
      >
        <div className="border-b border-border px-4 py-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Новый пароль
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              placeholder="Минимум 6 символов"
              className="w-full rounded-xl bg-muted px-3 py-2.5 pr-10 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="border-b border-border px-4 py-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
              placeholder="Повторите пароль"
              className={cn(
                "w-full rounded-xl bg-muted px-3 py-2.5 pr-10 text-sm outline-none focus:ring-1",
                confirmPwd && confirmPwd !== newPwd
                  ? "ring-1 ring-destructive focus:ring-destructive"
                  : "focus:ring-primary",
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <button
            type="submit"
            disabled={submitting || !newPwd || !confirmPwd}
            className="flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сменить пароль"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteAccountSection({ onDeleted }: { onDeleted: () => void }) {
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const CONFIRM_WORD = "УДАЛИТЬ";

  const handleDelete = async () => {
    if (input !== CONFIRM_WORD) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Аккаунт удалён");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить аккаунт");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
        Опасная зона
      </h3>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-destructive/30">
        {step === "idle" ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-destructive">Удалить аккаунт</div>
              <div className="text-[11px] text-muted-foreground">
                Все данные удалятся без возможности восстановления
              </div>
            </div>
            <button
              onClick={() => setStep("confirm")}
              className="shrink-0 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
            >
              Удалить
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="text-sm font-bold">Подтверждение удаления</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Объявления, бронирования и история будут безвозвратно удалены. Введите{" "}
              <span className="font-mono font-bold text-destructive">{CONFIRM_WORD}</span> для
              подтверждения.
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="w-full rounded-xl bg-muted px-3 py-2.5 font-mono text-sm outline-none focus:ring-1 focus:ring-destructive"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep("idle");
                  setInput("");
                }}
                className="flex-1 rounded-full border border-border py-2 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || input !== CONFIRM_WORD}
                className="flex-1 rounded-full bg-destructive py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Удалить навсегда"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
