import { supabase } from "@/lib/supabase/client";
import {
  AuthUser,
  EMAIL_REGEX,
  MAX_FULL_NAME_LEN,
  MIN_PASSWORD_LEN,
  TRIGGER_RETRIES,
  TRIGGER_WAIT_MS,
  USERNAME_REGEX,
} from "./auth.types";

export function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("El email es requerido.");
  if (!EMAIL_REGEX.test(trimmed))
    throw new Error("El email no tiene un formato válido.");
  return trimmed;
}

export function validatePassword(password: string): void {
  if (!password) throw new Error("La contraseña es requerida.");
  if (password.length < MIN_PASSWORD_LEN)
    throw new Error(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`,
    );
}

export function validateUsername(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) throw new Error("El nombre de usuario es requerido.");
  if (!USERNAME_REGEX.test(trimmed))
    throw new Error(
      "El username solo puede contener letras minúsculas, números y guiones bajos (3-30 caracteres).",
    );
  return trimmed;
}

export function validateFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) throw new Error("El nombre completo es requerido.");
  if (trimmed.length > MAX_FULL_NAME_LEN)
    throw new Error(
      `El nombre no puede superar ${MAX_FULL_NAME_LEN} caracteres.`,
    );
  return trimmed;
}

export function validateRedirectUrl(url: string): void {
  if (!url || !url.includes("://"))
    throw new Error("La URL de redirección no es válida.");
}

export async function fetchProfile(userId: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "user_id, full_name, username, email, profile_pic, created_at, updated_at",
    )
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("No se encontró el perfil del usuario.");

  return data as AuthUser;
}

export async function waitForProfile(userId: string): Promise<AuthUser> {
  for (let attempt = 0; attempt < TRIGGER_RETRIES; attempt++) {
    await new Promise((r) => setTimeout(r, TRIGGER_WAIT_MS * (attempt + 1)));

    const { data } = await supabase
      .from("users")
      .select(
        "user_id, full_name, username, email, profile_pic, created_at, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (data) return data as AuthUser;
  }

  throw new Error("No se pudo crear el perfil. Intenta de nuevo.");
}
