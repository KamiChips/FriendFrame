import { type ComponentProps, useId, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NOTES_MAX_LENGTH } from "@/schemas/forms";

import { Icon } from "./Icon";

export interface TextFieldProps extends Omit<ComponentProps<"input">, "className"> {
  label: string;
  // mensaje bajo el campo; tambien pinta el borde de rojo
  error?: string;
}

// campo relleno del diseno: etiqueta dentro y linea inferior. Funciona con register() de react-hook-form
export function TextField({ label, error, type = "text", ...inputProps }: TextFieldProps) {
  const id = useId();
  const [isHidden, setIsHidden] = useState(true);
  const isPassword = type === "password";

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className={cn(
          "flex h-[62px] w-full flex-col gap-[7px] rounded-t-lg border-b-2 bg-soft px-3 py-[9px] focus-within:border-brand",
          error ? "border-danger" : "border-line",
        )}
      >
        <label htmlFor={id} className="text-xs leading-[14px] text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center justify-between gap-2">
          <input
            id={id}
            type={isPassword && !isHidden ? "text" : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="min-w-0 flex-1 bg-transparent text-[17px] leading-5 outline-none placeholder:text-muted-foreground"
            {...inputProps}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={isHidden ? "Mostrar contraseña" : "Ocultar contraseña"}
              onClick={() => setIsHidden((hidden) => !hidden)}
            >
              <Icon name={isHidden ? "eye-off" : "eye"} size={18} />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[13px] leading-4 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export interface NotesFieldProps extends Omit<ComponentProps<"textarea">, "className"> {
  // largo actual del texto para el contador
  length: number;
  required?: boolean;
  error?: string;
}

// notas internas con contador de caracteres, como en las confirmaciones
export function NotesField({ length, required = false, error, ...textareaProps }: NotesFieldProps) {
  const id = useId();

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className={cn(
          "flex min-h-[76px] w-full flex-col gap-2 border-b-2 bg-soft p-3 focus-within:border-brand",
          error ? "border-danger" : "border-line",
        )}
      >
        <label htmlFor={id} className="text-xs leading-[14px] text-muted-foreground">
          Notas internas{required ? " · obligatorio" : ""}
        </label>
        <Textarea
          id={id}
          maxLength={NOTES_MAX_LENGTH}
          placeholder="Escribe el motivo de la decisión"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-h-10 resize-none rounded-none border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent"
          {...textareaProps}
        />
      </div>
      <div className="flex justify-between gap-2 text-xs leading-[14px]">
        <span id={`${id}-error`} className="text-danger">
          {error}
        </span>
        <span className="text-muted-foreground">
          {length} / {NOTES_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
