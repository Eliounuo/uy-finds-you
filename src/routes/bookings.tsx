import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { bookings, properties, formatKZT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

const statusLabels: Record<string, { label: string; cls: string }> = {
  upcoming: { label: "Скоро", cls: "bg-primary/15 text-primary" },
  active: { label: "Активна", cls: "bg-success/15 text-success" },
  completed: { label: "Завершена", cls: "bg-muted text-muted-foreground" },
  cancelled: { label: "Отменена", cls: "bg-destructive/15 text-destructive" },
};

function BookingsPage() {
  return (
    <>
      <AppHeader title="Бронирования" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        {bookings.map((b) => {
          const p = properties.find((x) => x.id === b.propertyId);
          if (!p) return null;
          const s = statusLabels[b.status];
          return (
            <Link
              key={b.id}
              to="/property/$id"
              params={{ id: p.id }}
              className="flex gap-3 overflow-hidden rounded-2xl bg-card p-2 shadow-card ring-1 ring-border"
            >
              <img src={p.images[0]} alt={p.title} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-display font-bold">{p.title}</h3>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", s.cls)}>
                    {s.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.city}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {b.checkIn} — {b.checkOut}
                </div>
                <div className="mt-1 font-display text-sm font-bold text-primary">{formatKZT(b.total)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
