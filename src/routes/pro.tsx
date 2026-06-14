import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/app-mode";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/pro")({
  component: ProLayout,
});

function ProLayout() {
  const { user, loading } = useAuth();
  const { isLandlord } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!isLandlord) navigate({ to: "/become-host" });
  }, [user, loading, isLandlord, navigate]);

  return <Outlet />;
}
