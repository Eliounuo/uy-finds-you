import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Users, Wallet, Send, X } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { incomingRequests, proProperties, formatKZT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/requests")({
  component: ProRequests,
});

function ProRequests() {
  const [offerFor, setOfferFor] = useState<string | null>(null);

  return (
    <>
      <AppHeader title="Заявки клиентов" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{incomingRequests.length} новых</span>
          <div className="flex gap-1 rounded-full bg-card p-1 ring-1 ring-border">
            <button className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              Все
            </button>
            <button className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground">
              Подходящие
            </button>
          </div>
        </div>

        {incomingRequests.map((r) => (
          <div key={r.id} className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-border">
            <div className="flex items-start gap-3">
              <img src={r.clientAvatar} alt={r.clientName} className="h-10 w-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-display font-bold">{r.clientName}</div>
                  <span className="text-[11px] text-muted-foreground">{r.createdAt}</span>
                </div>
                <div className="text-xs text-muted-foreground">{r.city}, {r.district}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-2">
              <Mini icon={CalendarDays} label={`${r.checkIn.slice(5)} — ${r.checkOut.slice(5)}`} />
              <Mini icon={Users} label={`${r.guests} чел`} />
              <Mini icon={Wallet} label={`до ${(r.budgetMax / 1000).toFixed(0)}к`} />
            </div>

            {r.notes && (
              <p className="mt-2 text-xs text-muted-foreground">«{r.notes}»</p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setOfferFor(r.id)}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground"
              >
                Отправить предложение
              </button>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"
                aria-label="Скрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {offerFor && <OfferSheet onClose={() => setOfferFor(null)} />}
    </>
  );
}

function Mini({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 text-[11px] font-semibold">
      <Icon className="h-3 w-3 text-primary" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function OfferSheet({ onClose }: { onClose: () => void }) {
  const [propertyId, setPropertyId] = useState(proProperties[0].id);
  const [price, setPrice] = useState(proProperties[0].price);
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full rounded-t-3xl bg-card p-5"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <h3 className="font-display text-lg font-bold">Новое предложение</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Выберите объект и условия</p>

        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">Объект</div>
            <div className="space-y-2">
              {proProperties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPropertyId(p.id); setPrice(p.price); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-2 text-left ring-1 transition-colors",
                    p.id === propertyId
                      ? "bg-primary/10 ring-primary"
                      : "bg-background ring-border"
                  )}
                >
                  <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">{formatKZT(p.price)} / ночь</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <div className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">Цена за ночь</div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-xl bg-background px-3 py-2.5 text-sm outline-none ring-1 ring-border"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">Сообщение</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Привет! У меня свободна квартира на ваши даты…"
              className="w-full resize-none rounded-xl bg-background p-3 text-sm outline-none ring-1 ring-border"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-muted py-3 text-sm font-bold">
            Отмена
          </button>
          <Link
            to="/pro/chat"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            <Send className="h-4 w-4" /> Отправить
          </Link>
        </div>
      </div>
    </div>
  );
}
