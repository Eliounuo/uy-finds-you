// Shared formatting + label helpers used across the app.
// Real data lives in Supabase; see src/lib/queries.ts.

export const formatKZT = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;

export const amenityLabels: Record<string, string> = {
  wifi: "Wi-Fi",
  kitchen: "Кухня",
  washer: "Стиральная",
  ac: "Кондиционер",
  parking: "Парковка",
  tv: "ТВ",
  balcony: "Балкон",
  gym: "Спортзал",
  pool: "Бассейн",
  workspace: "Рабочее место",
  jacuzzi: "Джакузи",
  crib: "Кроватка",
};

export const ALL_AMENITIES = Object.keys(amenityLabels);

export const CITIES = ["Алматы", "Астана", "Шымкент", "Караганда", "Актау"] as const;

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

export const nightsBetween = (a: string, b: string) => {
  const ms = +new Date(b) - +new Date(a);
  return Math.max(1, Math.round(ms / 86400000));
};
