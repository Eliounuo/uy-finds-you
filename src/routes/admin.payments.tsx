import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKZT, formatDateTime } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

const paymentsQuery = queryOptions({
  queryKey: ["admin-payments"],
  staleTime: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

function AdminPayments() {
  const { data = [], isLoading } = useQuery(paymentsQuery);
  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (data.length === 0)
    return <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">Платежей пока нет</div>;
  return (
    <div className="space-y-2">
      {data.map((p) => (
        <div key={p.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold">{formatKZT(Number(p.amount))}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              p.status === "succeeded" ? "bg-success/15 text-success" :
              p.status === "failed" ? "bg-destructive/15 text-destructive" :
              p.status === "refunded" ? "bg-amber-500/15 text-amber-600" :
              "bg-muted text-muted-foreground"
            }`}>{p.status}</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {p.method ?? "—"} · {formatDateTime(p.created_at)}
          </div>
          {p.booking_id && <div className="text-[10px] text-muted-foreground">Бронь: {p.booking_id.slice(0,8)}</div>}
        </div>
      ))}
    </div>
  );
}
