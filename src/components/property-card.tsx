import { Link } from "@tanstack/react-router";
import { Heart, Star, MapPin } from "lucide-react";
import { useApp } from "@/lib/app-mode";
import { formatKZT, type Property } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function PropertyCard({ p, compact = false }: { p: Property; compact?: boolean }) {
  const { favorites, toggleFavorite } = useApp();
  const fav = favorites.includes(p.id);

  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border transition-transform active:scale-[0.98]"
    >
      <div className={cn("relative w-full overflow-hidden", compact ? "aspect-square" : "aspect-[4/3]")}>
        <img
          src={p.images[0]}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(p.id);
          }}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur"
          aria-label="В избранное"
        >
          <Heart className={cn("h-4 w-4", fav && "fill-primary text-primary")} />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold backdrop-blur">
          <Star className="h-3 w-3 fill-primary text-primary" />
          {p.rating}
          <span className="text-muted-foreground">·{p.reviewsCount}</span>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={cn("truncate font-display font-semibold", compact ? "text-sm" : "text-base")}>
            {p.title}
          </h3>
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {p.city}, {p.district}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-display text-base font-bold text-foreground">
            {formatKZT(p.price)}
          </span>
          <span className="text-xs text-muted-foreground">/ ночь</span>
        </div>
      </div>
    </Link>
  );
}
