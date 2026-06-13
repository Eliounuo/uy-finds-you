import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PropertyCard } from "@/components/property-card";
import { useAuth } from "@/lib/use-auth";
import { favoritesQuery } from "@/lib/queries";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery(favoritesQuery(user?.id ?? null));
  const list = data.map((f) => f.properties).filter(Boolean) as NonNullable<(typeof data)[number]["properties"]>[];

  return (
    <>
      <AppHeader title="Избранное" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        {!user && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Войдите, чтобы сохранять понравившиеся варианты</p>
            <Link to="/auth" className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Войти
            </Link>
          </div>
        )}
        {user && isLoading && (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}
        {user && !isLoading && list.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            Пока пусто — добавьте варианты ♥
          </div>
        )}
        {list.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => <PropertyCard key={p.id} p={p} compact />)}
          </div>
        )}
      </div>
    </>
  );
}
