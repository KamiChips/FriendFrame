import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { Metric } from "@/types/moderation";

export interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card className="min-w-0 flex-1 gap-3 p-5">
      <View className="flex-row items-start justify-between">
        <Text className="font-spartan text-[15px] leading-[18px] text-muted-light dark:text-muted-dark">
          {metric.label}
        </Text>
        <Icon name={metric.icon} size={21} tone="accent" />
      </View>
      <Text className="font-spartan-bold text-4xl leading-[43px] text-ink-light dark:text-ink-dark">
        {metric.value}
      </Text>
      <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
        {metric.caption}
      </Text>
    </Card>
  );
}
