import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { type Column, DataTable } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import { UserCell } from "@/components/ui/UserCell";
import { contentTypes } from "@/constants/content-types";
import type { Report } from "@/types/moderation";

import { StatusChip } from "./StatusChip";

export interface ReportsTableProps {
  reports: Report[];
  totalReports: number;
  // fecha ya formateada, como "8 nov 2026"
  dateLabel: string;
  // a partir de cuantos reportes se resalta la cantidad
  highCountFrom?: number;
  onOpenReport?: (reportId: string) => void;
  onLoadMore?: () => void;
}

const cellText = "font-spartan text-sm leading-[17px] text-ink-light dark:text-ink-dark";
const mutedText = "font-spartan text-muted-light dark:text-muted-dark";

export function ReportsTable({
  reports,
  totalReports,
  dateLabel,
  highCountFrom = 3,
  onOpenReport,
  onLoadMore,
}: ReportsTableProps) {
  const columns: Column<Report>[] = [
    {
      key: "date",
      header: "Fecha ↓",
      width: 90,
      render: (report) => (
        <Text className={`${mutedText} text-[13px] leading-4`}>{report.timeAgo}</Text>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      width: 150,
      render: (report) => (
        <View className="flex-row items-center gap-2">
          <Icon name={contentTypes[report.contentType].icon} size={17} tone="muted" />
          <Text className={cellText}>{contentTypes[report.contentType].label}</Text>
        </View>
      ),
    },
    {
      key: "reason",
      header: "Motivo",
      width: 110,
      render: (report) => <Text className={cellText}>{report.reason}</Text>,
    },
    {
      key: "user",
      header: "Usuario",
      width: 205,
      render: (report) => <UserCell user={report.user} />,
    },
    {
      key: "count",
      header: "Nº reportes",
      width: 70,
      render: (report) => (
        <Text
          className={`font-spartan-bold text-[15px] leading-[18px] ${report.reportCount >= highCountFrom ? "text-[#FF9B42]" : "text-muted-light dark:text-muted-dark"}`}
        >
          {report.reportCount}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Estado",
      width: 130,
      render: (report) => <StatusChip status={report.status} />,
    },
    {
      key: "assignee",
      header: "Asignado a",
      render: (report) =>
        report.assignee ? (
          <Text className="font-spartan-bold text-sm leading-[17px] text-ink-light dark:text-ink-dark">
            {report.assignee}
          </Text>
        ) : (
          <Text className={`${mutedText} text-sm leading-[17px]`}>Sin asignar</Text>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={reports}
      keyExtractor={(report) => report.id}
      isRowHighlighted={(report) => report.isNew === true}
      rowLabel={(report) => `Abrir reporte de ${report.user.handle}, ${report.timeAgo}`}
      onRowPress={(report) => onOpenReport?.(report.id)}
      footer={
        <View className="h-14 flex-row items-center justify-between px-4">
          <Text className={`${mutedText} text-[13px] leading-4`}>
            Mostrando {reports.length} de {totalReports} reportes · {dateLabel}
          </Text>
          {reports.length < totalReports && (
            <Button label="Cargar más" variant="ghost" icon="chevron-down" onPress={onLoadMore} />
          )}
        </View>
      }
    />
  );
}
