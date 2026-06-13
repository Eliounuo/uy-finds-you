import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PropertyCard } from "@/components/property-card";
import { useApp } from "@/lib/app-mode";
import { properties } from "@/lib/mock-data";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  const { favorites } = useApp();
  const list = properties.filter((p) => favorites.includes(p.id));

  return (
    <>
      <AppHeader title="Избранное" />
      <div className="space-y-3 px-4 pt-2 pb-32">
        {list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-accent">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">Пока пусто</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Добавляйте квартиры в избранное — они появятся здесь.
            </p>
            <Link
              to="/"
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Подобрать
            </Link>
          </div>
        ) : (
          list.map((p) => <PropertyCard key={p.id} p={p} />)
        )}
      </div>
    </>
  );
}
