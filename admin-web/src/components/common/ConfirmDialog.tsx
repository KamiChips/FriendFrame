import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { Icon, type IconName } from "./Icon";

export interface ConfirmDialogProps {
  open: boolean;
  // "danger" pinta el circulo y el boton de confirmar en rojo
  tone?: "normal" | "danger";
  icon: IconName;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  // con formId el boton confirmar envia ese formulario (validado con react-hook-form)
  formId?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  // piezas propias de cada flujo: chips, campos, avisos
  children?: ReactNode;
}

// confirmacion modal con dos acciones del mismo ancho; Esc o clic fuera cancelan
export function ConfirmDialog({
  open,
  tone = "normal",
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmDisabled = false,
  formId,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const isDanger = tone === "danger";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[437px] flex-col items-center gap-[18px] rounded-3xl border-line bg-surface p-6"
      >
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full",
            isDanger ? "bg-danger-soft" : "bg-brand-soft",
          )}
        >
          <Icon name={icon} size={32} className={isDanger ? "text-on-danger-soft" : "text-brand"} />
        </div>
        <DialogHeader className="items-center gap-[18px] text-center sm:text-center">
          <DialogTitle className="text-[23px] leading-7 font-bold">{title}</DialogTitle>
          <DialogDescription
            className={description ? "text-base leading-[19px] text-muted-foreground" : "sr-only"}
          >
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="grid w-full grid-cols-2 gap-3 sm:flex-none">
          <Button className="w-full" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="w-full"
            variant={isDanger ? "destructive" : "default"}
            disabled={confirmDisabled}
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
