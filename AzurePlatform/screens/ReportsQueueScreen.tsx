import { Pressable, Text, View } from "react-native";

import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { NewReportsBanner } from "@/components/reports/NewReportsBanner";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { Chip } from "@/components/ui/Chip";
import { SelectField } from "@/components/ui/SelectField";
import { Switch } from "@/components/ui/Switch";
import type { Report } from "@/types/moderation";

export type ReportFilterKey = "status" | "contentType" | "reason";

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
  onOpenFilter?: (filter: ReportFilterKey) => void;
  onToggleAssignedToMe?: (value: boolean) => void;
  onClearFilters?: () => void;
  onShowNewReports?: () => void;
  onOpenReport?: (reportId: string) => void;
  onLoadMore?: () => void;
}

const filterFields: { key: ReportFilterKey; label: string; width: number }[] = [
  { key: "status", label: "Estado", width: 204 },
  { key: "contentType", label: "Tipo", width: 172 },
  { key: "reason", label: "Motivo", width: 184 },
];

export function ReportsQueueScreen({
  shell,
  openCount,
  filters,
  assignedToMe,
  newReportsCount,
  reports,
  totalReports,
  dateLabel,
  onOpenFilter,
  onToggleAssignedToMe,
  onClearFilters,
  onShowNewReports,
  onOpenReport,
  onLoadMore,
}: ReportsQueueScreenProps) {
  return (
    <AppShell
      {...shell}
      activeSection="reports"
      breadcrumb="Moderación / Reportes"
      title="Reportes"
      headerActions={<Chip label={`${openCount} abiertos`} variant="accent" />}
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

      <NewReportsBanner count={newReportsCount} onPress={onShowNewReports} />

      <ReportsTable
        reports={reports}
        totalReports={totalReports}
        dateLabel={dateLabel}
        onOpenReport={onOpenReport}
        onLoadMore={onLoadMore}
      />
    </AppShell>
  );
}
