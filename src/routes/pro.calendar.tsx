import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { proProperties } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/calendar")({
  component: ProCalendar,
});

const months = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Mock: pretend dates 12-17, 22-25 of current month are booked
const bookedSet = new Set([12, 13, 14, 15, 16, 17, 22, 23, 24, 25]);
const blockedSet = new Set([5, 6]);

function ProCalendar() {
  const today = new Date();
  const [propertyId, setPropertyId] = useState(proProperties[0].id);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  return (
    <>
      <AppHeader title="Календарь" />
      <div className="space-y-4 px-4 pt-2 pb-32">
        {/* Property selector */}
        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
          {proProperties.map((p) => (
            <button
              key={p.id}
              onClick={() => setPropertyId(p.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold ring-1",
                p.id === propertyId
                  ? "bg-foreground text-background ring-foreground"
                  : "bg-card text-muted-foreground ring-border"
              )}
            >
              <img src={p.images[0]} alt="" className="h-7 w-7 rounded-full object-cover" />
              {p.title.split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border">
          <button onClick={prev} className="grid h-9 w-9 place-items-center rounded-full bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-display text-base font-bold">
            {months[month]} {year}
          </div>
          <button onClick={next} className="grid h-9 w-9 place-items-center rounded-full bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-muted-foreground">
            {weekDays.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const isBooked = bookedSet.has(d);
              const isBlocked = blockedSet.has(d);
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <button
                  key={i}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-semibold transition-colors",
                    isBooked && "bg-primary text-primary-foreground",
                    isBlocked && "bg-muted text-muted-foreground line-through",
                    !isBooked && !isBlocked && "bg-background hover:bg-muted ring-1 ring-border",
                    isToday && "ring-2 ring-primary"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
            <Legend color="bg-primary" label="Занято" />
            <Legend color="bg-muted" label="Заблокировано" />
            <Legend color="bg-background ring-1 ring-border" label="Свободно" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-2xl bg-foreground py-3 text-sm font-bold text-background">
            Закрыть даты
          </button>
          <button className="rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground">
            Открыть даты
          </button>
        </div>
      </div>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded", color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
