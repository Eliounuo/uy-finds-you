import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, CalendarDays, Wallet, Inbox, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { myRequestsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatKZT, formatDate } from "@/lib/mock-data";
import { RequestMatches } from "@/components/request-matches";

export const Route = createFileRoute("/requests")({ component: RequestsPage });

function RequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(myRequestsQuery(user?.id ?? null));

  const respond = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase.from("offers").update({ status }).eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.status === "accepted" ? "Предложение принято" : "Отклонено");
      qc.invalidateQueries({ queryKey: ["my-requests"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-chats"] });
    },
    onError: (e: Error) => {
      const msg = /already booked|date_overlap|check_violation/i.test(e.message)
        ? "Эти даты уже забронированы у владельца. Выберите другое предложение."
        : e.message;
      toast.error(msg);
    },
  });

  return (
    <>
      <AppHeader title="Мои заявки" />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <Link to="/create-request" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-primary">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5"/></div>
          <div><div className="font-display font-bold">Новая заявка</div><div className="text-xs opacity-80">Получите предложения за минуты</div></div>
        </Link>

        {!user && <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border"><p className="text-sm text-muted-foreground">Войдите, чтобы видеть свои заявки</p></div>}
        {user && isLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>}
        {user && !isLoading && data.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border"><Inbox className="mx-auto h-10 w-10 text-muted-foreground"/><p className="mt-2 text-sm text-muted-foreground">У вас пока нет заявок</p></div>
        )}

        {data.map((r) => (
          <div key={r.id} className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">{r.city}{r.district ? `, ${r.district}` : ""}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.status === 'open' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                {r.status === 'open' ? 'Активна' : r.status === 'closed' ? 'Закрыта' : 'Отменена'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {formatDate(r.check_in)} — {formatDate(r.check_out)}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {r.guests}</span>
              <span className="flex items-center gap-1"><Wallet className="h-3 w-3"/> до {formatKZT(r.budget_max)}</span>
            </div>
            {r.notes && <p className="mt-2 text-xs text-muted-foreground">{r.notes}</p>}

            <div className="mt-3 border-t border-border pt-3">
              <h4 className="mb-2 text-sm font-semibold">Предложения ({r.offers.length})</h4>
              {r.offers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ожидаем предложения…</p>
              ) : (
                <div className="space-y-2">
                  {r.offers.map((o) => (
                    <div key={o.id} className="rounded-xl bg-background p-3 ring-1 ring-border">
                      <div className="flex items-start gap-3">
                        {o.properties?.photos[0] && <img src={o.properties.photos[0]} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover"/>}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{o.properties?.title}</div>
                          {o.message && <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{o.message}</div>}
                          <div className="mt-1 font-display text-sm font-bold text-primary">{formatKZT(o.price_per_night)} / сутки · итого {formatKZT(o.total_price)}</div>
                        </div>
                      </div>
                      {o.status === 'pending' && r.status === 'open' && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => respond.mutate({ offerId: o.id, status: 'accepted' })} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground">
                            <Check className="h-3.5 w-3.5"/> Принять
                          </button>
                          <button onClick={() => respond.mutate({ offerId: o.id, status: 'declined' })} className="flex items-center justify-center rounded-full bg-card px-3 py-2 ring-1 ring-border">
                            <X className="h-3.5 w-3.5"/>
                          </button>
                        </div>
                      )}
                      {o.status !== 'pending' && <div className="mt-2 text-[11px] text-muted-foreground">{o.status === 'accepted' ? '✓ Принято' : o.status === 'declined' ? '✗ Отклонено' : o.status}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
