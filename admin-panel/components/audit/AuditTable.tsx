import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { type Column, DataTable } from "@/components/ui/DataTable";
import { auditActions } from "@/constants/team";
import type { AuditEntry } from "@/types/moderation";

export interface AuditTableProps {
  entries: AuditEntry[];
  totalEntries: number;
  onOpenReport?: (reportId: string) => void;
  onLoadMore?: () => void;
}

const muted = "font-spartan text-muted-light dark:text-muted-dark";
const link = "font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark";

export function AuditTable({ entries, totalEntries, onOpenReport, onLoadMore }: AuditTableProps) {
  const columns: Column<AuditEntry>[] = [
    {
      key: "date",
      header: "Fecha ↓",
      width: 110,
      render: (entry) => (
        <View>
          <Text className={`${muted} text-[13px] leading-4`}>{entry.date}</Text>
          <Text className={`${muted} text-[13px] leading-4`}>{entry.year}</Text>
        </View>
      ),
    },
    {
      key: "moderator",
      header: "Moderador",
      width: 140,
      render: (entry) => (
        <Text className="font-spartan-bold text-sm leading-[17px] text-ink-light dark:text-ink-dark">
          {entry.moderator}
        </Text>
      ),
    },
    {
      key: "action",
      header: "Acción",
      width: 156,
      render: (entry) => <Chip {...auditActions[entry.action]} />,
    },
    {
      key: "target",
      header: "Objetivo",
      width: 170,
      render: (entry) => (
        <Text className="font-spartan text-sm leading-[17px] text-ink-light dark:text-ink-dark">
          {entry.target}
        </Text>
      ),
    },
    {
      key: "report",
      header: "Reporte relacionado",
      width: 120,
      render: (entry) => {
        const report = entry.report;
        // no toda accion nace de un reporte, como otorgar un rol
        if (!report) return <Text className={link}>—</Text>;

        return (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={report.code}
            onPress={() => onOpenReport?.(report.id)}
          >
            <Text className={link}>{report.code} ↗</Text>
          </Pressable>
        );
      },
    },
    {
      key: "notes",
      header: "Notas",
      render: (entry) => <Text className={`${muted} text-sm leading-[17px]`}>{entry.notes}</Text>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      keyExtractor={(entry) => entry.id}
      rowTestID={(entry) => `audit-row-${entry.id}`}
      rowHeight={64}
      density="regular"
      footer={
        <View className="h-[58px] flex-row items-center justify-between px-5">
          <Text className={`${muted} text-[13px] leading-4`}>
            {entries.length} de {totalEntries} acciones · Horario local
          </Text>
          {entries.length < totalEntries && (
            <Button label="Cargar más" variant="ghost" icon="chevron-down" onPress={onLoadMore} />
          )}
        </View>
      }
    />
  );
}
