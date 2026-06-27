import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Введите корректный email").max(255);
const passwordSchema = z.string().min(6, "Минимум 6 символов").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setModeTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
    const email = resetEmail.trim();
    if (!email) {
      toast.error("Введите email");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success(`Ссылка для сброса пароля отправлена на ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0]?.message ?? "Проверьте данные");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Добро пожаловать!");
          navigate({ to: "/" });
        } else {
          toast.success(
            "Аккаунт создан — проверьте почту и перейдите по ссылке для подтверждения.",
            { duration: 6000 },
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already registered") || msg.includes("already")) {
        toast.error("Email уже зарегистрирован — попробуйте войти");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Email не подтверждён — проверьте почту и перейдите по ссылке");
      } else if (msg.includes("Invalid login credentials")) {
        toast.error("Неверный email или пароль");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-6">
      <Link
        to="/"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="mt-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {mode === "signin" ? "С возвращением" : "Создайте аккаунт"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Войдите, чтобы продолжить" : "Зарегистрируйтесь за 30 секунд"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-full bg-card p-1 ring-1 ring-border">
        {(["signin", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setModeTab(t)}
            className={`rounded-full py-2 text-sm font-semibold transition ${
              mode === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "signin" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>

      <form onSubmit={handleEmail} className="mt-6 space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
          />
        )}
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          required
          className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
        />
        <input
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={72}
          required
          className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            "Войти"
          ) : (
            "Создать аккаунт"
          )}
        </button>
      </form>

      {mode === "signin" && (
        <div className="mt-3">
          {!showReset ? (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-xs font-semibold text-primary"
            >
              Забыли пароль?
            </button>
          ) : (
            <div className="space-y-2 rounded-2xl bg-card p-3 ring-1 ring-border">
              <input
                type="email"
                inputMode="email"
                placeholder="Email для сброса"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full rounded-xl bg-background px-3 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetLoading || resetSent}
                  className="flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground disabled:opacity-60"
                >
                  {resetLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : resetSent ? (
                    "Отправлено"
                  ) : (
                    "Отправить ссылку"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setResetSent(false);
                    setResetEmail("");
                  }}
                  className="h-10 rounded-full px-4 text-xs font-semibold text-muted-foreground"
                >
                  Отмена
                </button>
              </div>
              {resetSent && (
                <p className="text-[11px] text-muted-foreground">
                  Ссылка для сброса пароля отправлена на {resetEmail}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Продолжая, вы соглашаетесь с условиями использования и политикой YURTA.
      </p>
    </div>
  );
}
