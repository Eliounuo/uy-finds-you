import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, CalendarDays, Users, Wallet, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { formatKZT, CITIES, ACTIVE_CITIES } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create-request")({ component: CreateRequest });

const guestsOptions = [1, 2, 3, 4, 5, 6];

function CreateRequest() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [city, setCity] = useState<string>("Кокшетау");
  const [district, setDistrict] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [guests, setGuests] = useState(2);
  const [budget, setBudget] = useState(25000);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Геолокация недоступна");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        toast.success("Координаты добавлены");
      },
      () => toast.error("Не удалось определить координаты"),
    );
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("AUTH_REQUIRED");
      if (!checkIn || !checkOut) throw new Error("Выберите даты");
      const { error } = await supabase.from("requests").insert({
        client_id: user.id, city,
        district: district.trim() || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        check_in: checkIn, check_out: checkOut,
        guests, budget_max: budget, notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setDone(true); setTimeout(() => navigate({ to: "/requests" }), 1200); },
    onError: (e: Error) => {
      if (e.message === "AUTH_REQUIRED") {
        toast.info("Войдите, чтобы отправить заявку");
        navigate({ to: "/auth" });
        return;
      }
      toast.error(e.message);
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-success text-success-foreground">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">Заявка отправлена</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">Владельцы получат вашу заявку и пришлют предложения.</p>
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Новая заявка" back />
      <div className="space-y-5 px-4 pt-2 pb-32">
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-transparent p-4 ring-1 ring-primary/20">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> 30 секунд
          </div>
          <p className="mt-1 text-sm text-foreground">Опишите, что вы хотите — владельцы пришлют предложения.</p>
        </div>

        <Section icon={MapPin} title="Город">
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
            {CITIES.map((c) => {
              const isActive = ACTIVE_CITIES.includes(c);
              return (
                <button
                  key={c}
                  disabled={!isActive}
                  onClick={() => isActive && setCity(c)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                    c === city
                      ? "bg-foreground text-background"
                      : isActive
                        ? "bg-card text-muted-foreground ring-1 ring-border"
                        : "cursor-not-allowed bg-muted text-muted-foreground/50 ring-1 ring-border/50"
                  )}
                >
                  {c}
                  {!isActive && <span className="ml-1 text-[10px] opacity-60">скоро</span>}
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={MapPin} title="Район и точка на карте">
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Район (например: Медеу)"
            className="w-full rounded-xl bg-card px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
              placeholder="Широта"
              className="rounded-xl bg-card px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-muted-foreground"
            />
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
              placeholder="Долгота"
              className="rounded-xl bg-card px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-semibold text-primary ring-1 ring-primary/20"
            >
              <MapPin className="h-3.5 w-3.5" /> GPS
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Координаты помогают подобрать жильё рядом.</p>
        </Section>


        <Section icon={CalendarDays} title="Даты">
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="text-[11px] uppercase text-muted-foreground">Заезд</div>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none"/>
            </label>
            <label className="rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="text-[11px] uppercase text-muted-foreground">Выезд</div>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none"/>
            </label>
          </div>
        </Section>

        <Section icon={Users} title="Гостей">
          <div className="flex flex-wrap gap-2">
            {guestsOptions.map((g) => (
              <button key={g} onClick={() => setGuests(g)}
                className={cn("h-11 w-11 rounded-full text-sm font-semibold",
                  g === guests ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-border")}>{g}</button>
            ))}
          </div>
        </Section>

        <Section icon={Wallet} title={`Бюджет до ${formatKZT(budget)} / сутки`}>
          <input type="range" min={5000} max={100000} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-[var(--color-primary)]"/>
        </Section>

        <Section title="Пожелания">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Тихий двор, рядом метро…" rows={3} maxLength={500}
            className="w-full resize-none rounded-xl bg-card p-3 text-sm outline-none ring-1 ring-border placeholder:text-muted-foreground"/>
        </Section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur-lg">
        <button onClick={() => submit.mutate()} disabled={submit.isPending}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground shadow-glow disabled:opacity-60">
          {submit.isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : "Отправить заявку"}
        </button>
      </div>
    </>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
