// Free geocoding via Nominatim (OpenStreetMap). Rate limit: ~1 req/sec.
const UA = "YURTA-App/1.0 (https://yurta.app)";

export async function geocodeAddress(
  address: string,
  city?: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = [address, city, "Казахстан"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=kz`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "ru" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "ru" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}
