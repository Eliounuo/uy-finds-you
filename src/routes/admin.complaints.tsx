import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/complaints")({ component: AdminComplaints });

const complaintsQuery = queryOptions({
  queryKey: ["admin-complaints"],
  staleTime: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

type ComplaintStatus = "open" | "reviewing" | "resolved" | "rejected";

function AdminComplaints() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(complaintsQuery);

  const resolve = useMutation({
    mutationFn: async (p: { id: string; status: ComplaintStatus }) => {
      const { error } = await supabase.from("complaints").update({ status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Обновлено");
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (data.length === 0)
    return <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">Жалоб нет</div>;

  return (
    <div className="space-y-2">
      {data.map((c) => (
        <div key={c.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold">{c.reason}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">{c.status}</span>
          </div>
          {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
          <div className="mt-1 text-[11px] text-muted-foreground">
            {c.target_type}: {c.target_id?.slice(0,8)} · {formatDateTime(c.created_at)}
          </div>
          {c.status === "open" && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => resolve.mutate({ id: c.id, status: "resolved" })}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-success/15 py-1.5 text-xs font-bold text-success"
              >
                <Check className="h-3.5 w-3.5" /> Решено
              </button>
              <button
                onClick={() => resolve.mutate({ id: c.id, status: "rejected" })}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-muted py-1.5 text-xs font-bold"
              >
                <X className="h-3.5 w-3.5" /> Отклонить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
