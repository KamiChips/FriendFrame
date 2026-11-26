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

// campo relleno del diseno con etiqueta flotante: vacio, la etiqueta ocupa el lugar del texto; al enfocarlo
// o escribir sube arriba a la izquierda. En foco la etiqueta y la linea se pintan de naranja.
// Todo es CSS (peer + :placeholder-shown), asi funciona con register() de react-hook-form y el autocompletado
export function TextField({ label, error, type = "text", ...inputProps }: TextFieldProps) {
  const id = useId();
  const [isHidden, setIsHidden] = useState(true);
  const isPassword = type === "password";

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className={cn(
          "relative h-[62px] w-full rounded-t-lg border-b-2 bg-soft transition-colors duration-200",
          "focus-within:border-[#E07B1F] dark:focus-within:border-[#FF9B42]",
          error ? "border-danger" : "border-line",
        )}
      >
        <input
          id={id}
          type={isPassword && !isHidden ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
          // un espacio como placeholder permite saber con CSS si el campo esta vacio
          placeholder=" "
          className={cn(
            "peer absolute inset-x-3 bottom-[9px] h-6 bg-transparent text-[17px] leading-6 outline-none",
            isPassword && "right-10",
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute top-[9px] left-3 text-xs leading-[14px] text-muted-foreground transition-all duration-200 ease-out",
            // vacio y sin foco: grande y centrada, como si fuera el texto del campo
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[17px] peer-placeholder-shown:leading-5",
            // en foco: arriba a la izquierda y naranja
            "peer-focus:top-[9px] peer-focus:translate-y-0 peer-focus:text-xs peer-focus:leading-[14px] peer-focus:text-[#E07B1F] dark:peer-focus:text-[#FF9B42]",
            "motion-reduce:transition-none",
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            aria-label={isHidden ? "Show password" : "Hide password"}
            onClick={() => setIsHidden((hidden) => !hidden)}
            className="absolute right-3 bottom-[12px]"
          >
            <Icon name={isHidden ? "eye-off" : "eye"} size={18} />
          </button>
        )}
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
          Internal notes{required ? " · required" : ""}
        </label>
        <Textarea
          id={id}
          maxLength={NOTES_MAX_LENGTH}
          placeholder="Write the reason for the decision"
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
