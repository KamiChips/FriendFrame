import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { resolutionActions, suspensionDurations } from "@/constants/sanctions";
import { useTheme } from "@/hooks/use-theme";
import { addDays, countLabel, formatDate } from "@/lib/format";
import type { Resolution, ResolutionAction } from "@/types/moderation";

export interface ResolutionPanelProps {
  authorHandle: string;
  // otros reportes pendientes del mismo contenido que se cerraran junto con este
  otherPendingCount: number;
  // dia desde el que se cuenta la suspension; por defecto hoy
  referenceDate?: Date;
  onSubmit?: (resolution: Resolution) => void;
}

export function ResolutionPanel({
  authorHandle,
  otherPendingCount,
  referenceDate,
  onSubmit,
}: ResolutionPanelProps) {
  const { colors } = useTheme();
  const [action, setAction] = useState<ResolutionAction | null>(null);
  const [suspensionDays, setSuspensionDays] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const isSuspension = action === "suspend";
  const selected = resolutionActions.find((option) => option.key === action);
  // suspender exige duracion; las demas acciones solo exigen estar elegidas
  const canSubmit = action !== null && (!isSuspension || suspensionDays !== null);

  const submit = () => {
    if (action === null) return;
    onSubmit?.(
      isSuspension && suspensionDays !== null
        ? { action, suspensionDays, notes }
        : { action, notes },
    );
  };

  return (
    <Card className="gap-[15px] p-[22px]">
      <Text className="font-spartan-bold text-[21px] leading-[25px] text-ink-light dark:text-ink-dark">
        Resolver reporte
      </Text>
      <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
        Selecciona una acción para {authorHandle}.
      </Text>

      <View accessibilityRole="radiogroup" className="gap-[3px]">
        {resolutionActions.map((option) => {
          const isSelected = option.key === action;

          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: isSelected }}
              onPress={() => setAction(option.key)}
              className={`h-[35px] flex-row items-center gap-[10px] rounded-lg px-[10px] ${isSelected ? "bg-accentSoft-light dark:bg-accentSoft-dark" : ""}`}
            >
              <View
                className="h-[18px] w-[18px] items-center justify-center rounded-full border-2"
                style={{ borderColor: isSelected ? colors.accent : colors.line }}
              >
                {isSelected && (
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                )}
              </View>
              <Text
                className={`font-spartan text-base leading-[19px] ${option.isDestructive ? "text-danger-light dark:text-danger-dark" : "text-ink-light dark:text-ink-dark"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="h-px bg-line-light dark:bg-line-dark" />

      {isSuspension && (
        <>
          <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
            Duración de la suspensión
          </Text>
          <View className="flex-row gap-2">
            {suspensionDurations.map((days) => {
              const isSelected = days === suspensionDays;
              const label = countLabel(days, "día", "días");

              return (
                <Pressable
                  key={days}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSuspensionDays(days)}
                  className={`h-[34px] min-w-0 flex-1 items-center justify-center rounded-full ${isSelected ? "border-2 border-accent-light bg-accentSoft-light dark:border-accent-dark dark:bg-accentSoft-dark" : "border border-line-light bg-soft-light dark:border-line-dark dark:bg-soft-dark"}`}
                >
                  <Text
                    className={`font-spartan text-sm leading-[17px] ${isSelected ? "text-onAccentSoft-light dark:text-onAccentSoft-dark" : "text-ink-light dark:text-ink-dark"}`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {suspensionDays !== null && (
            <Text className="font-spartan-bold text-base leading-[19px] text-ink-light dark:text-ink-dark">
              Suspendido hasta: {formatDate(addDays(referenceDate ?? new Date(), suspensionDays))}
            </Text>
          )}
        </>
      )}

      <View className="h-[65px] gap-1.5 rounded-lg border-b-2 border-line-light bg-soft-light p-3 dark:border-line-dark dark:bg-soft-dark">
        <Text className="font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
          Notas internas
        </Text>
        <TextInput
          accessibilityLabel="Notas internas"
          value={notes}
          onChangeText={setNotes}
          className="font-spartan text-sm leading-[17px] text-ink-light outline-none dark:text-ink-dark"
        />
      </View>

      {otherPendingCount > 0 && (
        <View className="flex-row gap-[10px] rounded-[10px] bg-noticeSoft-light p-3 dark:bg-noticeSoft-dark">
          <Icon name="info" size={18} tone="onNoticeSoft" />
          <Text className="min-w-0 flex-1 font-spartan text-sm leading-[17px] text-onNoticeSoft-light dark:text-onNoticeSoft-dark">
            {otherPendingCount === 1
              ? "Se cerrará también el otro reporte pendiente de este contenido"
              : `Se cerrarán también los otros ${otherPendingCount} reportes pendientes de este contenido`}
          </Text>
        </View>
      )}

      <Button
        label={selected?.submitLabel ?? "Aplicar"}
        fullWidth
        disabled={!canSubmit}
        onPress={submit}
      />
    </Card>
  );
}
