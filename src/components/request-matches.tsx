import { useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKZT } from "@/lib/mock-data";

type Match = {
  id: string;
  title: string;
  city: string;
  district: string | null;
  price_per_night: number;
  rooms: number | null;
  guests: number | null;
  rating: number;
  reviews_count: number;
  photos: string[];
  amenities: string[];
  match_score: number;
  distance_km: number | null;
};

const matchesQuery = (requestId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["request-matches", requestId],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("match_properties_for_request", {
        _request_id: requestId,
      });
      if (error) throw error;
      return (data ?? []) as Match[];
    },
  });

export function RequestMatches({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery(matchesQuery(requestId, open));

  return (
    <div className="mt-3 rounded-xl bg-primary/5 ring-1 ring-primary/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="flex-1 text-sm font-semibold text-primary">
          Подходящие варианты {open && data.length > 0 ? `(${data.length})` : ""}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {isLoading && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && data.length === 0 && (
            <div className="py-2 text-center text-xs text-muted-foreground">
              Пока нет точных совпадений
            </div>
          )}
          {data.map((m) => (
            <Link
              key={m.id}
              to="/property/$id"
              params={{ id: m.id }}
              className="flex items-start gap-2 rounded-lg bg-background p-2 ring-1 ring-border"
            >
              {m.photos[0] && (
                <img src={m.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{m.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {m.city}{m.district ? `, ${m.district}` : ""} · {m.rooms ?? "—"} комн · до {m.guests} гостей
                  {m.distance_km != null && ` · ${m.distance_km} км`}
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-primary">
                    {formatKZT(m.price_per_night)}/сутки
                  </span>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    ★ {m.rating} · {m.match_score} pts
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
