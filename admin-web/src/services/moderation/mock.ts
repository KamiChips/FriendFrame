import type { CurrentUser } from "@/types/moderation";
import { auditEntries, teamMembers } from "@/fixtures/audit";
import { metrics, reasons, reviewCases, weeklyReports } from "@/fixtures/dashboard";
import { pendingReport, unavailableEvidence } from "@/fixtures/report-detail";
import { reports } from "@/fixtures/reports";
import { adminUser, moderatorUser, teamEmailDomain } from "@/fixtures/session";
import { suspendedProfile, users } from "@/fixtures/users";
import { addDays, formatDate } from "@/lib/format";
import type {
  AccountStatus,
  AuditAction,
  AuditEntry,
  Report,
  ReportDetail,
  Resolution,
  ResolutionAction,
  TeamMember,
  UserAccount,
  UserProfile,
} from "@/types/moderation";

import { AuthError, type ModerationService } from "./types";

// servicio en memoria con los datos del diseno; permite recorrer la app sin backend.
// los cambios (tomar casos, restaurar cuentas...) duran hasta recargar la pagina

// la cola del diseno empieza en FF-1048 y baja de uno en uno
const FIRST_CODE = 1048;
const MIN_PASSWORD_LENGTH = 6;

const resolutionToAudit: Record<ResolutionAction, AuditAction> = {
  dismiss: "dismissed_report",
  hide_content: "hid_content",
  warn: "warned_author",
  suspend: "suspended_account",
  ban: "banned_account",
};

// estado en que queda la cuenta del autor tras cada accion; ausente si no cambia
const resolutionToStatus: Partial<Record<ResolutionAction, AccountStatus>> = {
  suspend: "suspended",
  ban: "banned",
};

interface State {
  currentUser: CurrentUser;
  reports: Report[];
  revealed: Set<string>;
  // reportes fuera de la cola que se cerraron junto con otro
  closedRelated: Set<string>;
  users: UserAccount[];
  profiles: Record<string, UserProfile>;
  audit: AuditEntry[];
  team: TeamMember[];
}

// copia profunda para que los cambios no alteren los datos de las pruebas
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function initialState(): State {
  return {
    currentUser: adminUser,
    reports: clone(reports),
    revealed: new Set(),
    closedRelated: new Set(),
    users: clone(users),
    profiles: { [suspendedProfile.id]: clone(suspendedProfile) },
    audit: clone(auditEntries),
    team: clone(teamMembers),
  };
}

// fecha y hora actuales como las muestra la bitacora
function nowLabel() {
  const now = new Date();
  const time = now.toTimeString().slice(0, 5);
  const [day, month, year] = formatDate(now).split(" ");
  return { date: `${day} ${month} · ${time}`, year };
}

// reportes que no estan en la cola pero si se mencionan en otras pantallas
function knownCodes(): Record<string, string> {
  const codes: Record<string, string> = {};
  pendingReport.relatedReports.forEach((related) => (codes[related.id] = related.code));
  auditEntries.forEach((entry) => entry.report && (codes[entry.report.id] = entry.report.code));
  reviewCases.forEach((reviewCase) => (codes[reviewCase.id] = reviewCase.code));
  return codes;
}

// el simulado acepta cualquier contrasena de 6 o mas caracteres con un correo del equipo
function accountFor(email: string, password: string): CurrentUser {
  const [localPart, domain] = email.trim().toLowerCase().split("@");
  if (!localPart || !domain || password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError("invalid_credentials");
  }
  if (domain !== teamEmailDomain) throw new AuthError("not_authorized");
  return localPart.startsWith("moderador") ? moderatorUser : adminUser;
}

export interface MockOptions {
  // espera artificial por llamada, para ver estados de carga como con un backend real
  latencyMs?: number;
}

