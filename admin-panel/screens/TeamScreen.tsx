import { useState } from "react";
import { Text, View } from "react-native";

import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { AddMemberDialog, type MemberCandidate, RemoveRoleDialog } from "@/components/team/TeamDialogs";
import { TeamTable } from "@/components/team/TeamTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { teamRoles } from "@/constants/team";
import { countLabel } from "@/lib/format";
import type { TeamMember, TeamRole } from "@/types/moderation";

export interface TeamScreenProps {
  shell: ShellProps;
  members: TeamMember[];
  lastUpdated: string;
  // cuenta encontrada para agregar al equipo; la ruta la busca con onSearchCandidate
  candidate?: MemberCandidate | null;
  onSearchCandidate?: (query: string) => void;
  onAddMember?: (userId: string, role: TeamRole) => void;
  onRemoveRole?: (memberId: string) => void;
}

const roles: TeamRole[] = ["admin", "moderator"];

export function TeamScreen({
  shell,
  members,
  lastUpdated,
  candidate,
  onSearchCandidate,
  onAddMember,
  onRemoveRole,
}: TeamScreenProps) {
  // agregar y quitar roles piden confirmacion
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  return (
    <AppShell
      {...shell}
      activeSection="team"
      breadcrumb="Moderación / Equipo"
      title="Equipo"
      headerActions={
        <Button label="Agregar miembro" variant="primary" icon="plus" onPress={() => setIsAdding(true)} />
      }
    >
      <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        Gestiona quién ayuda a mantener FriendFrame seguro.
      </Text>

      <View className="h-9 flex-row items-center gap-3">
        <Text className="font-spartan-bold text-[21px] leading-[25px] text-ink-light dark:text-ink-dark">
          {countLabel(members.length, "miembro", "miembros")}
        </Text>
        {roles.map((role) => (
          <Chip
            key={role}
            label={countLabel(
              members.filter((member) => member.role === role).length,
              teamRoles[role].singular,
              teamRoles[role].plural,
            )}
            variant={teamRoles[role].variant}
          />
        ))}
        <View className="flex-1" />
        <Icon name="shield-check" size={18} tone="accent" />
        <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          Solo Admin puede gestionar roles
        </Text>
      </View>

      <TeamTable
        members={members}
        lastUpdated={lastUpdated}
        onRemoveRole={(memberId) => setRemoving(members.find((member) => member.id === memberId) ?? null)}
      />

      <View className="flex-row items-start gap-5">
        {roles.map((role) => (
          <Card key={role} className="min-w-0 flex-1 gap-3 p-[22px]">
            <View className="flex-row items-center gap-[10px]">
              <Icon name={teamRoles[role].icon} size={20} tone="accent" />
              <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
                {teamRoles[role].label}
              </Text>
            </View>
            <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
              {teamRoles[role].scope}
            </Text>
          </Card>
        ))}
      </View>

      {isAdding && (
        <AddMemberDialog
          visible
          candidate={candidate}
          onSearch={onSearchCandidate}
          onConfirm={(userId, role) => {
            setIsAdding(false);
            onAddMember?.(userId, role);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}
      {removing && (
        <RemoveRoleDialog
          visible
          member={removing}
          onConfirm={() => {
            setRemoving(null);
            onRemoveRole?.(removing.id);
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </AppShell>
  );
}
