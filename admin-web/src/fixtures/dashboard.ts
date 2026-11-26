import type { ChartBar, Metric, ReasonShare, ReviewCase } from "@/types/moderation";

// datos de ejemplo tomados del diseno; los usan las pruebas y el servicio simulado
export const metrics: Metric[] = [
  { id: "open", label: "Open reports", value: "23", caption: "8 waiting to be assigned", icon: "flag" },
  {
    id: "suspended",
    label: "Suspended users",
    value: "5",
    caption: "Active suspensions",
    icon: "clock-3",
  },
  { id: "banned", label: "Banned users", value: "2", caption: "Blocked accounts", icon: "shield-ban" },
  {
    id: "resolution",
    label: "Resolution time",
    value: "3.4 h",
    caption: "Average over the last 7 days",
    icon: "timer",
  },
];

export const weeklyReports: ChartBar[] = [
  { label: "Wk 1", value: 21 },
  { label: "Wk 2", value: 30 },
  { label: "Wk 3", value: 26 },
  { label: "Wk 4", value: 40 },
  { label: "Wk 5", value: 35 },
  { label: "Wk 6", value: 44 },
  { label: "Wk 7", value: 43 },
  { label: "Wk 8", value: 35 },
];

export const reasons: ReasonShare[] = [
  { label: "Spam", percent: 30 },
  { label: "Harassment", percent: 25 },
  { label: "Nudity", percent: 17 },
  { label: "Violence", percent: 12 },
  { label: "Impersonation", percent: 10 },
  { label: "Other", percent: 6 },
];

export const reviewCases: ReviewCase[] = [
  {
    id: "c-1048",
    code: "FF-1048",
    reason: "Harassment",
    contentType: "Post",
    handle: "@carlos_dev",
    timeAgo: "12 min ago",
  },
  {
    id: "c-1042",
    code: "FF-1042",
    reason: "Spam",
    contentType: "Comment",
    handle: "@luis.fotos",
    timeAgo: "45 min ago",
  },
];
