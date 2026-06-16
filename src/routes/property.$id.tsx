import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Star, MapPin, Users, BedDouble, Maximize, Loader2, ShieldCheck } from "lucide-react";
import { propertyQuery, profileQuery } from "@/lib/queries";
import { formatKZT, amenityLabels } from "@/lib/mock-data";
import { useFavorites, useToggleFavorite } from "@/lib/use-favorites";
import { cn } from "@/lib/utils";
import { SignedImg } from "@/components/signed-img";
import { PropertyReviews, RatingBadge } from "@/components/reviews";
import { ReportButton } from "@/components/report-button";

export const Route = createFileRoute("/property/$id")({ component: PropertyPage });

function PropertyPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery(propertyQuery(id));
  const { data: ownerProfile } = useQuery(profileQuery(p?.owner_id ?? null));
  const favs = useFavorites();
  const toggle = useToggleFavorite();

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>;
  if (!p) return <div className="p-6 text-center text-sm text-muted-foreground">Объект не найден</div>;

  const fav = favs.has(p.id);

  return (
    <div className="pb-32">
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {p.photos[0] && <SignedImg path={p.photos[0]} alt={p.title} loading="eager" width={1200} className="h-full w-full object-cover"/>}
        </div>
        <Link to="/" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"><ArrowLeft className="h-5 w-5"/></Link>
        <button onClick={() => toggle.mutate({ propertyId: p.id, isFav: fav })} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur">
          <Heart className={cn("h-5 w-5", fav && "fill-primary text-primary")}/>
        </button>
      </div>

      {p.photos.length > 1 && (
        <div className="scrollbar-hide -mt-2 flex gap-2 overflow-x-auto px-4 pt-3">
          {p.photos.slice(1).map((src, i) => (
            <SignedImg key={i} path={src} alt="" width={300} className="h-20 w-28 shrink-0 rounded-lg object-cover"/>
          ))}
        </div>
      )}

      <div className="space-y-5 px-4 pt-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl font-bold leading-tight">{p.title}</h1>
            <ReportButton targetType="property" targetId={p.id} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/> {p.city}{p.district ? `, ${p.district}` : ""}{p.address ? ` · ${p.address}` : ""}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
            <RatingBadge propertyId={p.id} size="md" />
            {ownerProfile?.verification_status === "verified" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                <ShieldCheck className="h-3 w-3" /> Владелец проверен
              </span>
            )}
          </div>
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

        <div>
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Отзывы</h2>
          <PropertyReviews propertyId={p.id} />
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">{formatKZT(p.price_per_night)}</div>
            <div className="text-[11px] text-muted-foreground">за сутки</div>
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
