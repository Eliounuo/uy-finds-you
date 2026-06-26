// Helpers for "preferred check-in time" on requests.

export type CheckinSlot =
  | "urgent"
  | "today_morning"
  | "today_afternoon"
  | "today_evening"
  | "tomorrow_morning"
  | "tomorrow_afternoon"
  | "tomorrow_evening"
  | "custom";

export const CHECKIN_SLOT_LABELS: Record<CheckinSlot, string> = {
  urgent: "Ближайшее время",
  today_morning: "Сегодня — утро",
  today_afternoon: "Сегодня — день",
  today_evening: "Сегодня — вечер",
  tomorrow_morning: "Завтра — утро",
  tomorrow_afternoon: "Завтра — день",
  tomorrow_evening: "Завтра — вечер",
  custom: "Выбрать дату и время",
};

// Time options for custom check-in: 06:00 → 23:00 every 30 min.
export const CHECKIN_TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 23) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

// Hour at which we materialise each slot (local time).
const SLOT_HOURS: Record<Exclude<CheckinSlot, "urgent" | "custom">, { day: 0 | 1; hour: number }> = {
  today_morning: { day: 0, hour: 9 },
  today_afternoon: { day: 0, hour: 15 },
  today_evening: { day: 0, hour: 20 },
  tomorrow_morning: { day: 1, hour: 9 },
  tomorrow_afternoon: { day: 1, hour: 15 },
  tomorrow_evening: { day: 1, hour: 20 },
};

export function slotToDateTime(slot: CheckinSlot, customISO?: string | null): string | null {
  if (slot === "urgent") return null;
  if (slot === "custom") return customISO ? new Date(customISO).toISOString() : null;
  const cfg = SLOT_HOURS[slot];
  const d = new Date();
  d.setDate(d.getDate() + cfg.day);
  d.setHours(cfg.hour, 0, 0, 0);
  return d.toISOString();
}

export function formatCheckinDisplay(opts: {
  is_urgent?: boolean | null;
  checkin_slot?: string | null;
  preferred_checkin_time?: string | null;
}): string | null {
  if (opts.is_urgent) return "⚡ Ближайшее время";
  const slot = opts.checkin_slot as CheckinSlot | null | undefined;
  if (slot && slot !== "custom" && CHECKIN_SLOT_LABELS[slot]) {
    return `Заезд: ${CHECKIN_SLOT_LABELS[slot]}`;
  }
  if (opts.preferred_checkin_time) {
    const d = new Date(opts.preferred_checkin_time);
    return `Заезд: ${d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return null;
}
