import { supabase } from "@/lib/supabase/client";
import {
  SignInParams,
  AuthResult,
  AuthUser,
} from "@/services/supabase/auth/auth.types";
import { parseAuthError } from "./auth.errors";
import { _removeCurrentDeviceToken } from "./auth.notifications";
import {
  fetchProfile,
  validateEmail,
  validateRedirectUrl,
} from "./auth.helpers";

export async function signIn({
  email,
  password,
}: SignInParams): Promise<AuthResult<AuthUser>> {
  try {
    const cleanEmail = validateEmail(email);
    if (!password) throw new Error("La contraseña es requerida.");

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No se pudo iniciar sesión.");

    const profile = await fetchProfile(authData.user.id);
    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}

export async function signInWithGoogle(
  redirectTo: string,
): Promise<AuthResult> {
  try {
    validateRedirectUrl(redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) _removeCurrentDeviceToken(user.id).catch(() => {});

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}

//Este se usa para restaurar la sesion cuando se inicia la app
/* Ejemplo:
const{data, user} = await getCurrentUser()

if(user){
    hay sesion activa, navegar a home
} else{
    no hay sesion activa, navegar a login
}
*/
export async function getCurrentUser(): Promise<AuthResult<AuthUser>> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      if (authError.message.includes("Auth session missing"))
        return { data: null, error: null };
      throw authError;
    }

    if (!user) return { data: null, error: null };

    const profile = await fetchProfile(user.id);
    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}
