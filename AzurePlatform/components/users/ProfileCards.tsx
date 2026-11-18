import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { contentTypes } from "@/constants/content-types";
import { timelineIcons } from "@/constants/sanctions";
import type { HiddenContent, ProfileCounter, TimelineEvent, UserProfile } from "@/types/moderation";

import { AccountStatusChip } from "./AccountStatusChip";

const muted = "font-spartan text-muted-light dark:text-muted-dark";
const link = "font-spartan text-link-light dark:text-link-dark";

export interface ProfileIdentityCardProps {
  profile: UserProfile;
  onOpenReport?: (reportId: string) => void;
}

// quien es la cuenta y, si esta sancionada, por que
export function ProfileIdentityCard({ profile, onOpenReport }: ProfileIdentityCardProps) {
  const sanction = profile.activeSanction;

  return (
    <Card className="p-6">
      <View className="flex-row items-center gap-[22px]">
        <Avatar initials={profile.initials} imageUrl={profile.avatarUrl} size={82} textSize={30} />
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="font-spartan-bold text-[27px] leading-8 text-ink-light dark:text-ink-dark">
            {profile.name}
          </Text>
          <Text className="font-spartan-bold text-lg leading-[22px] text-ink-light dark:text-ink-dark">
            {profile.handle}
          </Text>
          <Text className={`${muted} text-sm leading-[17px]`}>
            Miembro desde el {profile.memberSince}
          </Text>
        </View>
        <View className="items-end gap-2">
          <AccountStatusChip status={profile.status} until={sanction?.until} />
          {sanction && (
            <>
              <Text className={`${muted} text-[13px] leading-4`}>
                Aplicada por {sanction.appliedBy} · {sanction.appliedAt}
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Reporte ${sanction.reportCode}`}
                onPress={() => onOpenReport?.(sanction.reportId)}
              >
                <Text className={`${link} text-[13px] leading-4`}>Reporte {sanction.reportCode} ↗</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

export function CounterCard({ counter }: { counter: ProfileCounter }) {
  return (
    <Card className="min-w-0 flex-1 gap-1.5 p-[18px]">
      <View className="flex-row items-center gap-[14px]">
        <Text className="font-spartan-bold text-[32px] leading-[38px] text-ink-light dark:text-ink-dark">
          {counter.value}
        </Text>
        <Text className="font-spartan text-lg leading-[22px] text-ink-light dark:text-ink-dark">
          {counter.label}
        </Text>
      </View>
      <Text className={`${muted} text-[13px] leading-4`}>{counter.caption}</Text>
    </Card>
  );
}

export type ProfileTab = "timeline" | "hidden";

export interface ProfileActivityCardProps {
  activeTab: ProfileTab;
  // handle de la cuenta, autora de todo su contenido oculto
  handle: string;
  events: TimelineEvent[];
  hiddenContent: HiddenContent[];
  onChangeTab?: (tab: ProfileTab) => void;
  onRestoreContent?: (contentId: string) => void;
}

// contenido oculto de la cuenta con su contexto y la opcion de restaurarlo
function HiddenContentRow({
  item,
  handle,
  onRestore,
}: {
  item: HiddenContent;
  handle: string;
  onRestore?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-4 py-3">
      <View className="h-[78px] w-[112px] overflow-hidden rounded-xl bg-soft-light dark:bg-soft-dark">
        {item.mediaUrl && (
          <Image source={{ uri: item.mediaUrl }} style={{ width: 112, height: 78 }} contentFit="cover" />
        )}
      </View>
      <View className="min-w-0 flex-1 gap-1.5">
        <Text className="font-spartan-bold text-lg leading-[22px] text-ink-light dark:text-ink-dark">
          {contentTypes[item.contentType].label} · {item.reportCode}
        </Text>
        <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
          Publicado por {handle}
        </Text>
        <Text className={`${muted} text-sm leading-[17px]`}>En el perfil de {item.profileOwnerHandle}</Text>
        <Text className={`${muted} text-[13px] leading-4`}>Oculto · {item.hiddenAt}</Text>
      </View>
      <Button label="Restaurar" onPress={onRestore} />
    </View>
  );
}

// pestanas del perfil: eventos de moderacion y contenido oculto
export function ProfileActivityCard({
  activeTab,
  handle,
  events,
  hiddenContent,
  onChangeTab,
  onRestoreContent,
}: ProfileActivityCardProps) {
  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "timeline", label: "Línea de tiempo" },
    { key: "hidden", label: `Contenido oculto (${hiddenContent.length})` },
  ];

  return (
    <Card className="gap-[18px] p-[22px]">
      <View accessibilityRole="tablist" className="flex-row gap-7 border-b border-line-light dark:border-line-dark">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => onChangeTab?.(tab.key)}
              className={`pb-3 ${isActive ? "border-b-[3px] border-[#30C2D9] dark:border-accent-dark" : ""}`}
            >
              <Text
                className={`font-spartan text-lg leading-[22px] ${isActive ? "text-onAccentSoft-light dark:text-onAccentSoft-dark" : "text-muted-light dark:text-muted-dark"}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "timeline" &&
        events.map((event) => (
          <View key={event.id} className="flex-row items-start gap-[14px]">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-soft-light dark:bg-soft-dark">
              <Icon name={timelineIcons[event.kind]} size={17} tone="accent" />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <View className="flex-row items-start justify-between">
                <Text className="font-spartan text-base leading-[19px] text-ink-light dark:text-ink-dark">
                  {event.title}
                </Text>
                <Text className={`${muted} text-xs leading-[14px]`}>{event.date}</Text>
              </View>
              <Text className={`${muted} text-[13px] leading-4`}>
                {[event.moderator, event.reportCode, event.note].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        ))}

      {activeTab === "hidden" &&
        (hiddenContent.length > 0 ? (
          hiddenContent.map((item) => (
            <HiddenContentRow
              key={item.id}
              item={item}
              handle={handle}
              onRestore={() => onRestoreContent?.(item.id)}
            />
          ))
        ) : (
          <Text className={`${muted} text-sm leading-[17px]`}>La cuenta no tiene contenido oculto.</Text>
        ))}
    </Card>
  );
}

export interface RestoreGuidanceCardProps {
  handle: string;
  onViewReports?: () => void;
}

// recordatorio de lo que implica restaurar una cuenta sancionada
export function RestoreGuidanceCard({ handle, onViewReports }: RestoreGuidanceCardProps) {
  return (
    <Card className="gap-4 p-[22px]">
      <Icon name="info" size={24} tone="accent" />
      <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
        Antes de restaurar
      </Text>
      <Text className={`${muted} text-[15px] leading-[18px]`}>
        La cuenta recuperará el acceso a FriendFrame. La evidencia y el historial de moderación se
        conservarán.
      </Text>
      <View className="h-px bg-line-light dark:bg-line-dark" />
      <Text className="font-spartan text-sm leading-[17px] text-ink-light dark:text-ink-dark">
        Registra un motivo en las notas internas para dejar contexto al equipo.
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Ver reportes de ${handle}`}
        onPress={onViewReports}
        className="self-start"
      >
        <Text className={`${link} text-sm leading-[17px]`}>Ver reportes de {handle} ↗</Text>
      </Pressable>
    </Card>
  );
}
