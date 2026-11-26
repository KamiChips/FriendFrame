import type { QueryClient } from "@tanstack/react-query";
import { data, type LoaderFunctionArgs, type RouteObject } from "react-router";

import {
  auditQuery,
  currentUserQuery,
  dashboardQuery,
  reportQuery,
  reportsQuery,
  teamQuery,
  userQuery,
  usersQuery,
} from "@/api/queries";
import { Spinner } from "@/components/common/Feedback";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotFoundPage, RootErrorPage, RouteErrorPage } from "@/pages/ErrorPages";
import { auditSearchSchema, parseSearch, reportsSearchSchema, usersSearchSchema } from "@/schemas/search";

import { toReportQuery } from "./pages/reports/report-query";

// cada pagina se descarga solo cuando se visita por primera vez
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const searchOf = (request: Request) => new URL(request.url).searchParams;

// rutas de la consola. Los loaders arrancan la peticion de datos en cuanto empieza la navegacion
// (en paralelo con la descarga del codigo de la pagina) y la dejan en la cache de TanStack Query;
// la pagina lee de esa cache. Las secciones de admin no piden datos si la sesion no es admin
export function createRoutes(queryClient: QueryClient): RouteObject[] {
  const isAdmin = async () => (await queryClient.ensureQueryData(currentUserQuery())).role === "admin";

  // los detalles inexistentes responden 404 y los muestra el limite de errores
  const ensureFound = async <T,>(promise: Promise<T | null>) => {
    if ((await promise) === null) throw data(null, { status: 404 });
    return null;
  };

  return [
    {
      path: "/",
      lazy: page(() => import("@/pages/LoginPage")),
      errorElement: <RootErrorPage />,
      hydrateFallbackElement: <Spinner className="min-h-screen" />,
    },
    {
      element: <AppLayout />,
      errorElement: <RootErrorPage />,
      hydrateFallbackElement: <Spinner className="min-h-screen" />,
      loader: async () => {
        await queryClient.ensureQueryData(currentUserQuery());
        return null;
      },
      children: [
        {
          errorElement: <RouteErrorPage />,
          children: [
            {
              path: "dashboard",
              lazy: page(() => import("@/pages/DashboardPage")),
              loader: () => {
                void queryClient.prefetchQuery(dashboardQuery());
                return null;
              },
            },
            {
              path: "reports",
              lazy: page(() => import("@/pages/reports/ReportsPage")),
              loader: ({ request }: LoaderFunctionArgs) => {
                const search = parseSearch(reportsSearchSchema, searchOf(request));
                void queryClient.prefetchQuery(reportsQuery(toReportQuery(search)));
                return null;
              },
            },
            {
              path: "reports/:reportId",
              lazy: page(() => import("@/pages/reports/ReportDetailPage")),
              loader: ({ params }: LoaderFunctionArgs) =>
                ensureFound(queryClient.ensureQueryData(reportQuery(params.reportId!))),
            },
            {
              path: "users",
              lazy: page(() => import("@/pages/users/UsersPage")),
              loader: ({ request }: LoaderFunctionArgs) => {
                const { q, status } = parseSearch(usersSearchSchema, searchOf(request));
                void queryClient.prefetchQuery(usersQuery({ query: q, status }));
                return null;
              },
            },
            {
              path: "users/:userId",
              lazy: page(() => import("@/pages/users/UserProfilePage")),
              loader: ({ params }: LoaderFunctionArgs) =>
                ensureFound(queryClient.ensureQueryData(userQuery(params.userId!))),
            },
            {
              path: "audit",
              lazy: page(() => import("@/pages/AuditPage")),
              loader: async ({ request }: LoaderFunctionArgs) => {
                if (!(await isAdmin())) return null;
                const search = parseSearch(auditSearchSchema, searchOf(request));
                void queryClient.prefetchQuery(teamQuery());
                void queryClient.prefetchQuery(auditQuery(search));
                return null;
              },
            },
            {
              path: "team",
              lazy: page(() => import("@/pages/TeamPage")),
              loader: async () => {
                if (await isAdmin()) void queryClient.prefetchQuery(teamQuery());
                return null;
              },
            },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}
