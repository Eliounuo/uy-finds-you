import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { normalizePhone, validatePhone } from "@/lib/profile-validation";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

// BUG-01 fix: no leading space — was " (" causing "+7  (747)"
function formatPhoneDigits(digits: string): string {
  let out = "";
  if (digits.length > 0) out += "(" + digits.slice(0, 3);
  if (digits.length >= 3) out += ") " + digits.slice(3, 6);
  if (digits.length >= 6) out += "-" + digits.slice(6, 8);
  if (digits.length >= 8) out += "-" + digits.slice(8, 10);
  return out;
}

const RESEND_COOLDOWN = 60;

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phoneDigits, setPhoneDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  // BUG-03 fix: cooldown prevents SMS spam
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  // BUG-03: countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const normalizedPhone = normalizePhone("+7" + phoneDigits);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePhone(normalizedPhone);
    if (err || phoneDigits.length < 10) {
      toast.error("Введите номер телефона в формате +7 700 123 45 67");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
      if (error) throw error;
      setOtpPending(true);
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.includes("rate limit") ? "Слишком много запросов, подождите немного" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
      if (error) throw error;
      setResendCooldown(RESEND_COOLDOWN);
      toast.success("Код отправлен повторно");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.includes("rate limit") ? "Слишком много запросов, подождите немного" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success("Добро пожаловать!");
      navigate({ to: "/" });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Неверный код или срок действия истёк";
      toast.error(msg.includes("invalid") || msg.includes("Invalid") ? "Неверный код" : msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const maskedPhone =
    "+7 (" +
    phoneDigits.slice(0, 3) +
    ") " +
    phoneDigits.slice(3, 6) +
    "-**-" +
    phoneDigits.slice(8, 10);

  if (otpPending) {
    return (
      <div className="h-dvh overflow-hidden bg-background flex flex-col px-5">
        <div className="shrink-0" style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}>
          <button
            type="button"
            onClick={() => {
              setOtpPending(false);
              setOtp("");
            }}
            className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Введите код</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Отправили SMS на <span className="font-semibold text-foreground">{maskedPhone}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              autoFocus
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-center text-2xl font-bold tracking-widest ring-1 ring-border outline-none focus:ring-primary"
            />
            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подтвердить"}
            </button>
          </form>

          {/* BUG-04 fix: delivery hint so user knows what to do */}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Код приходит в течение 1 минуты. Проверьте папку «Спам».
          </p>

          {/* BUG-03 fix: cooldown prevents SMS spam, shows countdown */}
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="mt-3 w-full text-center text-xs font-semibold text-primary disabled:opacity-50"
          >
            {loading
              ? "Отправляем..."
              : resendCooldown > 0
                ? `Отправить повторно через ${resendCooldown} с`
                : "Отправить код повторно"}
          </button>
        </div>

        <p className="pb-6 shrink-0 text-center text-[11px] text-muted-foreground">
          Код действителен 5 минут
        </p>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-background flex flex-col px-5">
      <div className="shrink-0" style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}>
        <Link
          to="/"
          className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-6">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Phone className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Войти или создать аккаунт
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Введите номер — пришлём код подтверждения по SMS
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-3">
          <div className="flex items-center overflow-hidden rounded-2xl bg-card ring-1 ring-border focus-within:ring-primary">
            {/* BUG-01/05 fix: pr-2 + formatPhoneDigits starts with "(" not " (" */}
            <span className="shrink-0 pl-4 pr-2 text-sm font-semibold text-foreground select-none">
              +7
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="700 123 45 67"
              value={formatPhoneDigits(phoneDigits)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhoneDigits(digits);
              }}
              className="flex-1 bg-transparent py-3.5 pr-4 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || phoneDigits.length < 10}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Получить код по SMS"}
          </button>
        </form>
      </div>

      <p className="pb-6 shrink-0 text-center text-[11px] text-muted-foreground">
        Продолжая, вы соглашаетесь с условиями использования и политикой YURTA.
      </p>
    </div>
  );
}
