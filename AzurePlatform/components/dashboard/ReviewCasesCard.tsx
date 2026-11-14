import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { ReviewCase } from "@/types/moderation";

export interface ReviewCasesCardProps {
  cases: ReviewCase[];
  onOpenCase?: (caseId: string) => void;
  onViewAll?: () => void;
}

export function ReviewCasesCard({ cases, onOpenCase, onViewAll }: ReviewCasesCardProps) {
  return (
    <Card className="min-w-0 gap-[15px] p-[22px]">
      <View className="flex-row items-start justify-between">
        <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
          Mis casos en revisión ({cases.length})
        </Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Ver mis casos" onPress={onViewAll}>
          <Text className="font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark">
            Ver mis casos →
          </Text>
        </Pressable>
      </View>

      {cases.map((reviewCase) => (
        <Pressable
          key={reviewCase.id}
          accessibilityRole="button"
          accessibilityLabel={`Abrir caso ${reviewCase.code}`}
          onPress={() => onOpenCase?.(reviewCase.id)}
          className="flex-row items-center gap-[14px]"
        >
          <Icon name="file-search" size={20} tone="accent" />
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
              {[reviewCase.code, reviewCase.reason, reviewCase.contentType].join(" · ")}
            </Text>
            <Text className="font-spartan-bold text-[13px] leading-4 text-ink-light dark:text-ink-dark">
              {reviewCase.handle}
            </Text>
          </View>
          <Text className="font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
            {reviewCase.timeAgo}
          </Text>
          <Icon name="arrow-right" size={16} tone="link" />
        </Pressable>
      ))}
    </Card>
  );
}
