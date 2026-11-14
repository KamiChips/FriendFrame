import { Pressable, Text, View } from "react-native";

import { AccountCell } from "@/components/ui/AccountCell";
import { type Column, DataTable } from "@/components/ui/DataTable";
import type { UserAccount } from "@/types/moderation";

import { AccountStatusChip } from "./AccountStatusChip";

export interface UsersTableProps {
  users: UserAccount[];
  hasMore?: boolean;
  onViewProfile?: (userId: string) => void;
  onLoadMore?: () => void;
}

const link = "font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark";

export function UsersTable({ users, hasMore = false, onViewProfile, onLoadMore }: UsersTableProps) {
  const columns: Column<UserAccount>[] = [
    {
      key: "account",
      header: "Cuenta",
      width: 370,
      render: (user) => <AccountCell name={user.name} account={user} />,
    },
    {
      key: "status",
      header: "Estado",
      width: 180,
      render: (user) => <AccountStatusChip status={user.status} />,
    },
    {
      key: "reports",
      header: "Reportes recibidos",
      width: 150,
      render: (user) => (
        <Text className="font-spartan-bold text-[17px] leading-5 text-ink-light dark:text-ink-dark">
          {user.reportsReceived}
        </Text>
      ),
    },
    {
      key: "activity",
      header: "Última actividad",
      render: (user) => (
        <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          {user.lastActivity}
        </Text>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      width: 80,
      render: (user) => (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Ver perfil de ${user.handle}`}
          onPress={() => onViewProfile?.(user.id)}
        >
          <Text className={link}>Ver perfil ↗</Text>
        </Pressable>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      keyExtractor={(user) => user.id}
      rowTestID={(user) => `user-row-${user.id}`}
      rowHeight={68}
      density="comfortable"
      footer={
        <View className="h-[50px] flex-row items-center justify-between px-[22px]">
          <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
            No se muestran datos personales sensibles.
          </Text>
          {hasMore && (
            <Pressable accessibilityRole="button" accessibilityLabel="Cargar más" onPress={onLoadMore}>
              <Text className={link}>Cargar más ↓</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}
