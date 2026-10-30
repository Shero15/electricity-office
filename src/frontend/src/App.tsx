import { LanguageGate } from "@/components/LanguageGate";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { AdminPage } from "@/pages/AdminPage";
import { AppointmentDetailPage } from "@/pages/AppointmentDetailPage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { BookPage } from "@/pages/BookPage";
import { HomePage } from "@/pages/HomePage";
import { LocationsPage } from "@/pages/LocationsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { SignInPage } from "@/pages/SignInPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <Layout>
      <NotFoundPage />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: ServicesPage,
});

const locationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations",
  component: LocationsPage,
});

const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/book",
  validateSearch: (search: Record<string, unknown>) => ({
    service: typeof search.service === "string" ? search.service : undefined,
  }),
  component: BookRouteComponent,
});

const appointmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/appointments",
  component: AppointmentsRouteComponent,
});

const appointmentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/appointments/$appointmentId",
  validateSearch: (search: Record<string, unknown>) => ({
    booked: typeof search.booked === "string" ? search.booked : undefined,
  }),
  component: AppointmentDetailRouteComponent,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminRouteComponent,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  component: SignInPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterRouteComponent,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfileRouteComponent,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  servicesRoute,
  locationsRoute,
  bookRoute,
  appointmentsRoute,
  appointmentDetailRoute,
  adminRoute,
  signInRoute,
  registerRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function BookRouteComponent() {
  const { service } = bookRoute.useSearch();
  return (
    <Layout>
      <BookPage initialServiceId={service} />
    </Layout>
  );
}

function AppointmentsRouteComponent() {
  return (
    <Layout>
      <ProtectedRoute>
        <AppointmentsPage />
      </ProtectedRoute>
    </Layout>
  );
}

function AppointmentDetailRouteComponent() {
  const { appointmentId } = appointmentDetailRoute.useParams();
  const { booked } = appointmentDetailRoute.useSearch();
  return (
    <Layout>
      <ProtectedRoute>
        <AppointmentDetailPage
          appointmentId={appointmentId}
          justBooked={booked === "1"}
        />
      </ProtectedRoute>
    </Layout>
  );
}

function AdminRouteComponent() {
  return (
    <Layout>
      <ProtectedRoute requiredRole="admin">
        <AdminPage />
      </ProtectedRoute>
    </Layout>
  );
}

function RegisterRouteComponent() {
  return (
    <Layout>
      <RegisterPage />
    </Layout>
  );
}

function ProfileRouteComponent() {
  return (
    <Layout>
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    </Layout>
  );
}

function Shell() {
  const { hasChosen } = useLanguage();

  if (!hasChosen) {
    return <LanguageGate />;
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}
