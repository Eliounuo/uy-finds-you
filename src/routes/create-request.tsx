import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, CalendarDays, Users, Wallet, Sparkles, Check } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { formatKZT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create-request")({
  component: CreateRequest,
});

const cities = ["Астана", "Алматы", "Шымкент", "Караганда", "Актау"];
const guestsOptions = [1, 2, 3, 4, 5, "6+"];

function CreateRequest() {
  const navigate = useNavigate();
  const [city, setCity] = useState("Алматы");
  const [guests, setGuests] = useState<string | number>(2);
  const [budget, setBudget] = useState(25000);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    setDone(true);
    setTimeout(() => navigate({ to: "/requests" }), 1200);
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-success text-success-foreground">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">Заявка отправлена</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Владельцы получают вашу заявку и пришлют предложения в течение нескольких минут.
        </p>
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Новая заявка" back />
      <div className="space-y-5 px-4 pt-2 pb-32">
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-transparent p-4 ring-1 ring-primary/20">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> 30 секунд
          </div>
          <p className="mt-1 text-sm text-foreground">
            Опишите, что вы хотите — владельцы пришлют предложения сами.
          </p>
        </div>

        <Section icon={MapPin} title="Город">
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                  c === city
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={CalendarDays} title="Даты">
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="text-[11px] uppercase text-muted-foreground">Заезд</div>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="text-[11px] uppercase text-muted-foreground">Выезд</div>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>
        </Section>

        <Section icon={Users} title="Гостей">
          <div className="flex flex-wrap gap-2">
            {guestsOptions.map((g) => (
              <button
                key={g}
                onClick={() => setGuests(g)}
                className={cn(
                  "h-11 w-11 rounded-full text-sm font-semibold",
                  g === guests
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Wallet} title={`Бюджет до ${formatKZT(budget)} / ночь`}>
          <input
            type="range"
            min={5000}
            max={100000}
            step={1000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>5 000 ₸</span>
            <span>100 000 ₸</span>
          </div>
        </Section>

        <Section title="Пожелания (необязательно)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Например: тихий двор, рядом метро, можно с животным…"
            rows={3}
            className="w-full resize-none rounded-xl bg-card p-3 text-sm outline-none ring-1 ring-border placeholder:text-muted-foreground"
          />
        </Section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-lg">
        <button
          onClick={submit}
          className="w-full rounded-full bg-primary py-3.5 font-display text-base font-bold text-primary-foreground shadow-glow"
        >
          Отправить заявку
        </button>
      </div>
    </>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
