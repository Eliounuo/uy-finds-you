import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { ownerBookingsQuery, myPropertiesQuery } from "@/lib/queries";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/stats")({ component: ProStats });

function ProStats() {
  const { user } = useAuth();
  const { data: bookings = [] } = useQuery(ownerBookingsQuery(user?.id ?? null));
  const { data: props = [] } = useQuery(myPropertiesQuery(user?.id ?? null));
  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total_price, 0);

  return (
    <>
      <AppHeader title="Статистика" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        <Stat label="Объектов" value={String(props.length)} />
        <Stat label="Бронирований" value={String(bookings.length)} />
        <Stat label="Доход" value={formatKZT(revenue)} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
