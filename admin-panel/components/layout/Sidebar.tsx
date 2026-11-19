import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { type SectionKey, sections } from "@/constants/navigation";
import { teamRoles } from "@/constants/team";
import type { TeamRole } from "@/types/moderation";

export interface CurrentUser {
  handle: string;
  initials: string;
  role: TeamRole;
  avatarUrl?: string | null;
}

export interface SidebarProps {
  // ausente en paginas que no pertenecen a una seccion, como un enlace roto
  activeSection?: SectionKey;
  currentUser: CurrentUser;
  // recuentos opcionales por seccion, como los reportes abiertos
  sectionCounts?: Partial<Record<SectionKey, number>>;
  onNavigate?: (section: SectionKey) => void;
  onSignOut?: () => void;
}

export function Sidebar({
  activeSection,
  currentUser,
  sectionCounts = {},
  onNavigate,
  onSignOut,
}: SidebarProps) {
  return (
    <View className="w-[248px] gap-5 border-r border-line-light bg-surface-light px-5 pb-6 pt-[30px] dark:border-line-dark dark:bg-surface-dark">
      <View className="pl-2">
        <BrandLogo size={25} />
        <Text className="font-spartan text-[11px] leading-[13px] text-muted-light dark:text-muted-dark">
          CONSOLA / MODERACIÓN
        </Text>
      </View>

      <View className="gap-2 pt-6">
        {/* las secciones de administracion no se ofrecen a moderadores */}
        {sections
          .filter((section) => !section.adminOnly || currentUser.role === "admin")
          .map((section) => {
          const isActive = section.key === activeSection;
          const count = sectionCounts[section.key];

          return (
            <Pressable
              key={section.key}
              accessibilityRole="link"
              accessibilityLabel={section.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => onNavigate?.(section.key)}
              className={`h-[46px] flex-row items-center gap-3 rounded-xl px-4 ${isActive ? "bg-accentSoft-light dark:bg-accentSoft-dark" : ""}`}
            >
              <Icon name={section.icon} size={20} tone={isActive ? "onAccentSoft" : "muted"} />
              <Text
                className={`font-spartan text-base leading-[19px] ${isActive ? "text-onAccentSoft-light dark:text-onAccentSoft-dark" : "text-muted-light dark:text-muted-dark"}`}
              >
                {section.label}
              </Text>
              {count !== undefined && (
                <View className="h-6 min-w-[26px] items-center justify-center rounded-lg bg-surface-light px-1 dark:bg-canvas-dark">
                  <Text className="font-spartan text-xs leading-[14px] text-ink-light dark:text-ink-dark">
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />

      <View className="gap-2 rounded-xl bg-soft-light p-4 dark:bg-soft-dark">
        <Icon name="heart-handshake" size={24} tone="accent" />
        <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
          Cuidamos la comunidad.
        </Text>
        <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
          Cada decisión cuenta. Modera con contexto y empatía.
        </Text>
      </View>

      <View className="h-px bg-line-light dark:bg-line-dark" />

      <View className="flex-row items-center gap-3">
        <Avatar initials={currentUser.initials} imageUrl={currentUser.avatarUrl} />
        <View className="gap-[3px]">
          <Text className="font-spartan-bold text-base leading-[19px] text-ink-light dark:text-ink-dark">
            {currentUser.handle}
          </Text>
          <Chip label={teamRoles[currentUser.role].label} variant={teamRoles[currentUser.role].variant} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        onPress={onSignOut}
        className="flex-row gap-[10px] self-start pl-2"
      >
        <Icon name="log-out" size={18} tone="muted" />
        <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}
