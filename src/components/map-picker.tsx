import { useEffect, useRef } from "react";
import { MapPin, Crosshair } from "lucide-react";
import { toast } from "sonner";

type LatLng = { lat: number; lng: number };

const CITY_CENTERS: Record<string, LatLng> = {
  "Алматы": { lat: 43.238949, lng: 76.889709 },
  "Астана": { lat: 51.169392, lng: 71.449074 },
  "Кокшетау": { lat: 53.284133, lng: 69.395039 },
  "Шымкент": { lat: 42.317025, lng: 69.587142 },
};

export function MapPicker({
  value,
  onChange,
  city,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  city?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const start: LatLng =
        value ?? CITY_CENTERS[city ?? ""] ?? { lat: 51.169392, lng: 71.449074 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any).map(containerRef.current).setView([start.lat, start.lng], value ? 14 : 12);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (L as any).tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OSM",
      }).addTo(map);

      const icon = (L as unknown as { divIcon: (o: object) => unknown }).divIcon({
        className: "uy-pin",
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#ea5a2e;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const marker = (L as any).marker([start.lat, start.lng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;
      mapRef.current = map;

      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        onChange({ lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) });
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        onChange({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
      });
    })();

    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = mapRef.current as any;
      if (m && typeof m.remove === "function") m.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when city changes and there's no value yet
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapRef.current as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marker = markerRef.current as any;
    if (!map || !marker || value || !city) return;
    const c = CITY_CENTERS[city];
    if (!c) return;
    map.setView([c.lat, c.lng], 12);
  }, [city, value]);

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Геолокация недоступна");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = mapRef.current as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marker = markerRef.current as any;
        if (map && marker) {
          marker.setLatLng(next);
          map.setView(next, 15);
        }
        onChange(next);
      },
      () => toast.error("Не удалось определить координаты"),
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl ring-1 ring-border">
        <div ref={containerRef} className="h-56 w-full" />
        <button
          type="button"
          onClick={locate}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold shadow ring-1 ring-border"
        >
          <Crosshair className="h-3.5 w-3.5" /> Моя точка
        </button>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {value
          ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} · перетащите маркер или нажмите на карту`
          : "Нажмите на карту, чтобы отметить точку"}
      </div>
    </div>
  );
}
