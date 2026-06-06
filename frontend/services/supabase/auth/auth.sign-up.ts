import { supabase } from "@/lib/supabase/client";
import { SignUpParams, AuthResult, AuthUser } from "./auth.types";
import { parseAuthError } from "./auth.errors";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
  waitForProfile,
} from "./auth.helpers";

export async function signUp({
  email,
  password,
  full_name,
  username,
}: SignUpParams): Promise<AuthResult<AuthUser>> {
  try {
    // console.log("[SIGNUP] Iniciando");
    const cleanEmail = validateEmail(email);
    const cleanUsername = validateUsername(username);
    const cleanName = validateFullName(full_name);
    validatePassword(password);

    // console.log("[SIGNUP] Validaciones OK");

    // Verificar username disponible antes de crear la cuenta
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", cleanUsername)
      .maybeSingle();

    // console.log("[SIGNUP] Resultado búsqueda username:", {
    //   existing,
    //   existingError,
    // });

    if (existing)
      return { data: null, error: "Ese nombre de usuario ya está en uso." };

    // console.log("[SIGNUP] Llamando supabase.auth.signUp");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          username: cleanUsername,
        },
      },
    });

    // console.log("[SIGNUP] Respuesta auth:", {
    //   authData,
    //   authError,
    // });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No se pudo crear el usuario.");

    const profile = await waitForProfile(authData.user.id);
    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}
