import { Text, View } from "react-native";

import type { UserRef } from "@/types/moderation";

import { Avatar } from "./Avatar";

export interface AccountCellProps {
  // nombre a mostrar; puede llevar un sufijo que senale al usuario actual
  name: string;
  account: UserRef;
}

// avatar con nombre y handle en dos lineas, para tablas de cuentas
export function AccountCell({ name, account }: AccountCellProps) {
  return (
    <View className="flex-row items-center gap-3">
      <Avatar initials={account.initials} imageUrl={account.avatarUrl} size={40} textSize={22} />
      <View className="min-w-0 gap-1">
        <Text className="font-spartan text-[17px] leading-5 text-ink-light dark:text-ink-dark">
          {name}
        </Text>
        <Text className="font-spartan-bold text-sm leading-[17px] text-ink-light dark:text-ink-dark">
          {account.handle}
        </Text>
      </View>
    </View>
  );
}
