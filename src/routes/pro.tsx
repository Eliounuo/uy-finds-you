import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pro")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_landlord")
      .eq("id", userRes.user.id)
      .maybeSingle();
    if (!profile?.is_landlord) throw redirect({ to: "/become-host" });
  },
  component: () => <Outlet />,
});
