import { Image } from "expo-image";
import { Text, View } from "react-native";

export interface AvatarProps {
  initials: string;
  // foto del usuario; sin ella se muestran las iniciales
  imageUrl?: string | null;
  size?: number;
  // tamano de letra de las iniciales en px
  textSize?: number;
}

export function Avatar({ initials, imageUrl, size = 36, textSize = 12 }: AvatarProps) {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl) {
    return (
      <Image
        testID="avatar-image"
        source={{ uri: imageUrl }}
        style={dimensions}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-[#30C2D9]"
      style={dimensions}
    >
      <Text
        className="font-spartan-bold text-[#182240]"
        style={{ fontSize: textSize, lineHeight: Math.round(textSize * 1.2) }}
      >
        {initials}
      </Text>
    </View>
  );
}
