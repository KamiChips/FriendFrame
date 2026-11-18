import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { ErrorMessage } from "@/components/layout/ErrorMessage";
import { Chip } from "@/components/ui/Chip";
import { type ErrorKind, errorPages } from "@/constants/feedback";
import { type SectionKey, sections } from "@/constants/navigation";

export interface ErrorScreenProps {
  shell: ShellProps;
  kind: ErrorKind;
  // seccion desde la que se llego; ausente si no pertenece a ninguna
  activeSection?: SectionKey;
  // volver al dashboard o, ante un error inesperado, recargar
  onAction?: () => void;
}

// pagina de error dentro de la consola: sin permiso, inexistente o inesperado
export function ErrorScreen({ shell, kind, activeSection, onAction }: ErrorScreenProps) {
  const page = errorPages[kind];
  const section = sections.find((candidate) => candidate.key === activeSection);
  const openCount = shell.sectionCounts?.reports;

  return (
    <AppShell
      {...shell}
      activeSection={activeSection}
      breadcrumb={section ? `Moderación / ${section.label}` : "Moderación"}
      title={page.title}
      headerActions={
        openCount !== undefined && <Chip label={`${openCount} abiertos`} variant="accent" />
      }
    >
      <ErrorMessage
        code={page.code}
        title={page.heading}
        description={page.description}
        actionLabel={page.actionLabel}
        onAction={onAction}
      />
    </AppShell>
  );
}