export function createMockModerationService({ latencyMs = 0 }: MockOptions = {}) {
  let state = initialState();

  const me = () => state.currentUser.handle;

  const log = (action: AuditAction, target: string, report: AuditEntry["report"], notes: string) => {
    state.audit.unshift({
      id: `a${Date.now()}${state.audit.length}`,
      ...nowLabel(),
      moderator: me(),
      action,
      target,
      report,
      notes,
    });
  };

  const findReport = (reportId: string) => state.reports.find((report) => report.id === reportId);
  const findUserByHandle = (handle: string) => state.users.find((user) => user.handle === handle);
  const codeOf = (reportId: string) => {
    const index = state.reports.findIndex((report) => report.id === reportId);
    return index >= 0 ? `FF-${FIRST_CODE - index}` : knownCodes()[reportId];
  };

  // otros reportes del mismo contenido que siguen pendientes
  const pendingRelated = (reportId: string) =>
    reportId === pendingReport.id
      ? pendingReport.relatedReports.filter(
          (related) => related.status === "pending" && !state.closedRelated.has(related.id),
        )
      : [];

  // la sancion cambia el estado de la cuenta y queda en su linea de tiempo
  const sanctionAuthor = (handle: string, reportId: string, resolution: Resolution) => {
    const status = resolutionToStatus[resolution.action];
    const user = findUserByHandle(handle);
    if (!status || !user) return;
    user.status = status;

    const profile = state.profiles[user.id];
    if (!profile) return;
    const now = new Date();
    const days = resolution.suspensionDays;
    const until = status === "suspended" && days ? addDays(now, days) : null;
    profile.status = status;
    profile.activeSanction = {
      until: until ? formatDate(until).split(" ").slice(0, 2).join(" ") : undefined,
      appliedBy: me(),
      appliedAt: formatDate(now),
      reportId,
      reportCode: codeOf(reportId),
    };
    profile.timeline.unshift({
      id: `e${Date.now()}`,
      kind: status === "suspended" ? "suspension" : "ban",
      title: status === "suspended" ? `Suspensión de ${days} días` : "Cuenta baneada",
      date: formatDate(now),
      moderator: me(),
      reportCode: codeOf(reportId),
      note: resolution.notes || undefined,
    });
  };

  const service: ModerationService & { reset(): void } = {
    reset() {
      state = initialState();
    },

    async signIn({ email, password }) {
      state.currentUser = accountFor(email, password);
    },
    async signOut() {},
    async getCurrentUser() {
      return state.currentUser;
    },
    async getSectionCounts() {
      return { reports: state.reports.filter((report) => report.status !== "resolved").length };
    },

    async getDashboard() {
      return {
        adminName: "Admin",
        dateLabel: "8 de noviembre de 2026",
        metrics,
        weeklyReports,
        reasons,
        reviewCases,
      };
    },

    async getReports(query) {
      const filtered = state.reports.filter(
        (report) =>
          (!query.status || report.status === query.status) &&
          (!query.contentType || report.contentType === query.contentType) &&
          (!query.reason || report.reason === query.reason) &&
          (!query.assignedToMe || report.assignee === me()),
      );
      return {
        reports: filtered,
        total: filtered.length,
        openCount: state.reports.filter((report) => report.status !== "resolved").length,
        newReportsCount: state.reports.filter((report) => report.isNew).length,
        dateLabel: "8 nov 2026",
      };
    },
    async markNewReportsSeen() {
      state.reports.forEach((report) => (report.isNew = false));
    },
    async getReport(reportId) {
      const code = codeOf(reportId);
      if (!code) return null;

      const report = findReport(reportId);
      const base: ReportDetail = { ...clone(pendingReport), id: reportId, code };
      base.relatedReports = base.relatedReports.map((related) =>
        state.closedRelated.has(related.id) ? { ...related, status: "resolved" } : related,
      );
      if (!report) return base;

      // el detalle completo del diseno es el de @carlos_dev; los demas reutilizan su estructura
      const isDesignAuthor = report.user.handle === pendingReport.content.author.handle;
      return {
        ...base,
        reason: report.reason,
        contentType: report.contentType,
        status: report.status,
        assignee: report.assignee,
        content: {
          ...base.content,
          author: report.user,
          isRevealed: state.revealed.has(reportId),
          evidenceStatus: unavailableEvidence[reportId] ?? "available",
        },
        authorHistory: isDesignAuthor ? base.authorHistory : [],
        relatedReports: reportId === pendingReport.id ? base.relatedReports : [],
      };
    },
    async takeCase(reportId) {
      const report = findReport(reportId);
      if (!report) return;
      report.status = "in_review";
      report.assignee = me();
      log("took_case", report.user.handle, { id: reportId, code: codeOf(reportId) }, "Asignación manual.");
    },
    async revealEvidence(reportId) {
      state.revealed.add(reportId);
      log(
        "viewed_evidence",
        findReport(reportId)?.user.handle ?? "",
        { id: reportId, code: codeOf(reportId) },
        "Acceso a evidencia registrado.",
      );
    },
    async resolveReport(reportId, resolution) {
      const report = findReport(reportId);
      if (!report) return { closedCount: 0 };

      const related = pendingRelated(reportId);
      report.status = "resolved";
      report.assignee = me();
      related.forEach((item) => state.closedRelated.add(item.id));
      sanctionAuthor(report.user.handle, reportId, resolution);
      log(
        resolutionToAudit[resolution.action],
        report.user.handle,
        { id: reportId, code: codeOf(reportId) },
        resolution.notes,
      );
      return { closedCount: 1 + related.length };
    },

    async getUsers(query) {
      const text = query.query?.trim().toLowerCase() ?? "";
      const filtered = state.users.filter(
        (user) =>
          (!text || user.name.toLowerCase().includes(text) || user.handle.toLowerCase().includes(text)) &&
          (!query.status || user.status === query.status),
      );
      return { users: filtered, totalAccounts: state.users.length, hasMore: false };
    },
    async getUser(userId) {
      const user = state.users.find((account) => account.id === userId);
      if (!user) return null;
      if (state.profiles[userId]) return state.profiles[userId];

      // perfil basico para las cuentas que el diseno no detalla
      return {
        ...user,
        memberSince: "1 nov 2026",
        activeSanction: null,
        counters: [
          {
            id: "received",
            value: user.reportsReceived,
            label: "Reportes recibidos",
            caption: "Sobre su contenido",
          },
          { id: "made", value: 0, label: "Reportes hechos", caption: "Enviados por la cuenta" },
          { id: "sanctions", value: 0, label: "Sanciones", caption: "Registradas en la bitácora" },
        ],
        timeline: [],
        hiddenContent: [],
      };
    },
    async findUserIdByHandle(handle) {
      return findUserByHandle(handle)?.id ?? null;
    },
    async restoreAccount(userId, notes) {
      const user = state.users.find((account) => account.id === userId);
      if (!user) return;
      user.status = "active";
      const profile = state.profiles[userId];
      if (profile) {
        profile.status = "active";
        profile.activeSanction = null;
        profile.timeline.unshift({
          id: `e${Date.now()}`,
          kind: "restoration",
          title: "Cuenta restaurada",
          date: formatDate(new Date()),
          moderator: me(),
          note: notes || undefined,
        });
      }
      log("restored_account", user.handle, null, notes);
    },
    async restoreContent(userId, contentId) {
      const profile = state.profiles[userId];
      if (!profile) return;
      profile.hiddenContent = profile.hiddenContent.filter((item) => item.id !== contentId);
    },

    async getAuditLog(query) {
      const entries = state.audit.filter(
        (entry) =>
          (!query.moderator || entry.moderator === query.moderator) &&
          (!query.action || entry.action === query.action),
      );
      return { entries, total: entries.length, dateRangeLabel: "1–8 nov 2026" };
    },

    async getTeam() {
      // quien es "tu" lo decide la sesion, no los datos
      return {
        members: state.team.map((member) => ({ ...member, isCurrentUser: member.handle === me() })),
        lastUpdated: "8 nov 2026 · 11:05",
      };
    },
    async addMember(userId, role) {
      const user = state.users.find((account) => account.id === userId);
      if (!user || state.team.some((member) => member.handle === user.handle)) return;
      state.team.push({
        id: `m${Date.now()}`,
        name: user.name,
        handle: user.handle,
        initials: user.initials,
        avatarUrl: user.avatarUrl,
        role,
        grantedBy: me(),
        joinedAt: formatDate(new Date()),
      });
      log("granted_role", user.handle, null, "");
    },
    async removeRole(memberId) {
      const member = state.team.find((candidate) => candidate.id === memberId);
      // nadie puede quitarse su propio rol
      if (!member || member.handle === me()) return;
      state.team = state.team.filter((candidate) => candidate.id !== memberId);
      log("revoked_role", member.handle, null, "");
    },
  };

  if (latencyMs <= 0) return service;

  // envuelve cada metodo asincrono con la espera; reset sigue siendo inmediato
  const delayed = { ...service };
  for (const key of Object.keys(service) as (keyof typeof service)[]) {
    if (key === "reset") continue;
    const method = service[key] as (...args: unknown[]) => Promise<unknown>;
    (delayed as Record<string, unknown>)[key] = async (...args: unknown[]) => {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
      return method(...args);
    };
  }
  return delayed;
}

export const mockModeration = createMockModerationService();
