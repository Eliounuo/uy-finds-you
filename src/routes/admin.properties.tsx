import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Loader2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/properties")({ component: AdminProperties });

const propsQuery = queryOptions({
  queryKey: ["admin-properties"],
  staleTime: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, city, price_per_night, status, rating, reviews_count, photos, owner_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

function AdminProperties() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(propsQuery);

  const toggle = useMutation({
    mutationFn: async (p: { id: string; status: string }) => {
      const { error } = await supabase.from("properties").update({ status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Обновлено");
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-2">
      {data.map((p) => {
        const hidden = p.status !== "active";
        return (
          <div key={p.id} className="flex items-start gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
            {p.photos[0] && (
              <img src={p.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <Link to="/property/$id" params={{ id: p.id }} className="truncate text-sm font-semibold">
                {p.title}
              </Link>
              <div className="text-[11px] text-muted-foreground">
                {p.city} · {formatKZT(p.price_per_night)}/сут · ★ {p.rating} ({p.reviews_count})
              </div>
              <div className="text-[10px] uppercase text-muted-foreground">{p.status}</div>
            </div>
            <button
              onClick={() => toggle.mutate({ id: p.id, status: hidden ? "active" : "paused" })}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                hidden
                  ? "bg-success/10 text-success ring-success/30"
                  : "bg-amber-500/10 text-amber-600 ring-amber-500/30"
              }`}
            >
              {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hidden ? "Показ" : "Скрыть"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
