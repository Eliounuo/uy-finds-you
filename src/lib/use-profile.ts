import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { resolveAvatarUrl } from "@/lib/avatars";

export type Profile = {
  id: string;
  public_id: string | null;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  avatar_url: string | null;
  mode: "lite" | "pro";
  is_landlord: boolean;
};

/** Fetches the signed-in user's profile row. Re-fetches on user change. */
export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, public_id, full_name, phone, whatsapp, telegram, avatar_url, mode, is_landlord")
      .eq("id", user.id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  return { profile, loading: loading || authLoading, reload };
}

/** Returns a signed URL for the current user's avatar, refreshing when path changes. */
export function useAvatarUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl("");
      return;
    }
    resolveAvatarUrl(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}
