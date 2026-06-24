import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Home, Inbox, CalendarCheck, Flag, AlertTriangle, Activity } from "lucide-react";

export const Route = createFileRoute("/admin/health")({ component: HealthPage });

type Counts = {
  users: number;
  properties: number;
  active_properties: number;
  requests: number;
  bookings: number;
  complaints: number;
  open_complaints: number;
  errors_24h: number;
  events_24h: number;
};

async function fetchCounts(): Promise<Counts> {
  const c = (q: ReturnType<typeof supabase.from>) => q.select("*", { count: "exact", head: true });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [users, props, propsActive, reqs, books, comps, openComps, errs, evs] = await Promise.all([
    c(supabase.from("profiles")),
    c(supabase.from("properties")),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "active"),
    c(supabase.from("requests")),
    c(supabase.from("bookings")),
    c(supabase.from("complaints")),
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("analytics_events").select("*", { count: "exact", head: true }).gte("created_at", since),
  ]);
  return {
    users: users.count ?? 0,
    properties: props.count ?? 0,
    active_properties: propsActive.count ?? 0,
    requests: reqs.count ?? 0,
    bookings: books.count ?? 0,
    complaints: comps.count ?? 0,
    open_complaints: openComps.count ?? 0,
    errors_24h: errs.count ?? 0,
    events_24h: evs.count ?? 0,
  };
}

function Card({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: number; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  const ring =
    tone === "bad" ? "ring-red-500/40" : tone === "warn" ? "ring-amber-500/40" : "ring-border";
  return (
    <div className={`rounded-xl bg-card p-4 ring-1 ${ring}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function HealthPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-health"],
    queryFn: fetchCounts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">System Health</h2>
        <button
          onClick={() => refetch()}
          className="rounded-full bg-card px-3 py-1 text-xs ring-1 ring-border"
          disabled={isFetching}
        >
          {isFetching ? "Обновляется…" : "Обновить"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card icon={Users} label="Пользователи" value={data.users} />
        <Card icon={Home} label="Объекты" value={data.properties} hint={`${data.active_properties} активных`} />
        <Card icon={Inbox} label="Заявки" value={data.requests} />
        <Card icon={CalendarCheck} label="Брони" value={data.bookings} />
        <Card
          icon={Flag}
          label="Жалобы"
          value={data.complaints}
          hint={`${data.open_complaints} открытых`}
          tone={data.open_complaints > 0 ? "warn" : "ok"}
        />
        <Card
          icon={AlertTriangle}
          label="Ошибки (24ч)"
          value={data.errors_24h}
          tone={data.errors_24h > 20 ? "bad" : data.errors_24h > 5 ? "warn" : "ok"}
        />
        <Card icon={Activity} label="События (24ч)" value={data.events_24h} />
      </div>

      <div className="rounded-xl bg-card p-4 ring-1 ring-border">
        <div className="text-sm font-semibold">Готовность к запуску 100 квартир</div>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Активных объектов: {data.active_properties} / 100</li>
          <li>• Открытых жалоб: {data.open_complaints}</li>
          <li>• Ошибки за 24ч: {data.errors_24h}</li>
        </ul>
      </div>
    </div>
  );
}
