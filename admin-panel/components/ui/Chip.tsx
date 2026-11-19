import { Text, View } from "react-native";

export type ChipVariant = "neutral" | "accent" | "success" | "notice" | "danger";

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
}

const containerStyles: Record<ChipVariant, string> = {
  neutral: "bg-soft-light dark:bg-soft-dark",
  accent: "bg-accentSoft-light dark:bg-accentSoft-dark",
  success: "bg-successSoft-light dark:bg-successSoft-dark",
  notice: "bg-noticeSoft-light dark:bg-noticeSoft-dark",
  danger: "bg-dangerSoft-light dark:bg-dangerSoft-dark",
};

const labelStyles: Record<ChipVariant, string> = {
  neutral: "text-muted-light dark:text-muted-dark",
  accent: "text-onAccentSoft-light dark:text-onAccentSoft-dark",
  success: "text-success-light dark:text-success-dark",
  notice: "text-onNoticeSoft-light dark:text-onNoticeSoft-dark",
  danger: "text-onDangerSoft-light dark:text-onDangerSoft-dark",
};

export function Chip({ label, variant = "neutral" }: ChipProps) {
  return (
    <View
      className={`self-start rounded-full px-[10px] py-[5px] ${containerStyles[variant]}`}
    >
      <Text
        className={`font-spartan text-[13px] leading-4 ${labelStyles[variant]}`}
      >
        {label}
      </Text>
    </View>
  );
}
