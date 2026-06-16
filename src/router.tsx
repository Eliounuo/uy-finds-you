import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

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
