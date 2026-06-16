import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const reviewsForPropertyQuery = (propertyId: string) =>
  queryOptions({
    queryKey: ["reviews", propertyId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_author_id_fkey(full_name, avatar_url)")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const propertyRatingQuery = (propertyId: string) =>
  queryOptions({
    queryKey: ["property-rating", propertyId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_ratings")
        .select("avg_rating, reviews_count")
        .eq("property_id", propertyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { data = [] } = useQuery(reviewsForPropertyQuery(propertyId));
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Пока нет отзывов</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {(r as { profiles?: { full_name?: string | null } }).profiles?.full_name ?? "Гость"}
            </span>
          </div>
          {r.text && <p className="mt-2 text-sm">{r.text}</p>}
        </div>
      ))}
    </div>
  );
}

type ReviewFormProps = {
  bookingId: string;
  propertyId: string;
  onDone?: () => void;
};

export function ReviewForm({ bookingId, propertyId, onDone }: ReviewFormProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Войдите");
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        property_id: propertyId,
        author_id: user.id,
        rating,
        text: text || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Спасибо за отзыв!");
      qc.invalidateQueries({ queryKey: ["reviews", propertyId] });
      qc.invalidateQueries({ queryKey: ["property-rating", propertyId] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="font-display font-bold">Оставить отзыв</div>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} звёзд`}>
            <Star
              className={`h-7 w-7 ${
                n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Что понравилось / не понравилось…"
        className="mt-3 w-full resize-none rounded-xl bg-background p-3 text-sm ring-1 ring-border"
      />
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {submit.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Отправить"}
      </button>
    </div>
  );
}

export function RatingBadge({ propertyId, size = "sm" }: { propertyId: string; size?: "sm" | "md" }) {
  const { data } = useQuery(propertyRatingQuery(propertyId));
  if (!data || !data.reviews_count) return null;
  const cls = size === "md" ? "text-sm" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${cls}`}>
      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
      {Number(data.avg_rating).toFixed(1)}
      <span className="text-muted-foreground">({data.reviews_count})</span>
    </span>
  );
}
