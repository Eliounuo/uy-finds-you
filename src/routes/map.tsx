import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/app-header";
import { propertiesQuery } from "@/lib/queries";
import { formatKZT } from "@/lib/mock-data";
import { Search, Navigation, Pencil, X, Loader2, MapPin } from "lucide-react";

export const Route = createFileRoute("/map")({ component: MapPage });

const BRAND_COLOR = "#8B1A2B";
const ALMATY: [number, number] = [43.25, 76.93];

// Ray-casting point-in-polygon
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [iLat, iLng] = polygon[i];
    const [jLat, jLng] = polygon[j];
    if (iLng > lng !== jLng > lng && lat < ((jLat - iLat) * (lng - iLng)) / (jLng - iLng) + iLat) {
      inside = !inside;
    }
  }
  return inside;
}

type NominatimResult = { lat: string; lon: string; display_name: string };

async function geocode(query: string): Promise<NominatimResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kz&limit=5`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "ru", "User-Agent": "yurta-app/1.0" },
    });
    if (!res.ok) return [];
    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

function MapPage() {
  const { t } = useTranslation();
  const { data = [], isLoading } = useQuery(propertiesQuery());

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userDotRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lassoPlineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lassoPolyRef = useRef<any>(null);
  const isDrawing = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);
  const [zoneCount, setZoneCount] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ── Init map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return;
    let cancel = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
      await import("leaflet.markercluster");
      if (cancel || !mapContainerRef.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any)
        .map(mapContainerRef.current, { zoomControl: true })
        .setView(ALMATY, 11);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (L as any)
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);
      mapRef.current = map;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 50,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        iconCreateFunction: (c: any) => {
          const count = c.getAllChildMarkers().length;
          const size = count < 10 ? 36 : count < 100 ? 44 : 52;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (L as any).divIcon({
            html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${BRAND_COLOR};color:#fff;font-weight:800;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.35);border:3px solid #fff">${count}</div>`,
            className: "uy-cluster",
            iconSize: [size, size],
          });
        },
      });
      map.addLayer(cluster);
      clusterRef.current = cluster;
      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 300);
    })();

    return () => {
      cancel = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterRef.current = null;
        userDotRef.current = null;
        lassoPlineRef.current = null;
        lassoPolyRef.current = null;
      }
    };
  }, []);

  // ── Geolocation on mount — center on user, not Almaty ──────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // ── Blue dot + map center when position arrives ─────────────────────
  useEffect(() => {
    if (!userPos) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      if (userDotRef.current) {
        userDotRef.current.remove();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dot = (L as any).divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.2)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userDotRef.current = (L as any)
        .marker(userPos, { icon: dot, zIndexOffset: 2000 })
        .bindPopup("Вы здесь")
        .addTo(map);
      map.setView(userPos, 13);
    })();
  }, [userPos]);

  // ── Markers ─────────────────────────────────────────────────────────
  const updateMarkers = useCallback(
    (filter: ((pos: [number, number]) => boolean) | null) => {
      if (!clusterRef.current) return;
      (async () => {
        const L = (await import("leaflet")).default;
        const cluster = clusterRef.current;
        if (!cluster) return;
        cluster.clearLayers();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const markers: any[] = [];
        data.forEach((p) => {
          if (!p.lat || !p.lng) return;
          const pos: [number, number] = [Number(p.lat), Number(p.lng)];
          if (filter && !filter(pos)) return;
          const price = Number(p.price_per_night) || 0;
          const label = formatKZT(price);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const icon = (L as any).divIcon({
            className: "uy-price",
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            html: `<div style="display:grid;place-items:center;width:36px;height:36px;border-radius:999px;background:${BRAND_COLOR};color:#fff;font-weight:800;font-size:10px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap">${label}</div>`,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = (L as any)
            .marker(pos, { icon, __price: price })
            .bindPopup(`<b>${p.title}</b><br>${p.city}<br>${label}`);
          markers.push(m);
        });
        cluster.addLayers(markers);
      })();
    },
    [data],
  );

  useEffect(() => {
    updateMarkers(null);
  }, [updateMarkers]);

  // ── Lasso / freehand draw ───────────────────────────────────────────
  const startLasso = useCallback(
    (e: PointerEvent) => {
      if (!drawMode || !mapRef.current) return;
      isDrawing.current = true;
      const ll = mapRef.current.mouseEventToLatLng(e);
      setLassoPoints([[ll.lat, ll.lng]]);
      mapRef.current.dragging.disable();
      mapRef.current.scrollWheelZoom.disable();
    },
    [drawMode],
  );

  const moveLasso = useCallback((e: PointerEvent) => {
    if (!isDrawing.current || !mapRef.current) return;
    const ll = mapRef.current.mouseEventToLatLng(e);
    const pt: [number, number] = [ll.lat, ll.lng];
    setLassoPoints((prev) => {
      const next = [...prev, pt];
      (async () => {
        const L = (await import("leaflet")).default;
        if (lassoPlineRef.current) {
          lassoPlineRef.current.setLatLngs(next);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lassoPlineRef.current = (L as any)
            .polyline(next, { color: BRAND_COLOR, weight: 2.5, dashArray: "6 4", opacity: 0.85 })
            .addTo(mapRef.current);
        }
      })();
      return next;
    });
  }, []);

  const endLasso = useCallback(() => {
    if (!isDrawing.current || !mapRef.current) return;
    isDrawing.current = false;
    mapRef.current.dragging.enable();
    mapRef.current.scrollWheelZoom.enable();

    setLassoPoints((pts) => {
      if (pts.length < 3) {
        if (lassoPlineRef.current) {
          lassoPlineRef.current.remove();
          lassoPlineRef.current = null;
        }
        return [];
      }
      (async () => {
        const L = (await import("leaflet")).default;
        if (lassoPlineRef.current) {
          lassoPlineRef.current.remove();
          lassoPlineRef.current = null;
        }
        if (lassoPolyRef.current) {
          lassoPolyRef.current.remove();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lassoPolyRef.current = (L as any)
          .polygon(pts, { color: BRAND_COLOR, weight: 2, fillOpacity: 0.08, dashArray: "6 4" })
          .addTo(mapRef.current);

        const matched = data.filter(
          (p) => p.lat && p.lng && pointInPolygon([Number(p.lat), Number(p.lng)], pts),
        );
        setZoneCount(matched.length);
        updateMarkers((pos) => pointInPolygon(pos, pts));
        if (lassoPolyRef.current && mapRef.current) {
          mapRef.current.fitBounds(lassoPolyRef.current.getBounds(), { padding: [20, 20] });
        }
      })();
      return pts;
    });
  }, [data, updateMarkers]);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    el.addEventListener("pointerdown", startLasso, { passive: true });
    el.addEventListener("pointermove", moveLasso, { passive: true });
    el.addEventListener("pointerup", endLasso);
    el.addEventListener("pointercancel", endLasso);
    return () => {
      el.removeEventListener("pointerdown", startLasso);
      el.removeEventListener("pointermove", moveLasso);
      el.removeEventListener("pointerup", endLasso);
      el.removeEventListener("pointercancel", endLasso);
    };
  }, [startLasso, moveLasso, endLasso]);

  const clearLasso = useCallback(() => {
    if (lassoPlineRef.current) {
      lassoPlineRef.current.remove();
      lassoPlineRef.current = null;
    }
    if (lassoPolyRef.current) {
      lassoPolyRef.current.remove();
      lassoPolyRef.current = null;
    }
    setLassoPoints([]);
    setZoneCount(null);
    setDrawMode(false);
    updateMarkers(null);
    if (mapRef.current) {
      mapRef.current.dragging.enable();
      mapRef.current.scrollWheelZoom.enable();
    }
  }, [updateMarkers]);

  const toggleDraw = () => {
    if (drawMode) {
      clearLasso();
    } else {
      clearLasso();
      setDrawMode(true);
    }
  };

  // ── City search ─────────────────────────────────────────────────────
  const handleSearchInput = (q: string) => {
    setSearchQ(q);
    setShowResults(q.length > 1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const results = await geocode(q);
      setSearchResults(results);
      setSearching(false);
      setShowResults(true);
    }, 500);
  };

  const handleSelectCity = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
      mapRef.current.flyTo([lat, lng], 12, { animate: true, duration: 0.8 });
      setTimeout(() => mapRef.current?.invalidateSize(), 900);
    }
    setSearchQ(r.display_name.split(",")[0] ?? r.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  const goToMyLocation = () => {
    if (userPos && mapRef.current) {
      mapRef.current.setView(userPos, 14);
    } else if (!locating) {
      setLocating(true);
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        () => setLocating(false),
      );
    }
  };

  // Plural helper for Russian
  const countWord = (n: number) =>
    n === 1 ? "квартира" : n >= 2 && n <= 4 ? "квартиры" : "квартир";

  return (
    <>
      <AppHeader title={t("map.title")} />
      <div className="relative h-[calc(100vh-9rem)] w-full">
        <div ref={mapContainerRef} className="absolute inset-0 bg-muted" />

        {/* Search bar */}
        <div className="pointer-events-auto absolute left-3 right-3 top-3 z-[1000]">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl bg-card/95 px-3 py-2.5 shadow-pop ring-1 ring-border backdrop-blur-sm">
              {searching ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <input
                type="text"
                value={searchQ}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchQ.length > 1 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Поиск города или района..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchQ && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQ("");
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl bg-card shadow-pop ring-1 ring-border">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => handleSelectCity(r)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls: location + draw */}
        <div className="pointer-events-auto absolute bottom-16 right-3 z-[1000] flex flex-col gap-2">
          <button
            type="button"
            onClick={goToMyLocation}
            title="Моё местоположение"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop ring-1 ring-border"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Navigation
                className={`h-4 w-4 ${userPos ? "fill-primary text-primary" : "text-muted-foreground"}`}
              />
            )}
          </button>

          <button
            type="button"
            onClick={toggleDraw}
            title={drawMode ? "Отменить" : "Обвести зону"}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-pop ring-1 transition-colors ${
              drawMode
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-card text-muted-foreground ring-border"
            }`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* Draw hint */}
        {drawMode && zoneCount === null && lassoPoints.length === 0 && (
          <div className="pointer-events-none absolute inset-x-4 bottom-28 z-[1000] flex justify-center">
            <div className="rounded-full bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-pop">
              Обведите зону пальцем или мышью
            </div>
          </div>
        )}

        {/* Zone result */}
        {zoneCount !== null && (
          <div className="pointer-events-auto absolute inset-x-4 bottom-28 z-[1000] flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-pop ring-1 ring-border">
            <span className="text-sm font-semibold">
              {zoneCount > 0
                ? `${zoneCount} ${countWord(zoneCount)} в зоне`
                : "В зоне нет объявлений"}
            </span>
            <button
              type="button"
              onClick={clearLasso}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold"
            >
              <X className="h-3 w-3" /> Очистить
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-x-0 top-16 z-[1000] flex justify-center">
            <div className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow ring-1 ring-border">
              {t("map.loading")}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
