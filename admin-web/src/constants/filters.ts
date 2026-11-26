import type { FilterOption } from "@/components/common/FilterSelect";
import type { AuditAction, ContentType, ReportStatus } from "@/types/moderation";

import { contentTypes, reportStatuses } from "./content-types";
import { auditActions } from "./team";

// opciones de cada filtro; ALL es "sin filtro" (los menus no aceptan un valor vacio)
export const ALL = "all";

const all = (label = "All"): FilterOption => ({ label, value: ALL });

// la cola abre en "Pendiente"; "Todos" va al final porque es lo menos usado
export const reportStatusOptions: FilterOption[] = [
  ...(Object.keys(reportStatuses) as ReportStatus[]).map((status) => ({
    label: reportStatuses[status].label,
    value: status,
  })),
  all(),
];

export const contentTypeOptions: FilterOption[] = [
  all(),
  ...(Object.keys(contentTypes) as ContentType[]).map((type) => ({
    label: contentTypes[type].label,
    value: type,
  })),
];

export const reasonOptions: FilterOption[] = [
  all(),
  ...["Spam", "Harassment", "Nudity", "Violence", "Impersonation", "Other"].map((reason) => ({
    label: reason,
    value: reason,
  })),
];

export const accountStatusOptions: FilterOption[] = [
  all(),
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Banned", value: "banned" },
];

export const auditActionOptions: FilterOption[] = [
  all(),
  ...(Object.keys(auditActions) as AuditAction[]).map((action) => ({
    label: auditActions[action].label,
    value: action,
  })),
];

// convierte el valor del menu en el de la URL: ALL desaparece
export const fromOption = (value: string) => (value === ALL ? undefined : value);
