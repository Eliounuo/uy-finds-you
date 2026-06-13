import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { reviews } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/stats")({
  component: ProStats,
});

// Mock month data
const months = [
  { m: "Янв", v: 240 },
  { m: "Фев", v: 290 },
  { m: "Мар", v: 320 },
  { m: "Апр", v: 280 },
  { m: "Май", v: 380 },
  { m: "Июн", v: 412 },
];

function ProStats() {
  const max = Math.max(...months.map((x) => x.v));

  return (
    <>
      <AppHeader title="Аналитика" />
      <div className="space-y-5 px-4 pt-2 pb-32">
        <div className="grid grid-cols-2 gap-3">
          <Big label="Выручка / 6 мес" value="1.92 М ₸" delta="+24%" up />
          <Big label="Бронирований" value="47" delta="+12%" up />
          <Big label="Сред. чек" value="40 800 ₸" delta="-3%" />
          <Big label="Загрузка" value="74%" delta="+8%" up />
        </div>

        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-bold">Выручка по месяцам</h3>
            <span className="text-xs text-muted-foreground">тыс ₸</span>
          </div>
          <div className="mt-4 flex h-40 items-end gap-2">
            {months.map((m) => (
              <div key={m.m} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary to-[oklch(0.55_0.22_22)]"
                  style={{ height: `${(m.v / max) * 100}%` }}
                />
                <div className="text-[11px] font-semibold text-muted-foreground">{m.m}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-bold">Источники заявок</h3>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { l: "Заявки клиентов", v: 58 },
              { l: "Прямые брони", v: 28 },
              { l: "Повторные гости", v: 14 },
            ].map((s) => (
              <div key={s.l}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{s.l}</span>
                  <span className="text-muted-foreground">{s.v}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-bold">Последние отзывы</h3>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                <div className="flex items-center gap-2">
                  <img src={r.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{r.author}</div>
                    <div className="text-[11px] text-muted-foreground">{r.date}</div>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {r.rating}
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                <button className="mt-2 text-xs font-semibold text-primary">Ответить</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Big({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
      <div
        className={
          "mt-1 inline-flex items-center gap-1 text-[11px] font-semibold " +
          (up ? "text-success" : "text-destructive")
        }
      >
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {delta}
      </div>
    </div>
  );
}
