import { Text, View } from "react-native";

import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { Chip } from "@/components/ui/Chip";
import { UserSearchCard } from "@/components/users/UserSearchCard";
import { UsersTable } from "@/components/users/UsersTable";
import { countLabel, formatCount } from "@/lib/format";
import type { UserAccount } from "@/types/moderation";

export interface UsersScreenProps {
  shell: ShellProps;
  // cuentas registradas en total, no solo las encontradas
  totalAccounts: number;
  statusFilter: string;
  users: UserAccount[];
  hasMore?: boolean;
  onSearch?: (query: string) => void;
  onOpenStatusFilter?: () => void;
  onViewProfile?: (userId: string) => void;
  onLoadMore?: () => void;
}

export function UsersScreen({
  shell,
  totalAccounts,
  statusFilter,
  users,
  hasMore,
  onSearch,
  onOpenStatusFilter,
  onViewProfile,
  onLoadMore,
}: UsersScreenProps) {
  return (
    <AppShell
      {...shell}
      activeSection="users"
      breadcrumb="Moderación / Usuarios"
      title="Usuarios"
      headerActions={<Chip label={`${formatCount(totalAccounts)} cuentas`} />}
    >
      <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        Encuentra una cuenta y revisa su contexto antes de actuar.
      </Text>

      <UserSearchCard
        statusFilter={statusFilter}
        onSearch={onSearch}
        onOpenStatusFilter={onOpenStatusFilter}
      />

      <View className="flex-row items-start justify-between">
        <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
          Resultados
        </Text>
        <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          {countLabel(users.length, "cuenta", "cuentas")} · ordenadas por actividad reciente
        </Text>
      </View>

      <UsersTable
        users={users}
        hasMore={hasMore}
        onViewProfile={onViewProfile}
        onLoadMore={onLoadMore}
      />
    </AppShell>
  );
}
