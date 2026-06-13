import { supabase } from "@/integrations/supabase/client";

export async function uploadPropertyPhoto(file: File, ownerId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("property-photos")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deletePropertyPhoto(path: string) {
  // ignore errors silently — path may have been a public URL legacy
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from("property-photos").remove([path]);
}

/** Resolve a stored path to a usable URL (signed, 1h). External http URLs pass-through. */
export async function resolvePhotoUrl(path: string): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage
    .from("property-photos")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

export async function resolvePhotoUrls(paths: string[]): Promise<string[]> {
  return Promise.all(paths.map(resolvePhotoUrl));
}
