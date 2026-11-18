import type { ReactNode } from "react";
import { Modal, Text, View } from "react-native";

import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

export type ConfirmTone = "normal" | "danger";

export interface ConfirmDialogProps {
  visible: boolean;
  // "danger" pinta el circulo y el boton de confirmar en rojo
  tone?: ConfirmTone;
  icon: IconName;
  title: string;
  description?: string;
  // texto de la descripcion un punto menor, para flujos con campos
  dense?: boolean;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  // piezas propias de cada flujo: chips, campos, avisos
  children?: ReactNode;
}

const circles: Record<ConfirmTone, string> = {
  normal: "bg-accentSoft-light dark:bg-accentSoft-dark",
  danger: "bg-dangerSoft-light dark:bg-dangerSoft-dark",
};

// confirmacion sobre un fondo oscurecido, con dos acciones del mismo ancho
export function ConfirmDialog({
  visible,
  tone = "normal",
  icon,
  title,
  description,
  dense = false,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-[rgba(0,0,0,0.5)] p-4">
        <View
          accessibilityRole="alert"
          className="w-[437px] max-w-full items-center gap-[18px] rounded-3xl border border-line-light bg-surface-light p-6 dark:border-line-dark dark:bg-surface-dark"
        >
          <View className={`h-20 w-20 items-center justify-center rounded-full ${circles[tone]}`}>
            <Icon name={icon} size={32} tone={tone === "danger" ? "onDangerSoft" : "accent"} />
          </View>
          <Text className="text-center font-spartan-bold text-[23px] leading-7 text-ink-light dark:text-ink-dark">
            {title}
          </Text>
          {description && (
            <Text
              className={`text-center font-spartan text-muted-light dark:text-muted-dark ${dense ? "text-[15px] leading-[18px]" : "text-base leading-[19px]"}`}
            >
              {description}
            </Text>
          )}
          {children}
          <View className="w-full flex-row gap-3">
            <View className="min-w-0 flex-1">
              <Button label={cancelLabel} fullWidth onPress={onCancel} />
            </View>
            <View className="min-w-0 flex-1">
              <Button
                label={confirmLabel}
                variant={tone === "danger" ? "danger" : "primary"}
                fullWidth
                disabled={confirmDisabled}
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
