import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

const usersQuery = queryOptions({
  queryKey: ["admin-users"],
  staleTime: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, public_id, full_name, avatar_url, phone, verification_status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

function AdminUsers() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(usersQuery);

  const toggleBlock = useMutation({
    mutationFn: async (p: { id: string; block: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: p.block ? "rejected" : "unverified" })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Обновлено");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
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
      {data.map((u) => {
        const blocked = u.verification_status === "rejected";
        return (
          <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-bold">
                {(u.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{u.full_name ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground">{u.phone ?? "—"}</div>
              <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                {u.public_id && <span className="font-mono">{u.public_id}</span>}
                <span>· {u.verification_status}</span>
              </div>
            </div>
            <button
              onClick={() => toggleBlock.mutate({ id: u.id, block: !blocked })}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                blocked
                  ? "bg-success/10 text-success ring-success/30"
                  : "bg-destructive/10 text-destructive ring-destructive/30"
              }`}
            >
              {blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
              {blocked ? "Разблок" : "Блок"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
