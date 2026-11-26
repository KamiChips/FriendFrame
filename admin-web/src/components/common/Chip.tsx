import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ChipVariant =
  "neutral" | "accent" | "info" | "success" | "notice" | "caution" | "warning" | "danger";

const variants: Record<ChipVariant, string> = {
  neutral: "bg-soft text-muted-foreground",
  accent: "bg-brand-soft text-on-brand-soft",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  success: "bg-success-soft text-success",
  notice: "bg-notice-soft text-on-notice-soft",
  // escala de gravedad: caution (baja) < warning (media) < danger (alta)
  caution: "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-200",
  warning: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  danger: "bg-danger-soft text-on-danger-soft",
};

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  // "header" iguala el alto y borde del selector de tema en la cabecera de cada pagina
  size?: "default" | "header";
  // explicacion del color: aparece al pasar el cursor y la leen los lectores de pantalla
  title?: string;
  className?: string;
}

// en la cabecera el fondo claro de siempre se pierde junto al blanco: en modo claro se usa un tono
// mas oscuro con borde; en oscuro se conserva el mismo color de las demas etiquetas
const headerTones: Partial<Record<ChipVariant, string>> = {
  accent: "border-brand/45 bg-brand/25 dark:border-line dark:bg-brand-soft",
  neutral: "border-[#b9bcc3] bg-line text-ink dark:border-line dark:bg-soft dark:text-muted-foreground",
};

// etiqueta de estado redondeada; usa el Badge de shadcn con los colores del diseno.
// alto fijo y leading-none para que el texto quede centrado en vertical
export function Chip({ label, variant = "neutral", size = "default", title, className }: ChipProps) {
  const isHeader = size === "header";
  return (
    <Badge
      title={title}
      className={cn(
        "text-[13px] leading-none font-normal",
        isHeader ? "h-9 border px-3" : "h-6 px-2.5",
        variants[variant],
        isHeader && headerTones[variant],
        className,
      )}
    >
      {label}
      {title && <span className="sr-only">, {title}</span>}
    </Badge>
  );
}
