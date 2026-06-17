import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatDateTime } from "@/lib/mock-data";
import type { Database } from "@/integrations/supabase/types";

type RuleUpdate = Database["public"]["Tables"]["alert_rules"]["Update"];

export const Route = createFileRoute("/admin/alerts")({ component: AdminAlerts });

const isAdminQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) throw error;
      return !!data;
    },
  });

const rulesQuery = queryOptions({
  queryKey: ["alert-rules"],
  staleTime: 10_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("alert_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

const incidentsQuery = queryOptions({
  queryKey: ["alert-incidents"],
  staleTime: 10_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("alert_incidents")
      .select("*, alert_rules(name, kind, event_name)")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  },
});

function AdminAlerts() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useQuery(isAdminQuery(user?.id ?? null));

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return (
      <>
        <AppHeader title="Алерты" back />
        <div className="px-4 pt-10 text-center text-sm text-muted-foreground">
          Доступ только для администраторов.
        </div>
      </>
    );
  }
  return <AdminAlertsContent />;
}

function AdminAlertsContent() {
  return (
    <>
      <AppHeader title="Алерты" back />
      <div className="space-y-6 px-4 pt-2 pb-32">
        <RulesSection />
        <IncidentsSection />
      </div>
    </>
  );
}

function RulesSection() {
  const qc = useQueryClient();
  const { data: rules = [], isLoading } = useQuery(rulesQuery);
  const [creating, setCreating] = useState(false);

  const update = useMutation({
    mutationFn: async (p: { id: string; patch: RuleUpdate }) => {
      const { error } = await supabase.from("alert_rules").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alert_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Правила</h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Новое
        </button>
      </div>

      {creating && <NewRuleForm onClose={() => setCreating(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {rules.length === 0 && (
            <div className="rounded-2xl bg-card p-4 text-center text-xs text-muted-foreground ring-1 ring-border">
              Нет правил
            </div>
          )}
          {rules.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {r.kind === "error_rate"
                      ? "Ошибки клиента"
                      : `Событие: ${r.event_name ?? "—"}`}
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      update.mutate({ id: r.id, patch: { enabled: e.target.checked } })
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-[11px] uppercase text-muted-foreground">
                    {r.enabled ? "вкл" : "выкл"}
                  </span>
                </label>
                <button
                  onClick={() => {
                    if (confirm("Удалить правило?")) remove.mutate(r.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <NumberField
                  label="Окно, мин"
                  value={r.window_minutes}
                  min={1}
                  max={1440}
                  onChange={(v) => update.mutate({ id: r.id, patch: { window_minutes: v } })}
                />
                <NumberField
                  label="Порог"
                  value={r.threshold}
                  min={1}
                  onChange={(v) => update.mutate({ id: r.id, patch: { threshold: v } })}
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={r.notify_admins}
                  onChange={(e) =>
                    update.mutate({ id: r.id, patch: { notify_admins: e.target.checked } })
                  }
                  className="h-4 w-4 accent-primary"
                />
                Уведомлять администраторов
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  return (
    <label className="block">
      <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = parseInt(local, 10);
          if (!Number.isFinite(n) || n < (min ?? 1)) {
            setLocal(String(value));
            return;
          }
          if (n !== value) onChange(n);
        }}
        className="mt-1 w-full rounded-lg bg-background p-2 text-sm ring-1 ring-border"
      />
    </label>
  );
}

function NewRuleForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"error_rate" | "event_spike">("error_rate");
  const [eventName, setEventName] = useState("");
  const [windowMinutes, setWindowMinutes] = useState(5);
  const [threshold, setThreshold] = useState(10);

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Укажите название");
      if (kind === "event_spike" && !eventName.trim())
        throw new Error("Укажите имя события");
      const { error } = await supabase.from("alert_rules").insert({
        name: name.trim(),
        kind,
        event_name: kind === "event_spike" ? eventName.trim() : null,
        window_minutes: windowMinutes,
        threshold,
        enabled: true,
        notify_admins: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Правило создано");
      qc.invalidateQueries({ queryKey: ["alert-rules"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mb-3 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="font-display font-semibold">Новое правило</div>
      <input
        placeholder="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-2 w-full rounded-lg bg-background p-2 text-sm ring-1 ring-border"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as "error_rate" | "event_spike")}
        className="mt-2 w-full rounded-lg bg-background p-2 text-sm ring-1 ring-border"
      >
        <option value="error_rate">Ошибки клиента</option>
        <option value="event_spike">Всплеск события</option>
      </select>
      {kind === "event_spike" && (
        <input
          placeholder="Имя события, напр. sign_in"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="mt-2 w-full rounded-lg bg-background p-2 text-sm ring-1 ring-border"
        />
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] uppercase text-muted-foreground">Окно, мин</span>
          <input
            type="number"
            min={1}
            max={1440}
            value={windowMinutes}
            onChange={(e) => setWindowMinutes(parseInt(e.target.value, 10) || 1)}
            className="mt-1 w-full rounded-lg bg-background p-2 text-sm ring-1 ring-border"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase text-muted-foreground">Порог</span>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 1)}
            className="mt-1 w-full rounded-lg bg-background p-2 text-sm ring-1 ring-border"
          />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="flex-1 rounded-full bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Создать"}
        </button>
        <button onClick={onClose} className="flex-1 rounded-full bg-muted py-2 text-sm font-bold">
          Отмена
        </button>
      </div>
    </div>
  );
}

function IncidentsSection() {
  const { data = [], isLoading } = useQuery(incidentsQuery);
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold">Последние инциденты</h2>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl bg-card p-4 text-center text-xs text-muted-foreground ring-1 ring-border">
          Инцидентов нет
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((i) => {
            const rule = (i as { alert_rules?: { name?: string } }).alert_rules;
            return (
              <div
                key={i.id}
                className="flex items-start gap-2 rounded-2xl bg-card p-3 ring-1 ring-border"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-semibold">
                    {rule?.name ?? "Правило"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {i.count} событий (порог {i.threshold}) · {formatDateTime(i.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
