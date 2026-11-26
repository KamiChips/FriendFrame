import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Chip } from "@/components/common/Chip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { NotesField, TextField } from "@/components/common/Fields";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { resolutionActions, suspensionDurations } from "@/constants/sanctions";
import { addDays, countLabel, formatDate } from "@/lib/format";
import { closingNotice } from "@/lib/summaries";
import { cn } from "@/lib/utils";
import {
  type BanConfirmValues,
  banConfirmSchema,
  type ResolutionValues,
  resolutionSchema,
} from "@/schemas/forms";
import type { Resolution } from "@/types/moderation";

export interface ResolutionPanelProps {
  authorHandle: string;
  // otros reportes pendientes del mismo contenido que se cerraran junto con este
  otherPendingCount: number;
  // dia desde el que se cuenta la suspension
  referenceDate: Date;
  isSubmitting?: boolean;
  onSubmit: (resolution: Resolution) => void;
}

// formulario para resolver un caso; las reglas viven en resolutionSchema
export function ResolutionPanel({
  authorHandle,
  otherPendingCount,
  referenceDate,
  isSubmitting,
  onSubmit,
}: ResolutionPanelProps) {
  const form = useForm<ResolutionValues>({
    resolver: zodResolver(resolutionSchema),
    mode: "onChange",
    defaultValues: { notes: "" },
  });
  const action = useWatch({ control: form.control, name: "action" });
  const suspensionDays = useWatch({ control: form.control, name: "suspensionDays" });
  const notes = useWatch({ control: form.control, name: "notes" });
  const selected = resolutionActions.find((option) => option.key === action);
  const notice = closingNotice(otherPendingCount);

  const submit = form.handleSubmit((values) =>
    onSubmit(
      values.action === "suspend"
        ? { action: values.action, suspensionDays: values.suspensionDays, notes: values.notes }
        : { action: values.action, notes: values.notes },
    ),
  );

  return (
    <Card className="gap-[15px] p-[22px]">
      <form noValidate onSubmit={submit} className="contents">
        <h2 className="text-[21px] leading-[25px] font-bold">Resolve report</h2>
        <p className="text-sm text-muted-foreground">Choose an action for {authorHandle}.</p>

        <Controller
          control={form.control}
          name="action"
          render={({ field }) => (
            <RadioGroup
              aria-label="Action"
              value={field.value ?? ""}
              onValueChange={(value) => {
                field.onChange(value);
                // la duracion solo aplica a suspensiones
                if (value !== "suspend") form.setValue("suspensionDays", undefined);
                void form.trigger();
              }}
              className="gap-[3px]"
            >
              {resolutionActions.map((option) => {
                const isSelected = option.key === field.value;
                const id = `action-${option.key}`;
                return (
                  <label
                    key={option.key}
                    htmlFor={id}
                    className={cn(
                      "flex h-[35px] cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-base",
                      isSelected && (option.isDestructive ? "bg-danger-soft" : "bg-brand-soft"),
                      option.isDestructive && (isSelected ? "text-on-danger-soft" : "text-danger"),
                    )}
                  >
                    <RadioGroupItem
                      id={id}
                      value={option.key}
                      className={cn(
                        "size-[18px] border-2 border-line",
                        option.isDestructive
                          ? "data-[state=checked]:border-danger [&_svg]:fill-danger"
                          : "data-[state=checked]:border-brand [&_svg]:fill-brand",
                      )}
                    />
                    {option.label}
                  </label>
                );
              })}
            </RadioGroup>
          )}
        />

        <div className="h-px bg-line" />

        {action === "suspend" && (
          <fieldset className="flex flex-col gap-[15px]">
            <legend className="mb-[15px] text-[15px]">Suspension length</legend>
            <div className="flex gap-2">
              {suspensionDurations.map((days) => {
                const isSelected = days === suspensionDays;
                return (
                  <button
                    key={days}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      form.setValue("suspensionDays", days, { shouldValidate: true });
                    }}
                    className={cn(
                      "h-[34px] min-w-0 flex-1 rounded-full text-sm",
                      isSelected
                        ? "border-2 border-brand bg-brand-soft text-on-brand-soft"
                        : "border border-line bg-soft",
                    )}
                  >
                    {countLabel(days, "day", "days")}
                  </button>
                );
              })}
            </div>
            {suspensionDays !== undefined && (
              <p className="text-base font-bold">
                Suspended until: {formatDate(addDays(referenceDate, suspensionDays))}
              </p>
            )}
          </fieldset>
        )}

        <NotesField
          length={notes.length}
          required={selected?.requiresNotes}
          error={form.formState.errors.notes?.message}
          {...form.register("notes")}
        />

        {notice && (
          <p className="flex gap-2.5 rounded-[10px] bg-notice-soft p-3 text-sm text-on-notice-soft">
            <Icon name="info" size={18} className="text-current" />
            {notice}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          variant={selected?.isDestructive ? "destructive" : "secondary"}
          disabled={!form.formState.isValid || isSubmitting}
        >
          {selected?.submitLabel ?? "Apply"}
        </Button>
      </form>
    </Card>
  );
}

export interface SuspensionDialogProps {
  authorHandle: string;
  days: number;
  // fecha de fin ya formateada, como "15 nov 2026"
  until: string;
  otherPendingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SuspensionDialog({
  authorHandle,
  days,
  until,
  otherPendingCount,
  onConfirm,
  onCancel,
}: SuspensionDialogProps) {
  const notice = closingNotice(otherPendingCount);
  return (
    <ConfirmDialog
      open
      icon="clock-3"
      title="Confirm suspension"
      description={`${authorHandle} won't be able to sign in for ${countLabel(days, "day", "days")}.`}
      confirmLabel="Suspend"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Chip label={`Suspended until: ${until}`} variant="notice" />
      {notice && <p className="text-center text-sm text-muted-foreground">{notice}.</p>}
    </ConfirmDialog>
  );
}

export interface BanDialogProps {
  authorHandle: string;
  // notas escritas en el panel; pueden ajustarse antes de confirmar
  initialNotes: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

// el baneo se confirma escribiendo el usuario, para evitar banear a la cuenta equivocada
export function BanDialog({ authorHandle, initialNotes, onConfirm, onCancel }: BanDialogProps) {
  const form = useForm<BanConfirmValues>({
    resolver: zodResolver(banConfirmSchema(authorHandle)),
    mode: "onChange",
    defaultValues: { typedHandle: "", notes: initialNotes },
  });
  const notes = useWatch({ control: form.control, name: "notes" });

  return (
    <ConfirmDialog
      open
      tone="danger"
      icon="shield-ban"
      title={`Ban ${authorHandle}`}
      description="Confirm the account that will lose access."
      confirmLabel="Ban"
      confirmDisabled={!form.formState.isValid}
      formId="ban-form"
      onCancel={onCancel}
    >
      <form
        id="ban-form"
        noValidate
        className="flex w-full flex-col gap-[18px]"
        onSubmit={form.handleSubmit((values) => onConfirm(values.notes))}
      >
        <TextField
          label={`Type ${authorHandle} to confirm`}
          autoCapitalize="none"
          autoComplete="off"
          {...form.register("typedHandle")}
        />
        <NotesField length={notes.length} required {...form.register("notes")} />
      </form>
    </ConfirmDialog>
  );
}
