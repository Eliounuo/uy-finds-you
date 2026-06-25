import { useEffect, useState } from "react";
import { FileText, Inbox, KeyRound, ArrowRight } from "lucide-react";

const FLAG = "uy_onboarding_v1";

const steps = [
  {
    icon: FileText,
    title: "Создайте заявку",
    text: "Расскажите за 30 секунд, какое жильё и на какие даты вам нужно.",
  },
  {
    icon: Inbox,
    title: "Получите офферы",
    text: "Владельцы сами пришлют предложения с ценами и фото. Сравнивайте.",
  },
  {
    icon: KeyRound,
    title: "Заезжайте",
    text: "Выбираете лучший вариант — мы фиксируем бронь и контакты хозяина.",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(FLAG)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(FLAG, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;
  const Step = steps[i];
  const Icon = Step.icon;
  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-[#7F1D1D] to-[#450A0A] px-6 pb-10 pt-[max(env(safe-area-inset-top),2rem)] text-white">
      <div className="flex justify-end">
        <button
          onClick={finish}
          className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"
        >
          Пропустить
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
