import { auditEntries, teamMembers } from "@/fixtures/audit";
import { metrics, reasons, reviewCases, weeklyReports } from "@/fixtures/dashboard";
import { pendingReport } from "@/fixtures/report-detail";
import { reports } from "@/fixtures/reports";
import { suspendedProfile, users } from "@/fixtures/users";
import { formatDate } from "@/lib/format";
import type {
  AuditAction,
  AuditEntry,
  Report,
  ReportDetail,
  ResolutionAction,
  UserAccount,
  UserProfile,
} from "@/types/moderation";

import type { ModerationService } from "./types";

// servicio en memoria con los datos del diseno; permite recorrer la app sin backend.
// los cambios (tomar casos, restaurar cuentas...) duran hasta recargar la pagina

const CURRENT_USER = { handle: "@admin", initials: "A", role: "Admin" };

// la cola del diseno empieza en FF-1048 y baja de uno en uno
const FIRST_CODE = 1048;

const resolutionToAudit: Record<ResolutionAction, AuditAction> = {
  dismiss: "dismissed_report",
  hide_content: "hid_content",
  warn: "warned_author",
  suspend: "suspended_account",
  ban: "banned_account",
};

interface State {
  reports: Report[];
  revealed: Set<string>;
  users: UserAccount[];
  profiles: Record<string, UserProfile>;
  audit: AuditEntry[];
  team: typeof teamMembers;
}

// copia profunda para que los cambios no alteren los datos de las pruebas
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function initialState(): State {
  return {
    reports: clone(reports),
    revealed: new Set(),
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

export function createMockModerationService() {
  let state = initialState();

  const log = (action: AuditAction, target: string, report: AuditEntry["report"], notes: string) => {
    state.audit.unshift({
      id: `a${Date.now()}${state.audit.length}`,
      ...nowLabel(),
      moderator: CURRENT_USER.handle,
      action,
      target,
      report,
      notes,
    });
  };

  const findReport = (reportId: string) => state.reports.find((report) => report.id === reportId);
  const codeOf = (reportId: string) => {
    const index = state.reports.findIndex((report) => report.id === reportId);
    return index >= 0 ? `FF-${FIRST_CODE - index}` : knownCodes()[reportId];
  };

  const service: ModerationService & { reset(): void } = {
    reset() {
      state = initialState();
    },

    async signIn() {
      // el simulado acepta cualquier credencial
    },
    async signOut() {},
    async getCurrentUser() {
      return CURRENT_USER;
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
          (!query.assignedToMe || report.assignee === CURRENT_USER.handle),
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
        },
        authorHistory: isDesignAuthor ? base.authorHistory : [],
        relatedReports: reportId === pendingReport.id ? base.relatedReports : [],
      };
    },
    async takeCase(reportId) {
      const report = findReport(reportId);
      if (!report) return;
      report.status = "in_review";
      report.assignee = CURRENT_USER.handle;
      log("took_case", report.user.handle, { id: reportId, code: codeOf(reportId) }, "Asignación manual.");
    },
    async revealEvidence(reportId) {
      state.revealed.add(reportId);
      log("viewed_evidence", findReport(reportId)?.user.handle ?? "", { id: reportId, code: codeOf(reportId) }, "Acceso a evidencia registrado.");
    },
    async resolveReport(reportId, resolution) {
      const report = findReport(reportId);
      if (!report) return;
      report.status = "resolved";
      log(resolutionToAudit[resolution.action], report.user.handle, { id: reportId, code: codeOf(reportId) }, resolution.notes);
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
          { id: "received", value: user.reportsReceived, label: "Reportes recibidos", caption: "Sobre su contenido" },
          { id: "made", value: 0, label: "Reportes hechos", caption: "Enviados por la cuenta" },
          { id: "sanctions", value: 0, label: "Sanciones", caption: "Registradas en la bitácora" },
        ],
        timeline: [],
        hiddenContentCount: 0,
      };
    },
    async findUserIdByHandle(handle) {
      return state.users.find((user) => user.handle === handle)?.id ?? null;
    },
    async restoreAccount(userId) {
      const user = state.users.find((account) => account.id === userId);
      if (!user) return;
      user.status = "active";
      const profile = state.profiles[userId];
      if (profile) {
        profile.status = "active";
        profile.activeSanction = null;
      }
      log("restored_account", user.handle, null, "");
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
      return { members: state.team, lastUpdated: "8 nov 2026 · 11:05" };
    },
    async removeRole(memberId) {
      const member = state.team.find((candidate) => candidate.id === memberId);
      // nadie puede quitarse su propio rol
      if (!member || member.isCurrentUser) return;
      state.team = state.team.filter((candidate) => candidate.id !== memberId);
      log("revoked_role", member.handle, null, "");
    },
  };

  return service;
}

export const mockModeration = createMockModerationService();
