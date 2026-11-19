import { Pressable, Text, View } from "react-native";

import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { StatePanel } from "@/components/layout/StatePanel";
import { QueueBanner } from "@/components/reports/QueueBanner";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { Chip } from "@/components/ui/Chip";
import { SelectField } from "@/components/ui/SelectField";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import type { Report } from "@/types/moderation";

export type ReportFilterKey = "status" | "contentType" | "reason";

// "loading" y "error" reemplazan la tabla; los filtros siguen disponibles
export type QueueStatus = "ready" | "loading" | "error";

export interface ReportsQueueScreenProps {
  shell: ShellProps;
  openCount: number;
  // texto del valor elegido en cada filtro, ya listo para mostrarse
  filters: Record<ReportFilterKey, string>;
  assignedToMe: boolean;
  newReportsCount: number;
  reports: Report[];
  totalReports: number;
  dateLabel: string;
  status?: QueueStatus;
  // resultado de la ultima accion, como cuantos reportes se resolvieron
  notice?: string;
  // filas a resaltar ademas de las nuevas, como las recien resueltas
  highlightedIds?: string[];
  onOpenFilter?: (filter: ReportFilterKey) => void;
  onToggleAssignedToMe?: (value: boolean) => void;
  onClearFilters?: () => void;
  onShowNewReports?: () => void;
  onDismissNotice?: () => void;
  onRetry?: () => void;
  onOpenReport?: (reportId: string) => void;
  onLoadMore?: () => void;
}

const filterFields: { key: ReportFilterKey; label: string; width: number }[] = [
  { key: "status", label: "Estado", width: 204 },
  { key: "contentType", label: "Tipo", width: 172 },
  { key: "reason", label: "Motivo", width: 184 },
];

// filas de carga que ocupan el alto de una pagina de la cola
const SKELETON_ROWS = 8;

export function ReportsQueueScreen({
  shell,
  openCount,
  filters,
  assignedToMe,
  newReportsCount,
  reports,
  totalReports,
  dateLabel,
  status = "ready",
  notice,
  highlightedIds,
  onOpenFilter,
  onToggleAssignedToMe,
  onClearFilters,
  onShowNewReports,
  onDismissNotice,
  onRetry,
  onOpenReport,
  onLoadMore,
}: ReportsQueueScreenProps) {
  // el resultado de la ultima accion va primero; al cerrarlo aparecen los reportes nuevos
  const banner = notice
    ? { message: notice, onPress: onDismissNotice }
    : newReportsCount > 0
      ? {
          message: `${newReportsCount} ${newReportsCount === 1 ? "reporte nuevo" : "reportes nuevos"} — clic para ver`,
          onPress: onShowNewReports,
        }
      : null;

  return (
    <AppShell
      {...shell}
      activeSection="reports"
      breadcrumb="Moderación / Reportes"
      title="Reportes"
      headerActions={
        <Chip label={openCount > 0 ? `${openCount} abiertos` : "Sin pendientes"} variant="accent" />
      }
    >
      <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        Revisa, prioriza y asigna los reportes de la comunidad.
      </Text>

      <View className="flex-row items-center gap-3">
        {filterFields.map((field) => (
          <SelectField
            key={field.key}
            label={field.label}
            value={filters[field.key]}
            width={field.width}
            onPress={() => onOpenFilter?.(field.key)}
          />
        ))}
        <Switch label="Asignados a mí" value={assignedToMe} onValueChange={onToggleAssignedToMe} />
        <Pressable accessibilityRole="button" accessibilityLabel="Limpiar filtros" onPress={onClearFilters}>
          <Text className="font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark">
            Limpiar filtros
          </Text>
        </Pressable>
      </View>

      {status === "ready" && banner && <QueueBanner {...banner} />}

      {status === "loading" ? (
        <View className="gap-4">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <SkeletonRow key={index} />
          ))}
        </View>
      ) : status === "error" ? (
        <StatePanel
          title="No pudimos cargar los reportes"
          description="Comprueba tu conexión e inténtalo de nuevo. Tus casos siguen guardados."
          actionLabel="Reintentar"
          onAction={onRetry}
        />
      ) : reports.length === 0 ? (
        <StatePanel
          icon="heart-handshake"
          title="No hay reportes pendientes 🎉"
          description="La comunidad está al día. Los nuevos reportes aparecerán aquí."
        />
      ) : (
        <ReportsTable
          reports={reports}
          totalReports={totalReports}
          dateLabel={dateLabel}
          highlightedIds={highlightedIds}
          onOpenReport={onOpenReport}
          onLoadMore={onLoadMore}
        />
      )}
    </AppShell>
  );
}
