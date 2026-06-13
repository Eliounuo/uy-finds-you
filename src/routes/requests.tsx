import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Users, CalendarDays, MapPin, Inbox } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { myRequests, offersForMe, properties, formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  return (
    <>
      <AppHeader title="Мои заявки" />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <Link
          to="/create-request"
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-primary"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold">Новая заявка</div>
            <div className="text-xs opacity-80">Получите предложения за минуты</div>
          </div>
        </Link>

        {myRequests.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">У вас пока нет заявок</p>
          </div>
        )}

        {myRequests.map((r) => {
          const offers = offersForMe.filter((o) => o.requestId === r.id);
          return (
            <div key={r.id} className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-border">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold">{r.city}, {r.district}</h3>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                  Активна
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {r.checkIn} — {r.checkOut}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {r.guests} гостя</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> до {formatKZT(r.budgetMax)}</span>
              </div>
              {r.notes && <p className="mt-2 text-xs text-muted-foreground">{r.notes}</p>}

              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <h4 className="text-sm font-semibold">Предложения ({offers.length})</h4>
                  {offers.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">Свайпни →</span>
                  )}
                </div>
                {offers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Ожидаем предложения от владельцев…</p>
                ) : (
                  <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {offers.map((o) => {
                      const p = properties.find((x) => x.id === o.propertyId);
                      if (!p) return null;
                      return (
                        <Link
                          key={o.id}
                          to="/property/$id"
                          params={{ id: p.id }}
                          className="w-60 shrink-0 overflow-hidden rounded-xl bg-background ring-1 ring-border"
                        >
                          <img src={p.images[0]} alt={p.title} className="h-24 w-full object-cover" />
                          <div className="p-2.5">
                            <div className="truncate text-sm font-semibold">{p.title}</div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{o.message}</div>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className="font-display text-sm font-bold text-primary">{formatKZT(o.price)}</span>
                              <span className="text-[10px] text-muted-foreground">{o.createdAt}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
