import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/lib/use-profile";
import { isProfileComplete } from "@/lib/profile-validation";

// Routes the gate must NOT redirect away from
const ALLOWED_INCOMPLETE = new Set<string>(["/complete-profile", "/auth"]);

/**
 * Mounts inside the root component and forces signed-in users with an
 * incomplete profile (missing/invalid name or phone) to `/complete-profile`.
 */
export function ProfileGate() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) return;
    if (ALLOWED_INCOMPLETE.has(pathname)) return;
    if (!profile || !isProfileComplete(profile)) {
      navigate({ to: "/complete-profile", search: { next: pathname } });
    }
  }, [authLoading, profileLoading, user, profile, pathname, navigate]);

  return null;
}
