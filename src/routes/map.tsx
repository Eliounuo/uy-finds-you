import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/app-header";
import { propertiesQuery } from "@/lib/queries";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/map")({ component: MapPage });

// Brand color for all markers and clusters (YURTA)
const BRAND_COLOR = "#8B1A2B";
function tierColor(_price: number): string {
  return BRAND_COLOR;
}


function MapPage() {
  const { t } = useTranslation();
  const { data = [], isLoading } = useQuery(propertiesQuery());
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;
    let cancel = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
      await import("leaflet.markercluster");
      if (cancel || !ref.current || mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any).map(ref.current, { zoomControl: true }).setView([43.25, 76.93], 11);
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
          const children = c.getAllChildMarkers();
          const count = children.length;
          let sum = 0;
          let n = 0;
          for (const m of children) {
            const p = Number(m.options?.__price ?? 0);
            if (p > 0) { sum += p; n++; }
          }
          const avg = n > 0 ? sum / n : 0;
          const color = tierColor(avg);
          const size = count < 10 ? 36 : count < 100 ? 44 : 52;
          return (L as any).divIcon({
            html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};color:#fff;font-weight:800;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.35);border:3px solid #fff">${count}</div>`,
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
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !clusterRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const cluster = clusterRef.current;
      if (!cluster) return;
      cluster.clearLayers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markers: any[] = [];
      data.forEach((p) => {
        if (!p.lat || !p.lng) return;
        const price = Number(p.price_per_night) || 0;
        const color = tierColor(price);
        const label = formatKZT(price);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const icon = (L as any).divIcon({
          className: "uy-price",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<div style="display:grid;place-items:center;width:36px;height:36px;border-radius:999px;background:${color};color:#fff;font-weight:800;font-size:10px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap">${label}</div>`,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = (L as any)
          .marker([Number(p.lat), Number(p.lng)], { icon, __price: price })
          .bindPopup(`<b>${p.title}</b><br>${p.city}<br>${label}`);
        markers.push(m);
      });
      cluster.addLayers(markers);
    })();
  }, [data]);

  return (
    <>
      <AppHeader title={t("map.title")} />
      <div className="relative h-[calc(100vh-9rem)] w-full">
        <div ref={ref} className="absolute inset-0 bg-muted" />
        {isLoading && (
          <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow ring-1 ring-border">
            {t("map.loading")}
          </div>
        )}
        <div className="absolute bottom-3 right-3 z-[400] rounded-xl bg-card/95 px-3 py-2 text-[11px] shadow ring-1 ring-border backdrop-blur">
          <div className="mb-1 font-semibold text-foreground">Цена / сутки</div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full" style={{ background: "#22c55e" }} /> до 50K</div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full" style={{ background: "#f59e0b" }} /> 50–150K</div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full" style={{ background: "#ef4444" }} /> 150K+</div>
        </div>
      </div>
    </>
  );
}
