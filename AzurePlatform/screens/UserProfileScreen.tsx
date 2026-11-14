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
import type { UserProfile } from "@/types/moderation";

export interface UserProfileScreenProps {
  shell: ShellProps;
  profile: UserProfile;
  activeTab?: ProfileTab;
  onChangeTab?: (tab: ProfileTab) => void;
  onRestoreAccount?: () => void;
  onOpenReport?: (reportId: string) => void;
  onViewReports?: () => void;
}

export function UserProfileScreen({
  shell,
  profile,
  activeTab = "timeline",
  onChangeTab,
  onRestoreAccount,
  onOpenReport,
  onViewReports,
}: UserProfileScreenProps) {
  // solo las cuentas suspendidas o baneadas se pueden restaurar
  const isSanctioned = profile.status !== "active";

  return (
    <AppShell
      {...shell}
      activeSection="users"
      breadcrumb={`Moderación / Usuarios / ${profile.handle}`}
      title={profile.handle}
      headerActions={
        isSanctioned && (
          <Button
            label="Restaurar cuenta"
            variant="primary"
            icon="rotate-ccw"
            onPress={onRestoreAccount}
          />
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
            events={profile.timeline}
            hiddenContentCount={profile.hiddenContentCount}
            onChangeTab={onChangeTab}
          />
        </View>
        <View className="min-w-0 flex-[368]">
          {isSanctioned && (
            <RestoreGuidanceCard handle={profile.handle} onViewReports={onViewReports} />
          )}
        </View>
      </View>
    </AppShell>
  );
}
