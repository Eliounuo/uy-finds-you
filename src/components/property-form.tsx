import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Camera, CheckCircle2, AlertCircle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { propertyQuery } from "@/lib/queries";
import { ALL_AMENITIES, CITIES, amenityLabels } from "@/lib/mock-data";
import { MapPicker } from "@/components/map-picker";
import {
  uploadPropertyPhoto,
  deletePropertyPhoto,
  resolvePhotoUrls,
} from "@/lib/use-property-photos";

type Mode = "create" | "edit";

type FormState = {
  title: string;
  description: string;
  city: string;
  district: string;
  address: string;
  lat: string;
  lng: string;
  price_per_night: string;
  rooms: string;
  beds: string;
  guests: string;
  area: string;
  amenities: string[];
  photos: string[]; // storage paths
  status: string;
};

const empty: FormState = {
  title: "",
  description: "",
  city: CITIES[0],
  district: "",
  address: "",
  lat: "",
  lng: "",
  price_per_night: "",
  rooms: "1",
  beds: "1",
  guests: "2",
  area: "",
  amenities: [],
  photos: [],
  status: "active",
};

export function PropertyForm({ mode, propertyId }: { mode: Mode; propertyId?: string }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: existing, isLoading: loadingExisting } = useQuery({
    ...propertyQuery(propertyId ?? ""),
    enabled: mode === "edit" && !!propertyId,
  });

  const [form, setForm] = useState<FormState>(empty);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? "",
        city: existing.city,
        district: existing.district ?? "",
        address: existing.address ?? "",
        price_per_night: String(existing.price_per_night),
        rooms: String(existing.rooms ?? ""),
        beds: String(existing.beds ?? ""),
        guests: String(existing.guests ?? ""),
        area: String(existing.area ?? ""),
        amenities: existing.amenities ?? [],
        photos: existing.photos ?? [],
        status: existing.status,
      });
    }
  }, [mode, existing]);

  useEffect(() => {
    let alive = true;
    resolvePhotoUrls(form.photos).then((urls) => {
      if (alive) setPreviews(urls);
    });
    return () => {
      alive = false;
    };
  }, [form.photos]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const toggleAmenity = (a: string) =>
    setForm((s) => ({
      ...s,
      amenities: s.amenities.includes(a)
        ? s.amenities.filter((x) => x !== a)
        : [...s.amenities, a],
    }));

  async function handleFiles(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name}: больше 8 МБ`);
          continue;
        }
        const path = await uploadPropertyPhoto(file, user.id);
        paths.push(path);
      }
      if (paths.length) setForm((s) => ({ ...s, photos: [...s.photos, ...paths] }));
    } catch (e: any) {
      toast.error(e.message || "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(path: string) {
    setForm((s) => ({ ...s, photos: s.photos.filter((p) => p !== path) }));
    deletePropertyPhoto(path).catch(() => {});
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.price_per_night) {
      toast.error("Заполните название и цену");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        city: form.city,
        district: form.district.trim() || null,
        address: form.address.trim() || null,
        price_per_night: Number(form.price_per_night),
        rooms: form.rooms ? Number(form.rooms) : null,
        beds: form.beds ? Number(form.beds) : null,
        guests: form.guests ? Number(form.guests) : null,
        area: form.area ? Number(form.area) : null,
        amenities: form.amenities,
        photos: form.photos,
        status: form.status,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("properties")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Объект создан");
        navigate({ to: "/property/$id", params: { id: data.id } });
      } else if (propertyId) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", propertyId);
        if (error) throw error;
        toast.success("Сохранено");
        navigate({ to: "/pro" });
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!propertyId) return;
    if (!confirm("Удалить объект? Это действие необратимо.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("properties").delete().eq("id", propertyId);
      if (error) throw error;
      // best-effort photo cleanup
      for (const p of form.photos) deletePropertyPhoto(p).catch(() => {});
      toast.success("Объект удалён");
      navigate({ to: "/pro" });
    } catch (e: any) {
      toast.error(e.message || "Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading || (mode === "edit" && loadingExisting)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        <p>Войдите как владелец, чтобы добавлять объекты.</p>
        <Link to="/auth" className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/pro" })} className="-ml-2 p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold">
          {mode === "create" ? "Новый объект" : "Редактирование"}
        </h1>
      </header>

      <form onSubmit={handleSave} className="space-y-5 px-4 py-4 pb-32">
        {/* Photos */}
        <section className="space-y-2">
          <Label>Фотографии</Label>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div key={form.photos[i]} className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                {url && <img src={url} alt="" className="h-full w-full object-cover" />}
                <button
                  type="button"
                  onClick={() => removePhoto(form.photos[i])}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                  aria-label="Удалить фото"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px]">Добавить</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">До 8 МБ на фото. Первое фото — обложка.</p>
        </section>

        <Field label="Название">
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Уютная студия в центре"
            className={inputCls}
            required
          />
        </Field>

        <Field label="Описание">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            placeholder="Что особенного в вашем жилье?"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Город">
            <select
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputCls}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Район">
            <input
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              placeholder="Медеу"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Адрес">
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="ул. Абая, 10"
            className={inputCls}
          />
        </Field>

        <Field label="Цена за сутки, ₸">
          <input
            type="number"
            inputMode="numeric"
            value={form.price_per_night}
            onChange={(e) => update("price_per_night", e.target.value)}
            placeholder="25000"
            className={inputCls}
            required
          />
        </Field>

        <div className="grid grid-cols-4 gap-2">
          <Field label="Комнат">
            <input type="number" min="0" value={form.rooms} onChange={(e) => update("rooms", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Кроватей">
            <input type="number" min="0" value={form.beds} onChange={(e) => update("beds", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Гостей">
            <input type="number" min="1" value={form.guests} onChange={(e) => update("guests", e.target.value)} className={inputCls} />
          </Field>
          <Field label="м²">
            <input type="number" min="0" value={form.area} onChange={(e) => update("area", e.target.value)} className={inputCls} />
          </Field>
        </div>

        <section className="space-y-2">
          <Label>Удобства</Label>
          <div className="flex flex-wrap gap-2">
            {ALL_AMENITIES.map((a) => {
              const on = form.amenities.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                    on
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-foreground ring-border"
                  }`}
                >
                  {amenityLabels[a] ?? a}
                </button>
              );
            })}
          </div>
        </section>

        <Field label="Статус">
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className={inputCls}
          >
            <option value="active">Активен</option>
            <option value="paused">На паузе</option>
            <option value="archived">Архив</option>
          </select>
        </Field>

        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Опубликовать" : "Сохранить"}
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-card py-3 text-sm font-semibold text-destructive ring-1 ring-border disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Удалить объект
            </button>
          )}
        </div>
      </form>
    </>
  );
}

const inputCls =
  "w-full rounded-xl border-0 bg-card px-3 py-2.5 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary";

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
