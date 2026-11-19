import { Pressable, Text, View } from "react-native";

import { AuditTable } from "@/components/audit/AuditTable";
import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { SelectField } from "@/components/ui/SelectField";
import type { AuditEntry } from "@/types/moderation";

export type AuditFilterKey = "moderator" | "action" | "dateRange";

export interface AuditLogScreenProps {
  shell: ShellProps;
  // texto del valor elegido en cada filtro, ya listo para mostrarse
  filters: Record<AuditFilterKey, string>;
  entries: AuditEntry[];
  totalEntries: number;
  onOpenFilter?: (filter: AuditFilterKey) => void;
  onClearFilters?: () => void;
  onOpenReport?: (reportId: string) => void;
  onLoadMore?: () => void;
}

// el rango de fechas no lleva etiqueta: su valor ya se explica solo
const filterFields: { key: AuditFilterKey; label?: string; width: number }[] = [
  { key: "moderator", label: "Moderador", width: 215 },
  { key: "action", label: "Acción", width: 210 },
  { key: "dateRange", width: 200 },
];

export function AuditLogScreen({
  shell,
  filters,
  entries,
  totalEntries,
  onOpenFilter,
  onClearFilters,
  onOpenReport,
  onLoadMore,
}: AuditLogScreenProps) {
  return (
    <AppShell
      {...shell}
      activeSection="audit"
      breadcrumb="Moderación / Bitácora"
      title="Bitácora"
      headerActions={<Chip label="Solo Admin" variant="accent" />}
    >
      <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        Cada decisión deja contexto. Registro de acciones del equipo de moderación.
      </Text>

      <View className="h-11 flex-row items-center gap-3">
        {filterFields.map((field) => (
          <SelectField
            key={field.key}
            label={field.label}
            value={filters[field.key]}
            width={field.width}
            onPress={() => onOpenFilter?.(field.key)}
          />
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Limpiar filtros" onPress={onClearFilters}>
          <Text className="font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark">
            Limpiar filtros
          </Text>
        </Pressable>
        <View className="flex-1" />
        <Icon name="lock-keyhole" size={16} tone="faint" />
        <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
          Registro no editable
        </Text>
      </View>

      <AuditTable
        entries={entries}
        totalEntries={totalEntries}
        onOpenReport={onOpenReport}
        onLoadMore={onLoadMore}
      />

      <View className="flex-row items-center gap-2">
        <Icon name="shield-check" size={17} tone="muted" />
        <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
          La bitácora registra quién actuó, cuándo y por qué. No incluye datos personales sensibles.
        </Text>
      </View>
    </AppShell>
  );
}
