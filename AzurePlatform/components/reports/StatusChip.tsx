import { Chip } from "@/components/ui/Chip";
import { reportStatuses } from "@/constants/content-types";
import type { ReportStatus } from "@/types/moderation";

export interface StatusChipProps {
  status: ReportStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const { label, variant } = reportStatuses[status];
  return <Chip label={label} variant={variant} />;
}
