import { Chip } from "@/components/ui/Chip";
import { reportStatuses } from "@/constants/content-types";
import type { ReportStatus } from "@/types/moderation";

export interface StatusChipProps {
  status: ReportStatus;
  // un caso en revision por otra persona se muestra apagado
  muted?: boolean;
}

export function StatusChip({ status, muted = false }: StatusChipProps) {
  const { label, variant } = reportStatuses[status];
  return <Chip label={label} variant={muted ? "neutral" : variant} />;
}
