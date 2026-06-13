import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Star,
  MapPin,
  Users,
  Maximize2,
  BedDouble,
  Wifi,
  ChefHat,
  Wind,
  Car,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
} from "lucide-react";
import { properties, reviews, amenityLabels, formatKZT } from "@/lib/mock-data";
import { useApp } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/property/$id")({
  component: PropertyPage,
  loader: ({ params }) => {
    const p = properties.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">Объект не найден</div>
  ),
});

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  kitchen: ChefHat,
  ac: Wind,
  parking: Car,
};

function PropertyPage() {
  const p = Route.useLoaderData() as (typeof properties)[number];
  const { favorites, toggleFavorite } = useApp();
  const fav = favorites.includes(p.id);
  const [idx, setIdx] = useState(0);
  const list = reviews.filter((r) => r.propertyId === p.id);

  return (
    <div className="pb-32">
      {/* Hero gallery */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img src={p.images[idx]} alt={p.title} className="h-full w-full object-cover" />
        <div className="safe-top absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-2">
          <button
            onClick={() => history.back()}
            className="grid h-10 w-10 place-items-center rounded-full bg-background/85 backdrop-blur"
            aria-label="Назад"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-background/85 backdrop-blur" aria-label="Поделиться">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleFavorite(p.id)}
              className="grid h-10 w-10 place-items-center rounded-full bg-background/85 backdrop-blur"
              aria-label="В избранное"
            >
              <Heart className={cn("h-4 w-4", fav && "fill-primary text-primary")} />
            </button>
          </div>
        </div>
        {p.images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + p.images.length) % p.images.length)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/85"
              aria-label="Назад"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % p.images.length)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/85"
              aria-label="Вперёд"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {p.images.map((_: string, i: number) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx ? "w-5 bg-background" : "w-1.5 bg-background/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-5 px-4 pt-4">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{p.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{p.rating}</span>
              <span>({p.reviewsCount})</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {p.city}, {p.district}
            </span>
          </div>
        </div>

        {/* Key facts grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { i: Users, l: `${p.guests} гостя` },
            { i: BedDouble, l: `${p.rooms} комн.` },
            { i: Maximize2, l: `${p.area} м²` },
          ].map(({ i: I, l }) => (
            <div key={l} className="rounded-xl bg-card p-3 text-center ring-1 ring-border">
              <I className="mx-auto h-4 w-4 text-primary" />
              <div className="mt-1 text-xs font-semibold">{l}</div>
            </div>
          ))}
        </div>

        {/* Owner */}
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
          <img src={p.owner.avatar} alt={p.owner.name} className="h-12 w-12 rounded-full object-cover" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Хозяин</div>
            <div className="font-bold">{p.owner.name}</div>
          </div>
          <Link
            to="/chat/$id"
            params={{ id: "c1" }}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          >
            Написать
          </Link>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-bold">Об объекте</h3>
          <p className="text-sm text-muted-foreground">{p.description}</p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-bold">Удобства</h3>
          <div className="grid grid-cols-2 gap-2">
            {p.amenities.map((a: string) => {
              const Icon = amenityIcons[a] ?? Wifi;
              return (
                <div key={a} className="flex items-center gap-2 rounded-xl bg-card p-3 text-sm ring-1 ring-border">
                  <Icon className="h-4 w-4 text-primary" />
                  {amenityLabels[a] ?? a}
                </div>
              );
            })}
          </div>
        </div>

        {list.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-base font-bold">Отзывы</h3>
            <div className="space-y-3">
              {list.map((r) => (
                <div key={r.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                  <div className="flex items-center gap-2">
                    <img src={r.avatar} alt={r.author} className="h-8 w-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-bold">{r.author}</div>
                      <div className="text-[11px] text-muted-foreground">{r.date}</div>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {r.rating}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-lg">
        <div>
          <div className="font-display text-lg font-bold">{formatKZT(p.price)}</div>
          <div className="text-[11px] text-muted-foreground">за ночь</div>
        </div>
        <Link
          to="/bookings"
          className="flex-1 rounded-full bg-primary py-3 text-center font-display text-base font-bold text-primary-foreground shadow-glow"
        >
          Забронировать
        </Link>
      </div>
    </div>
  );
}
