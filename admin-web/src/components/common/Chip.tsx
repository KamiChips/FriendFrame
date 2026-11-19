import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ChipVariant = "neutral" | "accent" | "success" | "notice" | "danger";

const variants: Record<ChipVariant, string> = {
  neutral: "bg-soft text-muted-foreground",
  accent: "bg-brand-soft text-on-brand-soft",
  success: "bg-success-soft text-success",
  notice: "bg-notice-soft text-on-notice-soft",
  danger: "bg-danger-soft text-on-danger-soft",
};

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  className?: string;
}

// etiqueta de estado redondeada; usa el Badge de shadcn con los colores del diseno
export function Chip({ label, variant = "neutral", className }: ChipProps) {
  return (
    <Badge className={cn("px-2.5 py-1 text-[13px] leading-4 font-normal", variants[variant], className)}>
      {label}
    </Badge>
  );
}
