import { Link } from "@tanstack/react-router";
import { Heart, Star, MapPin } from "lucide-react";
import { useFavorites, useToggleFavorite } from "@/lib/use-favorites";
import { formatKZT } from "@/lib/mock-data";
import type { Property } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { SignedImg } from "@/components/signed-img";

export function PropertyCard({ p, compact = false }: { p: Property; compact?: boolean }) {
  const favs = useFavorites();
  const toggle = useToggleFavorite();
  const fav = favs.has(p.id);

  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border transition-transform active:scale-[0.98]"
    >
      <div className={cn("relative w-full overflow-hidden bg-muted", compact ? "aspect-square" : "aspect-[4/3]")}>
        {p.photos[0] && (
          <SignedImg path={p.photos[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle.mutate({ propertyId: p.id, isFav: fav });
          }}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur"
          aria-label="В избранное"
        >
          <Heart className={cn("h-4 w-4", fav && "fill-primary text-primary")} />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold backdrop-blur">
          <Star className="h-3 w-3 fill-primary text-primary" />
          {Number(p.rating).toFixed(1)}
          <span className="text-muted-foreground">·{p.reviews_count}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className={cn("truncate font-display font-semibold", compact ? "text-sm" : "text-base")}>
          {p.title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {p.city}{p.district ? `, ${p.district}` : ""}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-display text-base font-bold text-foreground">{formatKZT(p.price_per_night)}</span>
          <span className="text-xs text-muted-foreground">/ сутки</span>
        </div>
      </div>
    </Link>
  );
}
