import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Загрузите файл изображения");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Размер аватара не должен превышать 5 МБ");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deleteAvatar(path: string | null | undefined) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function resolveAvatarUrl(path: string | null | undefined): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}
