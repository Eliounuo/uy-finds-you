import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically.
    // Give it a tick, then check the session.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
      setChecking(false);
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setChecking(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Минимум 8 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Пароль успешно изменён");
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background px-5 pt-10">
        <h1 className="font-display text-2xl font-bold">Ссылка недействительна</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Срок действия ссылки истёк. Запросите новую на странице входа.
        </p>
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          К входу
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-10">
      <h1 className="font-display text-2xl font-bold">Новый пароль</h1>
      <p className="mt-2 text-sm text-muted-foreground">Введите новый пароль для вашего аккаунта.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Новый пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Повторите пароль"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
          className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}
