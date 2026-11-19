import { useState } from "react";
import { Text, View } from "react-native";

import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  CounterCard,
  ProfileActivityCard,
  ProfileIdentityCard,
  type ProfileTab,
  RestoreGuidanceCard,
} from "@/components/users/ProfileCards";
import { RestoreAccountDialog } from "@/components/users/RestoreAccountDialog";
import type { UserProfile } from "@/types/moderation";

export interface UserProfileScreenProps {
  shell: ShellProps;
  profile: UserProfile;
  activeTab?: ProfileTab;
  onChangeTab?: (tab: ProfileTab) => void;
  // recibe las notas con el motivo de la restauracion
  onRestoreAccount?: (notes: string) => void;
  onRestoreContent?: (contentId: string) => void;
  onOpenReport?: (reportId: string) => void;
  onViewReports?: () => void;
}

export function UserProfileScreen({
  shell,
  profile,
  activeTab = "timeline",
  onChangeTab,
  onRestoreAccount,
  onRestoreContent,
  onOpenReport,
  onViewReports,
}: UserProfileScreenProps) {
  // solo las cuentas suspendidas o baneadas se pueden restaurar
  const isSanctioned = profile.status !== "active";
  const [isRestoring, setIsRestoring] = useState(false);

  return (
    <AppShell
      {...shell}
      activeSection="users"
      breadcrumb={`Moderación / Usuarios / ${profile.handle}`}
      title={profile.handle}
      headerActions={
        isSanctioned ? (
          <Button
            label="Restaurar cuenta"
            variant="primary"
            icon="rotate-ccw"
            onPress={() => setIsRestoring(true)}
          />
        ) : (
          <Button label="Cuenta activa" variant="primary" icon="rotate-ccw" disabled />
        )
      }
    >
      <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        Perfil de moderación · contexto y actividad de la cuenta.
      </Text>

      <ProfileIdentityCard profile={profile} onOpenReport={onOpenReport} />

      <View className="flex-row gap-4">
        {profile.counters.map((counter) => (
          <CounterCard key={counter.id} counter={counter} />
        ))}
      </View>

      <View className="flex-row items-start gap-5">
        <View className="min-w-0 flex-[740]">
          <ProfileActivityCard
            activeTab={activeTab}
            handle={profile.handle}
            events={profile.timeline}
            hiddenContent={profile.hiddenContent}
            onChangeTab={onChangeTab}
            onRestoreContent={onRestoreContent}
          />
        </View>
        <View className="min-w-0 flex-[368]">
          {isSanctioned && (
            <RestoreGuidanceCard handle={profile.handle} onViewReports={onViewReports} />
          )}
        </View>
      </View>

      {isRestoring && (
        <RestoreAccountDialog
          visible
          handle={profile.handle}
          onConfirm={(notes) => {
            setIsRestoring(false);
            onRestoreAccount?.(notes);
          }}
          onCancel={() => setIsRestoring(false)}
        />
      )}
    </AppShell>
  );
}
