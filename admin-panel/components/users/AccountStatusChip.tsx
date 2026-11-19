import { Chip, type ChipVariant } from "@/components/ui/Chip";
import type { AccountStatus } from "@/types/moderation";

const statuses: Record<AccountStatus, { label: string; variant: ChipVariant }> = {
  active: { label: "Activa", variant: "success" },
  suspended: { label: "Suspendida", variant: "notice" },
  banned: { label: "Baneada", variant: "danger" },
};

export interface AccountStatusChipProps {
  status: AccountStatus;
  // fin de la suspension, como "15 nov"; se agrega a la etiqueta
  until?: string;
}

export function AccountStatusChip({ status, until }: AccountStatusChipProps) {
  const { label, variant } = statuses[status];
  return <Chip label={until ? `${label} hasta ${until}` : label} variant={variant} />;
}
