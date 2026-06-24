import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKZT, formatDate } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const bookingsQuery = queryOptions({
  queryKey: ["admin-bookings"],
  staleTime: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, guests, total_price, status, created_at, properties(title, city)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

function AdminBookings() {
  const { data = [], isLoading } = useQuery(bookingsQuery);
  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  return (
    <div className="space-y-2">
      {data.map((b) => {
        const prop = (b as { properties: { title: string; city: string } | null }).properties;
        return (
          <div key={b.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div className="truncate text-sm font-semibold">{prop?.title ?? "—"}</div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">
                {b.status}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {prop?.city} · {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.guests} гостей
            </div>
            <div className="mt-0.5 font-display text-sm font-bold text-primary">
              {formatKZT(b.total_price)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
