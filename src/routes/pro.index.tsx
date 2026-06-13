import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Building2, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { myPropertiesQuery, ownerBookingsQuery } from "@/lib/queries";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/")({ component: ProHome });

function ProHome() {
  const { user } = useAuth();
  const { data: props = [], isLoading } = useQuery(myPropertiesQuery(user?.id ?? null));
  const { data: bookings = [] } = useQuery(ownerBookingsQuery(user?.id ?? null));
  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total_price, 0);

  return (
    <>
      <AppHeader title="UY Pro" showModeSwitcher />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Объектов" value={String(props.length)} />
          <Stat label="Доход" value={formatKZT(revenue)} />
        </div>

        <div className="flex items-center justify-between pt-2">
          <h3 className="font-display text-lg font-bold">Мои объекты</h3>
          <Link to="/pro/requests" className="text-xs font-semibold text-primary">Заявки клиентов →</Link>
        </div>

        {!user && <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border"><p className="text-sm text-muted-foreground">Войдите как владелец</p></div>}
        {user && isLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>}
        {user && !isLoading && props.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground"/>
            <p className="mt-2 text-sm text-muted-foreground">Пока нет объектов</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Добавление объектов появится в следующем обновлении</p>
          </div>
        )}
        <div className="space-y-3">
          {props.map((p) => (
            <Link key={p.id} to="/property/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
              {p.photos[0] && <img src={p.photos[0]} alt="" className="h-16 w-16 rounded-xl object-cover"/>}
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-semibold">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.city}</div>
                <div className="font-display text-sm font-bold text-primary">{formatKZT(p.price_per_night)}</div>
              </div>
            </Link>
          ))}
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-card py-3 text-sm font-semibold text-muted-foreground ring-1 ring-border" disabled>
          <Plus className="h-4 w-4"/> Добавить объект (скоро)
        </button>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}
