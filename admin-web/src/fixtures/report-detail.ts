import type { EvidenceStatus, ReportDetail } from "@/types/moderation";

// datos de ejemplo tomados del diseno; los usan las pruebas y el servicio simulado
export const pendingReport: ReportDetail = {
  id: "r1",
  code: "FF-1048",
  reason: "Acoso",
  contentType: "post",
  reportedAt: "8 nov 2026 · 10:45",
  status: "pending",
  assignee: null,
  content: {
    author: { handle: "@carlos_dev", initials: "CD" },
    profileOwnerHandle: "@ana.rmz",
    isVisible: true,
    postedAt: "8 nov 2026, 10:32",
    mediaUrl: null,
    isSensitive: true,
    isRevealed: false,
  },
  reporterHandle: "@maria.lopez",
  statement: "Publica repetidamente en el perfil de Ana después de que ella le pidió que dejara de hacerlo.",
  authorHistory: [
    { id: "s1", kind: "warning", detail: "Acoso", date: "7 nov 2026" },
    { id: "s2", kind: "warning", detail: "Spam", date: "6 nov 2026" },
    { id: "s3", kind: "suspension", detail: "3 días", date: "2 nov 2026" },
  ],
  relatedReports: [
    { id: "r-1047", code: "FF-1047", reporterHandle: "@ana.rmz", status: "pending" },
    { id: "r-1045", code: "FF-1045", reporterHandle: "@luis.fotos", status: "pending" },
    { id: "r-1038", code: "FF-1038", reporterHandle: "@maria.lopez", status: "resolved" },
  ],
};

export const reportInReview: ReportDetail = {
  ...pendingReport,
  status: "in_review",
  assignee: "@admin",
  content: { ...pendingReport.content, isRevealed: true },
};

// reportes de la cola cuya evidencia ya no esta disponible, para recorrer esos estados
export const unavailableEvidence: Record<string, EvidenceStatus> = {
  r3: "expired",
  r8: "deleted",
};
