import type { Option } from "@/hooks/use-cycle";
import type { AccountStatus, AuditAction, ContentType, ReportStatus } from "@/types/moderation";

import { contentTypes, reportStatuses } from "./content-types";
import { auditActions } from "./team";

// opciones de cada filtro; la primera es la que se aplica al entrar

export const reportStatusOptions: Option<ReportStatus>[] = [
  ...(Object.keys(reportStatuses) as ReportStatus[]).map((status) => ({
    label: reportStatuses[status].label,
    value: status,
  })),
  { label: "Todos", value: undefined },
];

export const contentTypeOptions: Option<ContentType>[] = [
  { label: "Todos", value: undefined },
  ...(Object.keys(contentTypes) as ContentType[]).map((type) => ({
    label: contentTypes[type].label,
    value: type,
  })),
];

export const reasonOptions: Option<string>[] = [
  { label: "Todos", value: undefined },
  ...["Spam", "Acoso", "Desnudez", "Violencia", "Suplantación", "Otro"].map((reason) => ({
    label: reason,
    value: reason,
  })),
];

export const accountStatusOptions: Option<AccountStatus>[] = [
  { label: "Todos", value: undefined },
  { label: "Activas", value: "active" },
  { label: "Suspendidas", value: "suspended" },
  { label: "Baneadas", value: "banned" },
];

export const auditActionOptions: Option<AuditAction>[] = [
  { label: "Todas", value: undefined },
  ...(Object.keys(auditActions) as AuditAction[]).map((action) => ({
    label: auditActions[action].label,
    value: action,
  })),
];
