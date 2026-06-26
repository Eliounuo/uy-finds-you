import { useEffect, useState } from "react";
import {
  FileText,
  Inbox,
  KeyRound,
  User,
  Shield,
  MessageSquare,
  CalendarCheck,
  Bell,
  ArrowRight,
  X,
} from "lucide-react";
import { useApp } from "@/lib/app-mode";
import { isOnboardingDone, markOnboardingDone, type OnboardingRole } from "@/hooks/use-onboarding";

type Step = { icon: typeof FileText; title: string; text: string };

const tenantSteps: Step[] = [
  {
    icon: FileText,
    title: "Создайте заявку",
    text: "Расскажите за 30 секунд, какое жильё и на какие даты вам нужно.",
  },
  {
    icon: Inbox,
    title: "Получите предложения",
    text: "Владельцы сами пришлют офферы с ценами и фото. Сравните в одном экране.",
  },
  {
    icon: KeyRound,
    title: "Забронируйте",
    text: "Выберите лучший вариант — мы зафиксируем бронь и контакты хозяина.",
  },
  {
    icon: User,
    title: "Заполните профиль",
    text: "Профиль с фото и верификацией повышает шанс получить лучшие предложения.",
  },
];

const landlordSteps: Step[] = [
  {
    icon: Shield,
    title: "Пройдите верификацию",
    text: "Значок ✅ повышает доверие клиентов и приоритет ваших предложений.",
  },
  {
    icon: MessageSquare,
    title: "Отвечайте на заявки",
    text: "Смотрите ленту заявок арендаторов и отправляйте свои офферы.",
  },
  {
    icon: CalendarCheck,
    title: "Управляйте бронями",
    text: "Календарь занятости, подтверждения и отмены — всё в одном месте.",
  },
  {
    icon: Bell,
    title: "Включите уведомления",
    text: "Push и email — чтобы не пропустить новую заявку или сообщение.",
  },
];

export function OnboardingTour() {
  const { isLandlord } = useApp();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!isOnboardingDone()) setOpen(true);
  }, []);

  const role: OnboardingRole = isLandlord ? "landlord" : "tenant";
  const steps = role === "landlord" ? landlordSteps : tenantSteps;

  const finish = () => {
    markOnboardingDone();
    setOpen(false);
  };

  if (!open) return null;
  const Step = steps[i];
  const Icon = Step.icon;
  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-[#7F1D1D] to-[#450A0A] px-6 pb-10 pt-[max(env(safe-area-inset-top),2rem)] text-white">
      <div className="flex justify-between">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
          {role === "landlord" ? "Владельцу" : "Арендатору"}
        </span>
        <button
          onClick={finish}
          className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"
        >
          <X className="h-3 w-3" /> Пропустить
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white/15 backdrop-blur">
          <Icon className="h-12 w-12" />
        </div>
        <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] opacity-70">
          Шаг {i + 1} из {steps.length}
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight">{Step.title}</h2>
        <p className="mt-3 max-w-sm text-base opacity-90">{Step.text}</p>
      </div>

      <div className="flex items-center justify-center gap-2 pb-6">
        {steps.map((_, idx) => (
          <span
            key={idx}
            className={
              "h-1.5 rounded-full transition-all " +
              (idx === i ? "w-6 bg-white" : "w-1.5 bg-white/40")
            }
          />
        ))}
      </div>

      <button
        onClick={() => (last ? finish() : setI(i + 1))}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 font-display text-base font-bold text-[#7F1D1D]"
      >
        {last ? "Начать" : "Дальше"} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
