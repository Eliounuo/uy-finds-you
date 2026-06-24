import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Loader2, Star } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { myBookingsQuery } from "@/lib/queries";
import { formatKZT, formatDate, nightsBetween } from "@/lib/mock-data";
import { ReviewForm } from "@/components/reviews";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/bookings")({ component: BookingsPage });

function BookingsPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery(myBookingsQuery(user?.id ?? null));
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AppHeader title="Бронирования" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        {!user && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
            <CalendarRange className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Войдите, чтобы видеть бронирования</p>
            <Link to="/auth" className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Войти</Link>
          </div>
        )}
        {user && isLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>}
        {user && !isLoading && data.length === 0 && (
          <EmptyState icon={CalendarRange} title="Пока нет бронирований" description="Создайте заявку — владельцы пришлют предложения." actionLabel="Новая заявка" actionTo="/create-request" />
        )}
        {data.map((b) => {
          const canReview = b.check_out <= today && (b.status === "confirmed" || b.status === "completed") && b.properties;
          const showForm = reviewFor === b.id;
          return (
            <div key={b.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              {b.properties?.photos[0] && <img src={b.properties.photos[0]} alt="" className="h-32 w-full object-cover"/>}
              <div className="p-3">
                <div className="font-display font-bold">{b.properties?.title ?? "Объект"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(b.check_in)} — {formatDate(b.check_out)} · {nightsBetween(b.check_in, b.check_out)} ноч.</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display font-bold text-primary">{formatKZT(b.total_price)}</span>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">{b.status === 'confirmed' ? 'Подтверждено' : b.status}</span>
                </div>
                {canReview && !showForm && (
                  <button onClick={() => setReviewFor(b.id)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                    <Star className="h-3 w-3" /> Оставить отзыв
                  </button>
                )}
                {canReview && showForm && b.properties && (
                  <div className="mt-3">
                    <ReviewForm bookingId={b.id} propertyId={b.properties.id} onDone={() => setReviewFor(null)} />
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
