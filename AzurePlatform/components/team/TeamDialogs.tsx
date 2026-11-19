import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { TextField } from "@/components/ui/TextField";
import { teamRoles } from "@/constants/team";
import type { TeamMember, TeamRole, UserRef } from "@/types/moderation";

// cuenta encontrada en la busqueda que puede sumarse al equipo
export interface MemberCandidate extends UserRef {
  id: string;
}

export interface AddMemberDialogProps {
  visible: boolean;
  // resultado de la ultima busqueda; null si no hay coincidencia
  candidate?: MemberCandidate | null;
  onSearch?: (query: string) => void;
  onConfirm?: (userId: string, role: TeamRole) => void;
  onCancel?: () => void;
}

const roleOptions: TeamRole[] = ["moderator", "admin"];

export function AddMemberDialog({ visible, candidate, onSearch, onConfirm, onCancel }: AddMemberDialogProps) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<TeamRole>("moderator");

  return (
    <ConfirmDialog
      visible={visible}
      icon="user-plus"
      title="Agregar miembro"
      confirmLabel="Agregar"
      confirmDisabled={!candidate}
      onConfirm={() => candidate && onConfirm?.(candidate.id, role)}
      onCancel={onCancel}
    >
      <TextField
        label="Buscar por nombre o @username"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          onSearch?.(text);
        }}
        autoCapitalize="none"
      />

      {candidate && (
        <View className="w-full flex-row items-center gap-[10px]">
          <Avatar initials={candidate.initials} imageUrl={candidate.avatarUrl} size={32} />
          <Text className="font-spartan-bold text-base leading-[19px] text-ink-light dark:text-ink-dark">
            {candidate.handle}
          </Text>
          <Icon name="check" size={18} tone="accent" />
        </View>
      )}

      <View accessibilityRole="radiogroup" className="w-full flex-row gap-[10px]">
        {roleOptions.map((option) => {
          const isSelected = option === role;

          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={teamRoles[option].label}
              accessibilityState={{ checked: isSelected }}
              onPress={() => setRole(option)}
              className={`h-10 min-w-0 flex-1 items-center justify-center rounded-xl ${isSelected ? "border-2 border-accent-light bg-accentSoft-light dark:border-accent-dark dark:bg-accentSoft-dark" : "border border-line-light dark:border-line-dark"}`}
            >
              <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
                {isSelected ? "◉" : "○"} {teamRoles[option].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ConfirmDialog>
  );
}

export interface RemoveRoleDialogProps {
  visible: boolean;
  member: TeamMember;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function RemoveRoleDialog({ visible, member, onConfirm, onCancel }: RemoveRoleDialogProps) {
  return (
    <ConfirmDialog
      visible={visible}
      tone="danger"
      icon="user-minus"
      title={`Quitar rol a ${member.handle}`}
      confirmLabel="Quitar rol"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Chip label={teamRoles[member.role].label} variant="accent" />
      <Text className="text-center font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        {member.handle} perderá el acceso al panel. Su cuenta de FriendFrame seguirá activa.
      </Text>
    </ConfirmDialog>
  );
}
