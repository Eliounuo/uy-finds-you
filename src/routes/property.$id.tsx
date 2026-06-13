import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Star, MapPin, Users, BedDouble, Maximize, Loader2 } from "lucide-react";
import { propertyQuery } from "@/lib/queries";
import { formatKZT, amenityLabels } from "@/lib/mock-data";
import { useFavorites, useToggleFavorite } from "@/lib/use-favorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/property/$id")({ component: PropertyPage });

function PropertyPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery(propertyQuery(id));
  const favs = useFavorites();
  const toggle = useToggleFavorite();

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>;
  if (!p) return <div className="p-6 text-center text-sm text-muted-foreground">Объект не найден</div>;

  const fav = favs.has(p.id);

  return (
    <div className="pb-32">
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {p.photos[0] && <img src={p.photos[0]} alt={p.title} className="h-full w-full object-cover"/>}
        </div>
        <Link to="/" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"><ArrowLeft className="h-5 w-5"/></Link>
        <button onClick={() => toggle.mutate({ propertyId: p.id, isFav: fav })} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur">
          <Heart className={cn("h-5 w-5", fav && "fill-primary text-primary")}/>
        </button>
      </div>

      {p.photos.length > 1 && (
        <div className="scrollbar-hide -mt-2 flex gap-2 overflow-x-auto px-4 pt-3">
          {p.photos.slice(1).map((src, i) => (
            <img key={i} src={src} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover"/>
          ))}
        </div>
      )}

      <div className="space-y-5 px-4 pt-4">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{p.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/> {p.city}{p.district ? `, ${p.district}` : ""}{p.address ? ` · ${p.address}` : ""}</p>
          <div className="mt-2 flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-primary text-primary"/>{Number(p.rating).toFixed(1)} <span className="text-muted-foreground">· {p.reviews_count} отзывов</span></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Users} label="Гостей" value={String(p.guests ?? "—")}/>
          <Stat icon={BedDouble} label="Спален" value={String(p.beds ?? "—")}/>
          <Stat icon={Maximize} label="м²" value={String(p.area ?? "—")}/>
        </div>

        {p.description && <p className="text-sm leading-relaxed text-foreground">{p.description}</p>}

        {p.amenities.length > 0 && (
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Удобства</h2>
            <div className="flex flex-wrap gap-2">
              {p.amenities.map((a) => <span key={a} className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold ring-1 ring-border">{amenityLabels[a] ?? a}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">{formatKZT(p.price_per_night)}</div>
            <div className="text-[11px] text-muted-foreground">за ночь</div>
          </div>
          <Link to="/create-request" className="rounded-full bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-glow">Создать заявку</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-3 text-center ring-1 ring-border">
      <Icon className="mx-auto h-4 w-4 text-primary"/>
      <div className="mt-1 font-display text-base font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
