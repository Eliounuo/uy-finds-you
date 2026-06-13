import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export function useFavorites() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["favorites-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("property_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.property_id));
    },
  });
  return data ?? new Set<string>();
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, isFav }: { propertyId: string; isFav: boolean }) => {
      if (!user) throw new Error("Войдите, чтобы добавить в избранное");
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites-ids"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
