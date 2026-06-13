import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { ownerBookingsQuery } from "@/lib/queries";
import { formatDate, formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/calendar")({ component: ProCalendar });

function ProCalendar() {
  const { user } = useAuth();
  const { data = [] } = useQuery(ownerBookingsQuery(user?.id ?? null));

  return (
    <>
      <AppHeader title="Календарь" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        {data.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border"><CalendarRange className="mx-auto h-10 w-10 text-muted-foreground"/><p className="mt-2 text-sm text-muted-foreground">Бронирований пока нет</p></div>
        )}
        {data.map((b) => (
          <div key={b.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="font-display font-bold">{b.properties?.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{formatDate(b.check_in)} — {formatDate(b.check_out)} · {b.guests} гостей</div>
            <div className="mt-2 font-display text-sm font-bold text-primary">{formatKZT(b.total_price)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
