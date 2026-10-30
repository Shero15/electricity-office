import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import type { LanguageCode } from "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Render a component inside the providers the app supplies at runtime:
 * TanStack Query, the language context, and a memory router so `Link` and
 * `useNavigate` resolve. `initialLanguage` seeds the persisted language so the
 * language gate is already passed.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: { language?: LanguageCode; queryClient?: QueryClient } = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = options.queryClient ?? makeQueryClient();
  if (options.language) {
    window.localStorage.setItem("eco.language", options.language);
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>{ui}</LanguageProvider>
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}

/**
 * Render a component at a route path so router hooks (`useParams`,
 * `useSearch`, `useNavigate`) work. The component is mounted as the route's
 * element, wrapped in the app providers. The router is loaded before render so
 * the matched route is present synchronously.
 */
export async function renderAtRoute(
  component: () => ReactNode,
  options: {
    path?: string;
    initialEntry?: string;
    language?: LanguageCode;
    queryClient?: QueryClient;
    withAuth?: boolean;
  } = {},
): Promise<RenderResult & { queryClient: QueryClient }> {
  const queryClient = options.queryClient ?? makeQueryClient();
  if (options.language) {
    window.localStorage.setItem("eco.language", options.language);
  }

  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: options.path ?? "/",
    component,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({
      initialEntries: [options.initialEntry ?? options.path ?? "/"],
    }),
  });
  await router.load();

  const tree = (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {options.withAuth ? (
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        ) : (
          <RouterProvider router={router} />
        )}
      </LanguageProvider>
    </QueryClientProvider>
  );

  const result = render(tree);

  return { ...result, queryClient };
}
