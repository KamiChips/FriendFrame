import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { contentTypes } from "@/constants/content-types";
import type { ContentType, ReportedContent } from "@/types/moderation";

export interface EvidenceCardProps {
  contentType: ContentType;
  content: ReportedContent;
  reporterHandle: string;
  statement: string;
  onReveal?: () => void;
}

const REVEAL_LABEL = "Contenido potencialmente sensible — clic para revelar";

export function EvidenceCard({
  contentType,
  content,
  reporterHandle,
  statement,
  onReveal,
}: EvidenceCardProps) {
  const isVeiled = content.isSensitive && !content.isRevealed;
  const details = [contentTypes[contentType].label, content.postedAt];
  // el feed invertido permite publicar en perfiles ajenos; se senala porque cambia el contexto
  if (content.author.handle !== content.profileOwnerHandle) {
    details.push("Autor ≠ dueño del perfil");
  }

  return (
    <Card className="gap-4 p-5">
      <View className="flex-row items-center gap-[10px]">
        <Avatar initials={content.author.initials} imageUrl={content.author.avatarUrl} size={38} />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-spartan-bold text-[17px] leading-5 text-ink-light dark:text-ink-dark">
            Publicado por {content.author.handle}
          </Text>
          <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
            en el perfil de {content.profileOwnerHandle}
          </Text>
        </View>
        {content.isVisible ? <Chip label="Visible" variant="success" /> : <Chip label="Oculto" />}
      </View>

      <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
        {details.join(" · ")}
      </Text>

      {/* el alto cambia con el estado, igual que en el diseno */}
      <View
        className="items-center justify-center overflow-hidden rounded-xl bg-soft-light dark:bg-soft-dark"
        style={{ height: isVeiled ? 230 : 185 }}
      >
        {content.mediaUrl && (
          <Image
            testID="evidence-media"
            source={{ uri: content.mediaUrl }}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            contentFit="cover"
            blurRadius={isVeiled ? 10 : 0}
          />
        )}

        {isVeiled && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={REVEAL_LABEL}
            onPress={onReveal}
            className="absolute inset-0 items-center justify-center gap-[10px] bg-[rgba(24,34,64,0.5)]"
          >
            <Icon name="eye-off" size={28} color="#FFFFFF" />
            <Text className="w-[450px] max-w-full text-center font-spartan text-base leading-[19px] text-white">
              {REVEAL_LABEL}
            </Text>
          </Pressable>
        )}

        {content.isSensitive && content.isRevealed && (
          <View className="absolute left-3 top-3 flex-row gap-1.5 rounded-[20px] bg-[rgba(24,34,64,0.8)] px-[10px] py-1.5">
            <Icon name="eye" size={14} color="#FFFFFF" />
            <Text className="font-spartan text-xs leading-[14px] text-white">Evidencia revelada</Text>
          </View>
        )}
      </View>

      <View className="gap-[7px] rounded-[10px] bg-soft-light p-[14px] dark:bg-soft-dark">
        <Text className="font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
          REPORTADO POR {reporterHandle}
        </Text>
        <Text className="font-spartan text-base leading-[19px] text-ink-light dark:text-ink-dark">
          “{statement}”
        </Text>
      </View>
    </Card>
  );
}
