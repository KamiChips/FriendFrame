import type { Report } from "@/types/moderation";

// datos de ejemplo tomados del diseno; los usan las pruebas y el servicio simulado
const carlos = { handle: "@carlos_dev", initials: "CD" };
const luis = { handle: "@luis.fotos", initials: "LF" };
const ana = { handle: "@ana.rmz", initials: "AR" };
const maria = { handle: "@maria.lopez", initials: "ML" };

export const reports: Report[] = [
  { id: "r1", timeAgo: "Hace 3 min", contentType: "post", reason: "Acoso", user: carlos, reportCount: 4, status: "pending", assignee: null, isNew: true },
  { id: "r2", timeAgo: "Hace 8 min", contentType: "fragment", reason: "Spam", user: luis, reportCount: 3, status: "pending", assignee: null },
  { id: "r3", timeAgo: "Hace 12 min", contentType: "comment", reason: "Acoso", user: carlos, reportCount: 2, status: "pending", assignee: null },
  { id: "r4", timeAgo: "Hace 25 min", contentType: "chat_message", reason: "Otro", user: ana, reportCount: 1, status: "pending", assignee: null },
  { id: "r5", timeAgo: "Hace 42 min", contentType: "profile", reason: "Suplantación", user: luis, reportCount: 5, status: "pending", assignee: null },
  { id: "r6", timeAgo: "Hace 1 h", contentType: "post", reason: "Desnudez", user: maria, reportCount: 1, status: "pending", assignee: null },
  { id: "r7", timeAgo: "Hace 2 h", contentType: "comment", reason: "Spam", user: luis, reportCount: 3, status: "pending", assignee: null },
  { id: "r8", timeAgo: "Hace 3 h", contentType: "fragment", reason: "Violencia", user: ana, reportCount: 1, status: "pending", assignee: null },
  { id: "r9", timeAgo: "Hace 4 h", contentType: "post", reason: "Otro", user: maria, reportCount: 2, status: "pending", assignee: null },
];
