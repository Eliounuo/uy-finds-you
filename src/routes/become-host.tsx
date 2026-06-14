import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Sparkles, Wallet, MessageSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { useApp } from "@/lib/app-mode";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/become-host")({
  component: BecomeHost,
});

function BecomeHost() {
  const { user, loading } = useAuth();
  const { isLandlord, activateLandlord, activatingLandlord } = useApp();
  const navigate = useNavigate();

  if (loading) {
    return (
      <>
        <AppHeader title="Сдача недвижимости" back />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  const handleActivate = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    try {
      await activateLandlord();
      toast.success("Режим арендодателя активирован");
      navigate({ to: "/owner" });
    } catch (e) {
      toast.error("Не удалось активировать. Попробуйте позже");
    }
  };

  return (
    <>
      <AppHeader title="Сдача недвижимости" back />
      <div className="space-y-6 px-4 pt-4 pb-32">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_22)] p-6 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Новый формат
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight">
            Начните сдавать недвижимость через платформу
          </h1>
          <p className="mt-2 text-sm opacity-90">
            Без отдельной регистрации — всё в одном аккаунте. Получайте заявки от
            проверенных арендаторов и управляйте календарём из одного места.
          </p>
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="space-y-2">
          <Benefit
            icon={MessageSquare}
            title="Заявки приходят сами"
            text="Арендаторы публикуют запросы — вы выбираете подходящих."
          />
          <Benefit
            icon={Calendar}
            title="Календарь и брони"
            text="Управляйте занятостью и подтверждайте бронирования."
          />
          <Benefit
            icon={Wallet}
            title="Прозрачные расчёты"
            text="История операций и баланс — всегда под рукой."
          />
          <Benefit
            icon={CheckCircle2}
            title="Один аккаунт"
            text="Ищите жильё и сдавайте своё — без переключения профилей."
          />
        </div>

        {isLandlord ? (
          <Link
            to="/owner"
            className="block rounded-full bg-primary py-4 text-center font-display text-base font-bold text-primary-foreground shadow-glow"
          >
            Перейти в кабинет владельца
          </Link>
        ) : (
          <button
            onClick={handleActivate}
            disabled={activatingLandlord}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-display text-base font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {activatingLandlord && <Loader2 className="h-4 w-4 animate-spin" />}
            Стать арендодателем
          </button>
        )}
        <p className="text-center text-[11px] text-muted-foreground">
          Активация бесплатна. Вы сможете вернуться в режим арендатора в любой момент.
        </p>
      </div>
    </>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="font-display font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
