import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { propertiesQuery } from "@/lib/queries";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/map")({ component: MapPage });

function MapPage() {
  const { data = [] } = useQuery(propertiesQuery());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined" || data.length === 0) return;
    let cancel = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancel || !ref.current) return;
      const map = L.map(ref.current).setView([43.25, 76.93], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM" }).addTo(map);
      data.forEach((p) => {
        if (!p.lat || !p.lng) return;
        const icon = L.divIcon({ className: "uy-price", html: `<div style="background:#ea5a2e;color:#fff;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25)">${formatKZT(p.price_per_night)}</div>` });
        L.marker([Number(p.lat), Number(p.lng)], { icon }).addTo(map).bindPopup(`<b>${p.title}</b><br>${p.city}`);
      });
      return () => map.remove();
    })();
    return () => { cancel = true; };
  }, [data]);

  return (
    <>
      <AppHeader title="Карта" />
      <div ref={ref} className="h-[calc(100vh-12rem)] w-full" />
    </>
  );
}
