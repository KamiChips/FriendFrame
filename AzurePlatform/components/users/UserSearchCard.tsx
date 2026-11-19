import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SelectField } from "@/components/ui/SelectField";
import { useTheme } from "@/hooks/use-theme";

export interface UserSearchCardProps {
  // texto del estado elegido en el filtro
  statusFilter: string;
  onSearch?: (query: string) => void;
  onOpenStatusFilter?: () => void;
}

const PLACEHOLDER = "Buscar por nombre o @username";

export function UserSearchCard({ statusFilter, onSearch, onOpenStatusFilter }: UserSearchCardProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  return (
    <Card className="gap-3 p-[22px]">
      <Text className="font-spartan-bold text-lg leading-[22px] text-ink-light dark:text-ink-dark">
        ¿A quién estás buscando?
      </Text>
      <View className="flex-row items-center gap-5">
        <View className="h-[50px] min-w-0 flex-1 flex-row items-center gap-3 border-b-2 border-line-light bg-soft-light px-[14px] dark:border-line-dark dark:bg-soft-dark">
          <Icon name="search" size={20} tone="muted" />
          <TextInput
            accessibilityLabel={PLACEHOLDER}
            placeholder={PLACEHOLDER}
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => onSearch?.(query)}
            className="min-w-0 flex-1 font-spartan text-lg leading-[22px] text-ink-light outline-none dark:text-ink-dark"
          />
        </View>
        <SelectField label="Estado" value={statusFilter} width={180} onPress={onOpenStatusFilter} />
        <Button label="Buscar" onPress={() => onSearch?.(query)} />
      </View>
    </Card>
  );
}
