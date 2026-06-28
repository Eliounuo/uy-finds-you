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
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setFetchedForUserId(null);
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
    setFetchedForUserId(user.id);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  // true only after profile was actually fetched for the current user
  const hasFetched = fetchedForUserId === (user?.id ?? null);

  return { profile, loading: loading || authLoading, reload, hasFetched };
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
