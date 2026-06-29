import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, public_id, full_name, phone, whatsapp, telegram, avatar_url, mode, is_landlord")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

/** Shared TanStack Query cache — all components see the same profile. */
export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id ?? ""],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user && !authLoading,
    staleTime: 60_000,
  });

  const reload = () =>
    queryClient.invalidateQueries({ queryKey: ["profile", user?.id ?? ""] });

  // true once we have a settled result for the current user
  const hasFetched = !authLoading && !query.isPending;

  return {
    profile: query.data ?? null,
    loading: authLoading || query.isPending,
    reload,
    hasFetched,
  };
}

/** Push a confirmed save directly into the shared cache. */
export function useProfileCache() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const setProfile = (patch: Partial<Profile>) => {
    if (!user) return;
    queryClient.setQueryData<Profile | null>(
      ["profile", user.id],
      (old) => old ? { ...old, ...patch } : (patch as Profile),
    );
  };

  return { setProfile };
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
