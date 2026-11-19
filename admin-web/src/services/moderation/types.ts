import type { SectionKey } from "@/constants/navigation";
import type {
  CurrentUser,
  AccountStatus,
  AuditAction,
  AuditEntry,
  ChartBar,
  ContentType,
  Metric,
  ReasonShare,
  Report,
  ReportDetail,
  ReportStatus,
  Resolution,
  ReviewCase,
  TeamMember,
  TeamRole,
  UserAccount,
  UserProfile,
} from "@/types/moderation";

export interface Credentials {
  email: string;
  password: string;
}

// "invalid_credentials": correo o contrasena incorrectos; "not_authorized": la cuenta no es del equipo
export type AuthErrorReason = "invalid_credentials" | "not_authorized";

// error de inicio de sesion; la ruta de login lo traduce a un mensaje
export class AuthError extends Error {
  constructor(public readonly reason: AuthErrorReason) {
    super(reason);
    this.name = "AuthError";
  }
}

// resultado de resolver un reporte
export interface ResolutionOutcome {
  // reportes cerrados en total, contando este y los pendientes del mismo contenido
  closedCount: number;
}

export interface DashboardData {
  adminName: string;
  // fecha de hoy ya formateada para el saludo
  dateLabel: string;
  metrics: Metric[];
  weeklyReports: ChartBar[];
  reasons: ReasonShare[];
  reviewCases: ReviewCase[];
}

// filtros de la cola; un campo ausente significa "todos"
export interface ReportQuery {
  status?: ReportStatus;
  contentType?: ContentType;
  reason?: string;
  assignedToMe?: boolean;
}

export interface ReportPage {
  reports: Report[];
  // reportes que cumplen los filtros, no solo los de esta pagina
  total: number;
  openCount: number;
  newReportsCount: number;
  dateLabel: string;
}

export interface UserQuery {
  query?: string;
  status?: AccountStatus;
}

export interface UserPage {
  users: UserAccount[];
  // cuentas registradas en total
  totalAccounts: number;
  hasMore: boolean;
}

export interface AuditQuery {
  moderator?: string;
  action?: AuditAction;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
  dateRangeLabel: string;
}

export interface TeamData {
  members: TeamMember[];
  lastUpdated: string;
}

// contrato que cumple cualquier fuente de datos de la consola: simulada o real
export interface ModerationService {
  signIn(credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<CurrentUser>;
  getSectionCounts(): Promise<Partial<Record<SectionKey, number>>>;

  getDashboard(): Promise<DashboardData>;

  getReports(query: ReportQuery): Promise<ReportPage>;
  markNewReportsSeen(): Promise<void>;
  // null si el reporte no existe
  getReport(reportId: string): Promise<ReportDetail | null>;
  takeCase(reportId: string): Promise<void>;
  revealEvidence(reportId: string): Promise<void>;
  resolveReport(reportId: string, resolution: Resolution): Promise<ResolutionOutcome>;

  getUsers(query: UserQuery): Promise<UserPage>;
  // null si la cuenta no existe
  getUser(userId: string): Promise<UserProfile | null>;
  findUserIdByHandle(handle: string): Promise<string | null>;
  // las notas explican al equipo por que se restauro
  restoreAccount(userId: string, notes: string): Promise<void>;
  restoreContent(userId: string, contentId: string): Promise<void>;

  getAuditLog(query: AuditQuery): Promise<AuditPage>;

  getTeam(): Promise<TeamData>;
  addMember(userId: string, role: TeamRole): Promise<void>;
  removeRole(memberId: string): Promise<void>;
}
