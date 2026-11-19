import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotesField } from "@/components/ui/NotesField";

export interface RestoreAccountDialogProps {
  visible: boolean;
  handle: string;
  onConfirm?: (notes: string) => void;
  onCancel?: () => void;
}

// restaurar exige un motivo para dejar contexto al equipo
export function RestoreAccountDialog({ visible, handle, onConfirm, onCancel }: RestoreAccountDialogProps) {
  const [notes, setNotes] = useState("");

  return (
    <ConfirmDialog
      visible={visible}
      icon="rotate-ccw"
      title={`Restaurar a ${handle}`}
      description="La cuenta recuperará el acceso. Conservaremos su historial."
      dense
      confirmLabel="Restaurar"
      confirmDisabled={notes.trim().length === 0}
      onConfirm={() => onConfirm?.(notes)}
      onCancel={onCancel}
    >
      <NotesField value={notes} onChangeText={setNotes} required />
    </ConfirmDialog>
  );
}
