import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { sanctionKinds } from "@/constants/sanctions";
import { countLabel, joinDates } from "@/lib/format";
import type { RelatedReport, Sanction, SanctionKind } from "@/types/moderation";

import { StatusChip } from "./StatusChip";

const title = "font-spartan-bold text-lg leading-[22px] text-ink-light dark:text-ink-dark";
const muted = "font-spartan text-muted-light dark:text-muted-dark";
const link = "font-spartan text-link-light dark:text-link-dark";

// invitacion a tomar un caso que nadie tiene asignado
export function AssignmentCard({ onTakeCase }: { onTakeCase?: () => void }) {
  return (
    <Card className="gap-3 p-5">
      <Text className={title}>Este caso está disponible</Text>
      <Text className={`${muted} text-sm leading-[17px]`}>
        Tómalo para revisarlo y aplicar una acción.
      </Text>
      <Button label="Tomar caso" variant="primary" icon="hand" fullWidth onPress={onTakeCase} />
    </Card>
  );
}

export interface AuthorHistoryCardProps {
  authorHandle: string;
  sanctions: Sanction[];
  onViewProfile?: () => void;
}

// sanciones previas del autor, una por fila
export function AuthorHistoryCard({ authorHandle, sanctions, onViewProfile }: AuthorHistoryCardProps) {
  return (
    <Card className="gap-[14px] p-5">
      <View className="flex-row items-start justify-between">
        <Text className={title}>Historial del autor</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Ver perfil" onPress={onViewProfile}>
          <Text className={`${link} text-[13px] leading-4`}>Ver perfil ↗</Text>
        </Pressable>
      </View>
      <Text className="font-spartan-bold text-sm leading-[17px] text-ink-light dark:text-ink-dark">
        {authorHandle}
      </Text>
      {sanctions.map((sanction) => (
        <View key={sanction.id} className="flex-row items-center gap-[10px]">
          <Icon name={sanctionKinds[sanction.kind].icon} size={18} tone="onNoticeSoft" />
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-spartan text-sm leading-[17px] text-ink-light dark:text-ink-dark">
              {sanctionKinds[sanction.kind].label} · {sanction.detail}
            </Text>
            <Text className={`${muted} text-xs leading-[14px]`}>{sanction.date}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

export interface RelatedReportsCardProps {
  // a que apuntan todos los reportes, como "post de @a en el perfil de @b"
  targetDescription: string;
  reports: RelatedReport[];
  onOpenReport?: (reportId: string) => void;
}

// otros reportes sobre el mismo contenido
export function RelatedReportsCard({ targetDescription, reports, onOpenReport }: RelatedReportsCardProps) {
  return (
    <Card className="gap-3 p-5">
      <Text className={title}>
        Mismo contenido · {countLabel(reports.length, "reporte", "reportes")}
      </Text>
      <Text className={`${muted} text-[13px] leading-4`}>
        El objetivo es el mismo {targetDescription}.
      </Text>
      {reports.map((report) => (
        <View key={report.id} className="flex-row items-center justify-between">
          <View className="gap-[3px]">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={report.code}
              onPress={() => onOpenReport?.(report.id)}
            >
              <Text className={`${link} text-sm leading-[17px]`}>{report.code}</Text>
            </Pressable>
            <Text className={`${muted} text-xs leading-[14px]`}>{report.reporterHandle}</Text>
          </View>
          <StatusChip status={report.status} />
        </View>
      ))}
    </Card>
  );
}

// resumen de sanciones por tipo, en orden de gravedad
function summarizeSanctions(sanctions: Sanction[]) {
  const kinds: SanctionKind[] = ["warning", "suspension", "ban"];
  const parts = kinds
    .map((kind) => ({ kind, count: sanctions.filter((sanction) => sanction.kind === kind).length }))
    .filter(({ count }) => count > 0)
    .map(({ kind, count }) => countLabel(count, sanctionKinds[kind].singular, sanctionKinds[kind].plural));
  return parts.length > 0 ? parts.join(" · ") : "Sin sanciones previas";
}

export interface CaseSummaryCardProps {
  authorHandle: string;
  sanctions: Sanction[];
  relatedCount: number;
  onViewHistory?: () => void;
  onViewRelated?: () => void;
}

// version compacta de historial y relacionados para cuando el caso ya se esta resolviendo
export function CaseSummaryCard({
  authorHandle,
  sanctions,
  relatedCount,
  onViewHistory,
  onViewRelated,
}: CaseSummaryCardProps) {
  const dates = joinDates(sanctions.map((sanction) => sanction.date));

  return (
    <Card className="gap-3 p-[18px]">
      <View className="flex-row items-center justify-between">
        <View className="gap-[5px]">
          <Text className="font-spartan-bold text-[17px] leading-5 text-ink-light dark:text-ink-dark">
            {summarizeSanctions(sanctions)}
          </Text>
          <Text className={`${muted} text-[13px] leading-4`}>
            {[dates, authorHandle].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <Pressable accessibilityRole="link" accessibilityLabel="Ver historial" onPress={onViewHistory}>
          <Text className={`${link} text-sm leading-[17px]`}>Ver historial ↗</Text>
        </Pressable>
      </View>
      <View className="h-px bg-line-light dark:bg-line-dark" />
      <View className="flex-row items-start justify-between">
        <Text className="font-spartan text-sm leading-[17px] text-ink-light dark:text-ink-dark">
          {countLabel(relatedCount, "reporte", "reportes")} del mismo contenido
        </Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Ver relacionados" onPress={onViewRelated}>
          <Text className={`${link} text-sm leading-[17px]`}>Ver relacionados ↗</Text>
        </Pressable>
      </View>
    </Card>
  );
}
