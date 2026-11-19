import { Button } from "@/components/ui/button";
import { type ErrorKind, errorPages } from "@/constants/feedback";

import { Icon, type IconName } from "./Icon";

export interface StatePanelProps {
  icon?: IconName;
  title: string;
  description: string;
  // accion de texto con flecha, como reintentar
  actionLabel?: string;
  onAction?: () => void;
}

// tarjeta que reemplaza una lista vacia o que no pudo cargarse
export function StatePanel({ icon, title, description, actionLabel, onAction }: StatePanelProps) {
  return (
    <section className="flex min-h-[440px] flex-col items-center gap-5 rounded-2xl bg-surface px-10 py-16 text-center">
      {icon && <Icon name={icon} size={64} className="text-brand" />}
      <h2 className="text-[28px] leading-[34px] font-bold">{title}</h2>
      <p className="max-w-[700px] text-base text-muted-foreground">{description}</p>
      {actionLabel && (
        <Button variant="ghost" onClick={onAction}>
          <Icon name="arrow-left" />
          {actionLabel}
        </Button>
      )}
    </section>
  );
}

export interface ErrorMessageProps {
  kind: ErrorKind;
  onAction?: () => void;
}

// mensaje de error de pagina completa: sin permiso, inexistente o inesperado
export function ErrorMessage({ kind, onAction }: ErrorMessageProps) {
  const page = errorPages[kind];

  return (
    <div role="alert" className="flex flex-col items-center gap-6 py-[100px] text-center">
      <p className="text-[92px] leading-[110px] font-bold text-brand">{page.code}</p>
      <h2 className="text-[32px] leading-[38px] font-bold">{page.heading}</h2>
      <p className="text-[17px] text-muted-foreground">{page.description}</p>
      <Button variant="default" className="w-[210px]" onClick={onAction}>
        {page.actionLabel}
      </Button>
    </div>
  );
}

// indicador de carga centrado
export function Spinner({ className = "min-h-[60vh]" }: { className?: string }) {
  return (
    <div role="status" aria-label="Cargando" className={`flex items-center justify-center ${className}`}>
      <span className="size-8 animate-spin rounded-full border-[3px] border-brand border-t-transparent" />
    </div>
  );
}
