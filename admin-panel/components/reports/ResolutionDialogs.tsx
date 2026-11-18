import { useState } from "react";
import { Text } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotesField } from "@/components/ui/NotesField";
import { TextField } from "@/components/ui/TextField";
import { countLabel } from "@/lib/format";

// aviso de los reportes que se cierran junto con el actual; vacio si no hay otros
function closingNotice(otherPendingCount: number) {
  if (otherPendingCount <= 0) return null;
  return otherPendingCount === 1
    ? "Se cerrará también el otro reporte pendiente de este contenido."
    : `Se cerrarán también los otros ${otherPendingCount} reportes pendientes de este contenido.`;
}

export interface SuspensionDialogProps {
  visible: boolean;
  authorHandle: string;
  days: number;
  // fecha de fin ya formateada, como "15 nov 2026"
  until: string;
  otherPendingCount: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function SuspensionDialog({
  visible,
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
      visible={visible}
      icon="clock-3"
      title="Confirmar suspensión"
      description={`${authorHandle} no podrá acceder durante ${countLabel(days, "día", "días")}.`}
      confirmLabel="Suspender"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Chip label={`Suspendido hasta: ${until}`} variant="notice" />
      {notice && (
        <Text className="text-center font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          {notice}
        </Text>
      )}
    </ConfirmDialog>
  );
}

export interface BanDialogProps {
  visible: boolean;
  authorHandle: string;
  // notas escritas en el panel; pueden ajustarse antes de confirmar
  initialNotes: string;
  onConfirm?: (notes: string) => void;
  onCancel?: () => void;
}

// el baneo se confirma escribiendo el usuario, para evitar banear a la cuenta equivocada
export function BanDialog({ visible, authorHandle, initialNotes, onConfirm, onCancel }: BanDialogProps) {
  const [typedHandle, setTypedHandle] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const canConfirm = typedHandle.trim() === authorHandle && notes.trim().length > 0;

  return (
    <ConfirmDialog
      visible={visible}
      tone="danger"
      icon="shield-ban"
      title={`Banear a ${authorHandle}`}
      description="Confirma la cuenta que perderá el acceso."
      dense
      confirmLabel="Banear"
      confirmDisabled={!canConfirm}
      onConfirm={() => onConfirm?.(notes)}
      onCancel={onCancel}
    >
      <TextField
        label={`Escribe ${authorHandle} para confirmar`}
        value={typedHandle}
        onChangeText={setTypedHandle}
        autoCapitalize="none"
      />
      <NotesField value={notes} onChangeText={setNotes} required />
    </ConfirmDialog>
  );
}
