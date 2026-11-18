import { Pressable, Text, View } from "react-native";

import type { Tone } from "@/constants/palette";

import { Icon, type IconName } from "./Icon";

export type ToastVariant = "success" | "error";

export interface ToastProps {
  variant: ToastVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const styles: Record<
  ToastVariant,
  { icon: IconName; tone: Tone; container: string; title: string; message: string }
> = {
  success: {
    icon: "circle-check",
    tone: "success",
    container: "bg-successSoft-light dark:bg-successSoft-dark",
    title: "text-success-light dark:text-success-dark",
    message: "text-success-light dark:text-success-dark",
  },
  error: {
    icon: "circle-alert",
    tone: "onDangerSoft",
    container: "bg-dangerSoft-light dark:bg-dangerSoft-dark",
    title: "text-onDangerSoft-light dark:text-onDangerSoft-dark",
    message: "text-onDangerSoftMuted-light dark:text-onDangerSoftMuted-dark",
  },
};

// aviso breve del resultado de una accion
export function Toast({ variant, title, message, onDismiss }: ToastProps) {
  const style = styles[variant];

  return (
    <View className={`w-full flex-row items-center gap-3 overflow-hidden rounded-xl p-4 ${style.container}`}>
      <Icon name={style.icon} size={20} tone={style.tone} />
      {/* solo el mensaje se anuncia; el boton de cerrar queda aparte */}
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="min-w-0 flex-1 gap-1"
      >
        <Text className={`font-spartan text-[17px] leading-5 ${style.title}`}>{title}</Text>
        {message && (
          <Text className={`font-spartan text-sm leading-[17px] ${style.message}`}>{message}</Text>
        )}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={onDismiss}>
        <Icon name="x" size={16} tone={style.tone} />
      </Pressable>
    </View>
  );
}
