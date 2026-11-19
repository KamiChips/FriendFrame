import { Text, View } from "react-native";

import { AccountCell } from "@/components/ui/AccountCell";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { type Column, DataTable } from "@/components/ui/DataTable";
import { teamRoles } from "@/constants/team";
import type { TeamMember } from "@/types/moderation";

export interface TeamTableProps {
  members: TeamMember[];
  // fecha y hora ya formateadas, como "8 nov 2026 · 11:05"
  lastUpdated: string;
  onRemoveRole?: (memberId: string) => void;
}

export function TeamTable({ members, lastUpdated, onRemoveRole }: TeamTableProps) {
  const columns: Column<TeamMember>[] = [
    {
      key: "member",
      header: "Miembro",
      width: 300,
      render: (member) => (
        <AccountCell
          name={member.isCurrentUser ? `${member.name} (tú)` : member.name}
          account={member}
        />
      ),
    },
    {
      key: "role",
      header: "Rol",
      width: 145,
      render: (member) => (
        <Chip label={teamRoles[member.role].label} variant={teamRoles[member.role].variant} />
      ),
    },
    {
      key: "grantedBy",
      header: "Otorgado por",
      width: 175,
      render: (member) => (
        // sin moderador que lo otorgara, el rol viene de la configuracion inicial
        <Text
          className={`text-[15px] leading-[18px] text-ink-light dark:text-ink-dark ${member.grantedBy ? "font-spartan-bold" : "font-spartan"}`}
        >
          {member.grantedBy ?? "Sistema"}
        </Text>
      ),
    },
    {
      key: "joinedAt",
      header: "Fecha de alta",
      width: 140,
      render: (member) => (
        <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          {member.joinedAt}
        </Text>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (member) => (
        <View className="items-start gap-1.5">
          <Button
            label="Quitar rol"
            variant="danger"
            accessibilityLabel={`Quitar rol a ${member.handle}`}
            disabled={member.isCurrentUser}
            onPress={() => onRemoveRole?.(member.id)}
          />
          {member.isCurrentUser && (
            <View className="rounded-md bg-soft-light px-2 py-1 dark:bg-soft-dark">
              <Text className="font-spartan text-[11px] leading-[13px] text-ink-light dark:text-ink-dark">
                No puedes quitarte tu propio rol
              </Text>
            </View>
          )}
        </View>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={members}
      keyExtractor={(member) => member.id}
      rowTestID={(member) => `member-row-${member.id}`}
      rowHeight={90}
      density="comfortable"
      headerHeight={44}
      footer={
        <View className="h-[50px] flex-row items-center px-[22px]">
          <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
            Última actualización: {lastUpdated}
          </Text>
        </View>
      }
    />
  );
}
