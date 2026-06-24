import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useAvatarUrl, useProfile } from "@/lib/use-profile";
import { deleteAvatar, uploadAvatar } from "@/lib/avatars";
import {
  normalizePhone,
  validateFullName,
  validatePhone,
} from "@/lib/profile-validation";

export const Route = createFileRoute("/profile/edit")({
  component: EditProfile,
});

function EditProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading, reload } = useProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const avatarUrl = useAvatarUrl(avatarPath);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setWhatsapp(profile.whatsapp ?? "");
    setTelegram(profile.telegram ?? "");
    setAvatarPath(profile.avatar_url ?? null);
  }, [profile]);

  const handleAvatar = async (file: File | null) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const prev = avatarPath;
      const newPath = await uploadAvatar(file, user.id);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: newPath })
        .eq("id", user.id);
      if (error) throw error;
      setAvatarPath(newPath);
      if (prev) await deleteAvatar(prev);
      await reload();
      toast.success("Аватар обновлён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarPath) return;
    setUploading(true);
    try {
      const prev = avatarPath;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;
      setAvatarPath(null);
      await deleteAvatar(prev);
      await reload();
      toast.success("Аватар удалён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const nameErr = validateFullName(fullName);
    const phoneErr = validatePhone(phone);
    setErrors({ name: nameErr ?? undefined, phone: phoneErr ?? undefined });
    if (nameErr || phoneErr) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim().replace(/\s+/g, " "),
          phone: normalizePhone(phone),
          whatsapp: whatsapp.trim() || null,
          telegram: telegram.trim().replace(/^@/, "") || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      await reload();
      toast.success("Профиль сохранён");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Редактировать профиль" back />
      <div className="space-y-5 px-4 pt-2 pb-32">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted ring-2 ring-border">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <UserCircle2 className="h-16 w-16" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Из галереи
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-semibold ring-1 ring-border disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" /> Снять фото
            </button>
            {avatarPath && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-semibold text-destructive ring-1 ring-border disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Удалить
              </button>
            )}
          </div>

          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatar(e.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleAvatar(e.target.files?.[0] ?? null)}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Имя и фамилия
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Номер телефона
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+7 700 123 45 67"
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary"
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} placeholder="+7…"
                className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telegram</label>
              <input type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)} maxLength={40} placeholder="username"
                className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm ring-1 ring-border outline-none focus:ring-primary" />
            </div>
          </div>
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Контакты видны только после подтверждённого бронирования.
          </p>


          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </button>
        </form>
      </div>
    </>
  );
}
