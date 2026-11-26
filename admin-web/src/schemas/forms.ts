import { z } from "zod";

// reglas de los formularios del panel. Estan escritas sin nada de React para que puedan moverse
// a un paquete compartido con el backend y validar lo mismo en ambos lados

export const NOTES_MAX_LENGTH = 500;

const notes = z.string().max(NOTES_MAX_LENGTH, `Maximum ${NOTES_MAX_LENGTH} characters`);
const requiredNotes = notes.trim().min(1, "Write the reason for the decision");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const resolutionActions = ["dismiss", "hide_content", "warn", "suspend", "ban"] as const;

// suspender exige duracion y banear exige notas; el resto solo exige elegir la accion
export const resolutionSchema = z
  .object({
    action: z.enum(resolutionActions, { error: "Choose an action" }),
    suspensionDays: z.number().int().positive().optional(),
    notes,
  })
  .superRefine((value, context) => {
    if (value.action === "suspend" && value.suspensionDays === undefined) {
      context.addIssue({ code: "custom", path: ["suspensionDays"], message: "Choose the duration" });
    }
    if (value.action === "ban" && value.notes.trim().length === 0) {
      context.addIssue({ code: "custom", path: ["notes"], message: "Notes are required" });
    }
  });
export type ResolutionValues = z.infer<typeof resolutionSchema>;

// el baneo se confirma escribiendo el usuario, para no banear a la cuenta equivocada
export const banConfirmSchema = (authorHandle: string) =>
  z.object({
    typedHandle: z
      .string()
      .trim()
      .refine((value) => value === authorHandle, {
        message: `Type ${authorHandle} exactly`,
      }),
    notes: requiredNotes,
  });
export type BanConfirmValues = z.infer<ReturnType<typeof banConfirmSchema>>;

export const restoreAccountSchema = z.object({ notes: requiredNotes });
export type RestoreAccountValues = z.infer<typeof restoreAccountSchema>;

export const addMemberSchema = z.object({
  query: z.string(),
  role: z.enum(["admin", "moderator"]),
});
export type AddMemberValues = z.infer<typeof addMemberSchema>;
