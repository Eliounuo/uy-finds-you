import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { AppHeader } from "@/components/app-header";
import { properties, formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

function MapPage() {
  useEffect(() => {
    // Fix default icon paths
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const priceIcon = (price: number) =>
    L.divIcon({
      className: "",
      html: `<div style="background:var(--color-primary);color:var(--color-primary-foreground);padding:4px 10px;border-radius:9999px;font-weight:700;font-size:12px;font-family:var(--font-sans);box-shadow:0 4px 12px rgba(0,0,0,0.18);white-space:nowrap">${formatKZT(price)}</div>`,
      iconSize: [80, 28],
      iconAnchor: [40, 14],
    });

  return (
    <div className="flex h-screen flex-col">
      <AppHeader title="Карта" />
      <div className="relative flex-1">
        <MapContainer
          center={[48.0196, 66.9237]}
          zoom={5}
          className="absolute inset-0"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {properties.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={priceIcon(p.price)}>
              <Popup>
                <Link
                  to="/property/$id"
                  params={{ id: p.id }}
                  className="block w-48"
                >
                  <img src={p.images[0]} alt={p.title} className="h-24 w-full rounded-md object-cover" />
                  <div className="mt-1 font-semibold">{p.title}</div>
                  <div className="text-xs text-gray-500">{p.city}, {p.district}</div>
                  <div className="mt-1 font-bold">{formatKZT(p.price)} / ночь</div>
                </Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
