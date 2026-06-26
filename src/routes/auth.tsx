import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Готово! Проверьте почту для подтверждения.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка";
      toast.error(msg.includes("already") ? "Email уже зарегистрирован" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Не удалось войти через Apple");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch {
      toast.error("Ошибка входа через Apple");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-6">
      <Link to="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border">
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        или
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={handleApple}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 16.07c-.42.95-.6 1.37-1.13 2.21-.73 1.18-1.78 2.65-3.07 2.66-1.15.01-1.44-.75-3-.74-1.56.01-1.88.75-3.03.74-1.3-.01-2.28-1.34-3.02-2.52C5.04 16.5 4.84 12.16 6.51 9.95c1.18-1.56 3.04-2.48 4.78-2.48 1.78 0 2.9.98 4.38.98 1.42 0 2.29-.98 4.34-.98 1.55 0 3.18.85 4.34 2.32-3.81 2.09-3.19 7.54.51 7.71z" />
        </svg>
        Продолжить с Apple
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Продолжая, вы соглашаетесь с условиями использования и политикой UY.
      </p>
    </div>
  );
}
