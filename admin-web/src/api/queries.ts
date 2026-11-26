import { QueryClient, queryOptions } from "@tanstack/react-query";

import { type AuditQuery, moderation, type ReportQuery, type UserQuery } from "@/services/moderation";

// cada cuanto se revisa si hay reportes nuevos mientras la cola esta abierta
export const QUEUE_POLL_MS = 30_000;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // los datos se consideran frescos 30 s: navegar de ida y vuelta no repite peticiones
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: 0 },
    },
  });
}

// llaves jerarquicas: invalidar ["moderation"] refresca todo lo que viene del servicio
export const keys = {
  all: ["moderation"] as const,
  session: () => [...keys.all, "session"] as const,
  sectionCounts: () => [...keys.all, "section-counts"] as const,
  dashboard: () => [...keys.all, "dashboard"] as const,
  reports: (query: ReportQuery) => [...keys.all, "reports", query] as const,
  report: (id: string) => [...keys.all, "report", id] as const,
  users: (query: UserQuery) => [...keys.all, "users", query] as const,
  user: (id: string) => [...keys.all, "user", id] as const,
  audit: (query: AuditQuery) => [...keys.all, "audit", query] as const,
  team: () => [...keys.all, "team"] as const,
};

export const currentUserQuery = () =>
  queryOptions({ queryKey: keys.session(), queryFn: () => moderation.getCurrentUser(), staleTime: Infinity });

export const sectionCountsQuery = () =>
  queryOptions({
    queryKey: keys.sectionCounts(),
    queryFn: () => moderation.getSectionCounts(),
    refetchInterval: QUEUE_POLL_MS,
  });

export const dashboardQuery = () =>
  queryOptions({ queryKey: keys.dashboard(), queryFn: () => moderation.getDashboard() });

export const reportsQuery = (query: ReportQuery) =>
  queryOptions({
    queryKey: keys.reports(query),
    queryFn: () => moderation.getReports(query),
    // la cola se actualiza sola para avisar de reportes nuevos
    refetchInterval: QUEUE_POLL_MS,
  });

export const reportQuery = (id: string) =>
  queryOptions({ queryKey: keys.report(id), queryFn: () => moderation.getReport(id) });

export const usersQuery = (query: UserQuery) =>
  queryOptions({ queryKey: keys.users(query), queryFn: () => moderation.getUsers(query) });

export const userQuery = (id: string) =>
  queryOptions({ queryKey: keys.user(id), queryFn: () => moderation.getUser(id) });

export const auditQuery = (query: AuditQuery) =>
  queryOptions({ queryKey: keys.audit(query), queryFn: () => moderation.getAuditLog(query) });

export const teamQuery = () => queryOptions({ queryKey: keys.team(), queryFn: () => moderation.getTeam() });

// id de una cuenta a partir de su @handle, para enlazar a su perfil
export const userIdByHandleQuery = (handle: string) =>
  queryOptions({
    queryKey: [...keys.all, "user-id", handle] as const,
    queryFn: () => moderation.findUserIdByHandle(handle),
    staleTime: Infinity,
  });
