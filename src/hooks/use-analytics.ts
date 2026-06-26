import { track, identifyUser, pageView } from "@/lib/analytics/posthog";

export function useAnalytics() {
  return { track, identifyUser, pageView };
}
