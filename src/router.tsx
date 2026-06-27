import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { captureException } from "@/lib/monitoring/sentry";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        onError: (error) => captureException(error, { source: "mutation" }),
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Preloading chunks on intent caused "Importing a module script failed"
    // races in preview after hot rebuilds. Disable preloading — TanStack Query
    // staleTime keeps navigations fast without prefetching JS chunks.
    defaultPreload: false,
  });

  return router;
};
