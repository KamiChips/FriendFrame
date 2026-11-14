import { Image } from "expo-image";

import type { Tone } from "@/constants/palette";
import { useTheme } from "@/hooks/use-theme";

// iconos exportados de figma; se tinen con el color del tema
const sources = {
  "arrow-left": require("@/assets/icons/arrow-left.svg"),
  "arrow-right": require("@/assets/icons/arrow-right.svg"),
  "arrow-up-right": require("@/assets/icons/arrow-up-right.svg"),
  "chevron-down": require("@/assets/icons/chevron-down.svg"),
  "clock-3": require("@/assets/icons/clock-3.svg"),
  eye: require("@/assets/icons/eye.svg"),
  "eye-off": require("@/assets/icons/eye-off.svg"),
  "file-search": require("@/assets/icons/file-search.svg"),
  flag: require("@/assets/icons/flag.svg"),
  hand: require("@/assets/icons/hand.svg"),
  "heart-handshake": require("@/assets/icons/heart-handshake.svg"),
  history: require("@/assets/icons/history.svg"),
  info: require("@/assets/icons/info.svg"),
  image: require("@/assets/icons/image.svg"),
  layers: require("@/assets/icons/layers.svg"),
  "layout-dashboard": require("@/assets/icons/layout-dashboard.svg"),
  "lock-keyhole": require("@/assets/icons/lock-keyhole.svg"),
  "log-out": require("@/assets/icons/log-out.svg"),
  "message-circle": require("@/assets/icons/message-circle.svg"),
  "message-square-warning": require("@/assets/icons/message-square-warning.svg"),
  "messages-square": require("@/assets/icons/messages-square.svg"),
  moon: require("@/assets/icons/moon.svg"),
  plus: require("@/assets/icons/plus.svg"),
  "refresh-cw": require("@/assets/icons/refresh-cw.svg"),
  "rotate-ccw": require("@/assets/icons/rotate-ccw.svg"),
  search: require("@/assets/icons/search.svg"),
  "shield-ban": require("@/assets/icons/shield-ban.svg"),
  "shield-check": require("@/assets/icons/shield-check.svg"),
  sun: require("@/assets/icons/sun.svg"),
  timer: require("@/assets/icons/timer.svg"),
  "user-round": require("@/assets/icons/user-round.svg"),
  users: require("@/assets/icons/users.svg"),
} as const;

export type IconName = keyof typeof sources;

export interface IconProps {
  name: IconName;
  size: number;
  // token de color del tema; "color" lo reemplaza con un valor fijo
  tone?: Tone;
  color?: string;
}

export function Icon({ name, size, tone = "muted", color }: IconProps) {
  const { colors } = useTheme();

  return (
    <Image
      testID={`icon-${name}`}
      source={sources[name]}
      style={{ width: size, height: size }}
      tintColor={color ?? colors[tone]}
      contentFit="contain"
    />
  );
}
