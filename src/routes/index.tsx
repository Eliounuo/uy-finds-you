import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, ArrowRight, Zap, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PropertyCard } from "@/components/property-card";
import { propertiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  component: Home,
});

const cities = ["Все", "Кокшетау", "Алматы", "Астана", "Шымкент", "Караганда", "Актау"];
const activeCities = new Set(["Все", "Кокшетау"]);

function Home() {
  const [city, setCity] = useState("Кокшетау");
  const [q, setQ] = useState("");
  const { data: list = [], isLoading } = useQuery(propertiesQuery({ city, search: q }));

  return (
    <>
      <AppHeader />

      <div className="space-y-4 px-4 pt-2">
        <Link
          to="/create-request"
          className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_22)] p-5 text-primary-foreground shadow-glow"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Новая идея
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight">
            Не ищите квартиру.<br />
            <span className="opacity-90">Пусть она найдёт вас.</span>
          </h2>
          <p className="mt-1.5 text-sm opacity-90">
            Создайте заявку за 30 секунд — владельцы пришлют предложения сами.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background/20 px-3.5 py-1.5 text-sm font-semibold backdrop-blur">
            <Zap className="h-3.5 w-3.5" />
            Создать заявку
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </Link>

        <div className="flex items-center gap-2 rounded-2xl bg-card px-3.5 py-3 shadow-card ring-1 ring-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Название, район…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
          {cities.map((c) => {
            const isActiveCity = activeCities.has(c);
            const selected = c === city;
            return (
              <button
                key={c}
                disabled={!isActiveCity}
                onClick={() => isActiveCity && setCity(c)}
                className={
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors " +
                  (selected
                    ? "bg-foreground text-background"
                    : isActiveCity
                      ? "bg-card text-muted-foreground ring-1 ring-border"
                      : "cursor-not-allowed bg-muted text-muted-foreground/50 ring-1 ring-border/50")
                }
              >
                {c}
                {!isActiveCity && (
                  <span className="ml-1 text-[10px] opacity-60">скоро</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <h3 className="font-display text-lg font-bold">Подобрано для вас</h3>
          <span className="text-xs text-muted-foreground">{list.length} вариантов</span>
        </div>

        <div className="space-y-3 pb-32">
          {isLoading && (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          )}
          {!isLoading && list.length === 0 && (
            <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
              По выбранным фильтрам ничего не найдено
            </div>
          )}
          {list[0] && <PropertyCard p={list[0]} />}
          {list.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {list.slice(1, 3).map((p) => (
                <PropertyCard key={p.id} p={p} compact />
              ))}
            </div>
          )}
          {list.slice(3).map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </>
  );
}
