import { useState } from "react";
import { Pressable, Text } from "react-native";

import type { Tone } from "@/constants/palette";

import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  // ocupa todo el ancho del contenedor
  fullWidth?: boolean;
  onPress?: () => void;
  // nombre accesible cuando la etiqueta sola no basta, como en filas de tabla
  accessibilityLabel?: string;
}

const containerStyles: Record<ButtonVariant, string> = {
  primary: "bg-action-light dark:bg-action-dark",
  secondary: "border-2 border-[#182240] bg-[#E5E7EB]",
  ghost: "bg-transparent",
  danger: "bg-danger-light dark:bg-dangerSoft-dark",
};

const labelStyles: Record<ButtonVariant, string> = {
  primary: "text-onAction-light dark:text-onAction-dark",
  secondary: "text-[#182240]",
  ghost: "text-link-light dark:text-link-dark",
  danger: "text-white",
};

const iconTones: Record<ButtonVariant, Tone> = {
  primary: "onAction",
  secondary: "ink",
  ghost: "link",
  danger: "onDangerSoft",
};

// estados del componente maestro: reposo, hover (borde de acento) y deshabilitado (apagado)
function containerClass(variant: ButtonVariant, disabled: boolean, hovered: boolean) {
  if (disabled) {
    // el secundario conserva su borde; los demas pierden color para no invitar a presionarlos
    const border = variant === "secondary" ? "border-2 border-[#182240]" : "";
    return `bg-soft-light opacity-[0.55] dark:bg-soft-dark ${border}`;
  }
  const hover = hovered ? "border-2 border-accent-light dark:border-accent-dark" : "";
  return `${containerStyles[variant]} ${hover}`;
}

export function Button({
  label,
  variant = "secondary",
  icon,
  disabled = false,
  fullWidth = false,
  onPress,
  accessibilityLabel,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className={`h-10 flex-row items-center justify-center gap-2 rounded-full px-[18px] ${containerClass(variant, disabled, hovered)} ${fullWidth ? "w-full" : "self-start"}`}
    >
      {icon && <Icon name={icon} size={17} tone={disabled ? "faint" : iconTones[variant]} />}
      <Text
        className={`font-spartan text-[15px] leading-[18px] ${disabled ? "text-faint-light dark:text-faint-dark" : labelStyles[variant]}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
