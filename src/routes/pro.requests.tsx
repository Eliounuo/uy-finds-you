import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CalendarDays, Wallet, Inbox, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { openRequestsQuery, myPropertiesQuery, type RequestRow } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatKZT, formatDate, nightsBetween } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/requests")({ component: ProRequests });

function ProRequests() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery(openRequestsQuery(user?.id ?? null));
  const [active, setActive] = useState<RequestRow | null>(null);

  return (
    <>
      <AppHeader title="Заявки клиентов" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>}
        {!isLoading && data.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border"><Inbox className="mx-auto h-10 w-10 text-muted-foreground"/><p className="mt-2 text-sm text-muted-foreground">Пока нет открытых заявок</p></div>
        )}
        {data.map((r) => (
          <button key={r.id} onClick={() => setActive(r)} className="block w-full rounded-2xl bg-card p-4 text-left ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div className="font-display font-bold">{r.city}{r.district ? `, ${r.district}` : ""}</div>
              <div className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {formatDate(r.check_in)} — {formatDate(r.check_out)}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {r.guests}</span>
              <span className="flex items-center gap-1"><Wallet className="h-3 w-3"/> до {formatKZT(r.budget_max)}</span>
            </div>
            {r.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{r.notes}</p>}
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
              <Send className="h-3 w-3"/> Сделать предложение
            </div>
          </button>
        ))}
      </div>
      {active && <OfferSheet request={active} onClose={() => setActive(null)} />}
    </>
  );
}

function OfferSheet({ request, onClose }: { request: RequestRow; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: props = [] } = useQuery(myPropertiesQuery(user?.id ?? null));
  const [propertyId, setPropertyId] = useState<string>("");
  const [price, setPrice] = useState(request.budget_max);
  const [message, setMessage] = useState("");
  const nights = nightsBetween(request.check_in, request.check_out);

  const send = useMutation({
    mutationFn: async () => {
      if (!user || !propertyId) throw new Error("Выберите объект");
      // Pre-check: do not let the owner offer dates that are already booked
      const { data: available, error: availErr } = await supabase.rpc("is_property_available", {
        _property_id: propertyId,
        _check_in: request.check_in,
        _check_out: request.check_out,
        _exclude_booking_id: null as unknown as string,
      });
      if (availErr) throw availErr;
      if (available === false) throw new Error("На эти даты у этого объекта уже есть бронь");
      const { error } = await supabase.from("offers").insert({
        request_id: request.id, property_id: propertyId, owner_id: user.id,
        price_per_night: price, total_price: price * nights, message: message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Предложение отправлено"); qc.invalidateQueries({ queryKey: ["open-requests"] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="safe-bottom w-full rounded-t-3xl bg-background p-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border"/>
        <h2 className="font-display text-lg font-bold">Предложение клиенту</h2>
        {props.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Сначала добавьте хотя бы один объект.</p>
        ) : (
          <>
            <label className="mt-3 block text-xs font-semibold uppercase text-muted-foreground">Объект</label>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="mt-1 w-full rounded-xl bg-card p-3 text-sm ring-1 ring-border">
              <option value="">— выберите —</option>
              {props.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>

            <label className="mt-3 block text-xs font-semibold uppercase text-muted-foreground">Цена за сутки</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-card p-3 text-sm ring-1 ring-border"/>
            <div className="mt-1 text-[11px] text-muted-foreground">Итого {nights} ноч. · {formatKZT(price * nights)}</div>

            <label className="mt-3 block text-xs font-semibold uppercase text-muted-foreground">Сообщение</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} placeholder="Что подкупает в вашем варианте…"
              className="mt-1 w-full resize-none rounded-xl bg-card p-3 text-sm ring-1 ring-border"/>

            <button onClick={() => send.mutate()} disabled={send.isPending}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground disabled:opacity-60">
              {send.isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : "Отправить"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
