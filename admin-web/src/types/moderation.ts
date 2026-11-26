import type { IconName } from "@/components/common/Icon";

// indicador resumido del dashboard
export interface Metric {
  id: string;
  label: string;
  value: string;
  caption: string;
  icon: IconName;
}

// una barra del grafico; el orden del arreglo es el orden cronologico
export interface ChartBar {
  label: string;
  value: number;
}

// porcentaje de reportes por motivo
export interface ReasonShare {
  label: string;
  percent: number;
}

// caso que el moderador actual tiene en revision
export interface ReviewCase {
  id: string;
  code: string;
  reason: string;
  contentType: string;
  handle: string;
  timeAgo: string;
}

export type ContentType = "post" | "fragment" | "comment" | "chat_message" | "profile";

export type ReportStatus = "pending" | "in_review" | "resolved";

// usuario tal como aparece en tablas y listas
export interface UserRef {
  handle: string;
  initials: string;
  avatarUrl?: string | null;
}

// reporte en la cola de moderacion
export interface Report {
  id: string;
  timeAgo: string;
  contentType: ContentType;
  reason: string;
  user: UserRef;
  reportCount: number;
  status: ReportStatus;
  // handle del moderador asignado; null si nadie lo tomo
  assignee: string | null;
  // llego despues de la ultima vez que se vio la cola
  isNew?: boolean;
}

export type SanctionKind = "warning" | "suspension" | "ban";

// sancion aplicada antes a un usuario
export interface Sanction {
  id: string;
  kind: SanctionKind;
  // motivo de la sancion o su duracion, ya como texto
  detail: string;
  // fecha ya formateada, como "7 nov 2026"
  date: string;
}

// otro reporte sobre el mismo contenido
export interface RelatedReport {
  id: string;
  code: string;
  reporterHandle: string;
  status: ReportStatus;
}

// "expired": el enlace a la evidencia caduco; "deleted": el autor borro la publicacion
export type EvidenceStatus = "available" | "expired" | "deleted";

export interface ReportedContent {
  author: UserRef;
  profileOwnerHandle: string;
  isVisible: boolean;
  postedAt: string;
  mediaUrl?: string | null;
  // el contenido sensible se muestra velado hasta que el moderador lo revela
  isSensitive: boolean;
  isRevealed: boolean;
  // ausente equivale a "available"
  evidenceStatus?: EvidenceStatus;
}

export interface ReportDetail {
  id: string;
  code: string;
  reason: string;
  contentType: ContentType;
  reportedAt: string;
  status: ReportStatus;
  assignee: string | null;
  content: ReportedContent;
  reporterHandle: string;
  statement: string;
  authorHistory: Sanction[];
  relatedReports: RelatedReport[];
}

export type ResolutionAction = "dismiss" | "hide_content" | "warn" | "suspend" | "ban";

// decision del moderador sobre un reporte
export interface Resolution {
  action: ResolutionAction;
  // solo cuando la accion es suspender
  suspensionDays?: number;
  notes: string;
}

export type AccountStatus = "active" | "suspended" | "banned";

// cuenta tal como aparece en los resultados de busqueda
export interface UserAccount extends UserRef {
  id: string;
  name: string;
  status: AccountStatus;
  reportsReceived: number;
  lastActivity: string;
}

// sancion que mantiene la cuenta suspendida o baneada
export interface ActiveSanction {
  // fin de la suspension, como "15 nov"; ausente si no tiene fecha de fin
  until?: string;
  appliedBy: string;
  appliedAt: string;
  reportId: string;
  reportCode: string;
}

export interface ProfileCounter {
  id: string;
  value: number;
  label: string;
  caption: string;
}

export type TimelineKind = SanctionKind | "restoration";

// evento de moderacion en la linea de tiempo de una cuenta
export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  title: string;
  date: string;
  moderator: string;
  // ausente cuando el evento no salio de un reporte, como una restauracion
  reportCode?: string;
  note?: string;
}

// contenido de la cuenta que moderacion oculto y que puede restaurarse
export interface HiddenContent {
  id: string;
  contentType: ContentType;
  reportId: string;
  reportCode: string;
  profileOwnerHandle: string;
  // fecha ya formateada, como "8 nov 2026"
  hiddenAt: string;
  mediaUrl?: string | null;
}

export interface UserProfile extends UserRef {
  id: string;
  name: string;
  memberSince: string;
  status: AccountStatus;
  activeSanction: ActiveSanction | null;
  counters: ProfileCounter[];
  timeline: TimelineEvent[];
  hiddenContent: HiddenContent[];
}

export type AuditAction =
  | "took_case"
  | "viewed_evidence"
  | "dismissed_report"
  | "hid_content"
  | "warned_author"
  | "suspended_account"
  | "banned_account"
  | "restored_account"
  | "granted_role"
  | "revoked_role";

// accion de un moderador registrada en la bitacora
export interface AuditEntry {
  id: string;
  // dia y hora, como "8 nov · 11:02"; el ano va aparte porque se muestra en otra linea
  date: string;
  year: string;
  moderator: string;
  action: AuditAction;
  target: string;
  report: { id: string; code: string } | null;
  notes: string;
}

export type TeamRole = "admin" | "moderator";

export interface TeamMember extends UserRef {
  id: string;
  name: string;
  role: TeamRole;
  // handle de quien otorgo el rol; null si viene de la configuracion inicial
  grantedBy: string | null;
  joinedAt: string;
  isCurrentUser?: boolean;
}

// miembro del equipo con la sesion abierta
export interface CurrentUser {
  handle: string;
  initials: string;
  role: TeamRole;
  avatarUrl?: string | null;
}
