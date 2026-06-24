import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

const statsQuery = queryOptions({
  queryKey: ["admin-stats"],
  staleTime: 30_000,
  queryFn: async () => {
    const tables = ["profiles", "properties", "bookings", "requests", "complaints", "payments"] as const;
    const counts = await Promise.all(
      tables.map(async (t) => {
        const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
        if (error) throw error;
        return { table: t, count: count ?? 0 };
      })
    );
    return counts;
  },
});

const LABELS: Record<string, string> = {
  profiles: "Пользователи",
  properties: "Объекты",
  bookings: "Брони",
  requests: "Заявки",
  complaints: "Жалобы",
  payments: "Платежи",
};

function AdminOverview() {
  const { data = [], isLoading } = useQuery(statsQuery);
  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3">
      {data.map((s) => (
        <div key={s.table} className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="text-xs text-muted-foreground">{LABELS[s.table] ?? s.table}</div>
          <div className="mt-1 font-display text-2xl font-bold">{s.count}</div>
        </div>
      ))}
    </div>
  );
}
