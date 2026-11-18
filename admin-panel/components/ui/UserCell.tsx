import { Text, View } from "react-native";

import type { UserRef } from "@/types/moderation";

import { Avatar } from "./Avatar";

export interface UserCellProps {
  user: UserRef;
}

// avatar pequeno y handle, como aparecen en las filas de tabla
export function UserCell({ user }: UserCellProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Avatar initials={user.initials} imageUrl={user.avatarUrl} size={27} />
      <Text
        numberOfLines={1}
        className="font-spartan-bold text-sm leading-[17px] text-ink-light dark:text-ink-dark"
      >
        {user.handle}
      </Text>
    </View>
  );
}
