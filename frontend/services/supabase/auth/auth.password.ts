import { supabase } from "@/lib/supabase/client";
import { AuthResult } from "./auth.types";
import { parseAuthError } from "./auth.errors";
import {
  validateEmail,
  validatePassword,
  validateRedirectUrl,
} from "./auth.helpers";

export async function changePassword(newPassword: string): Promise<AuthResult> {
  try {
    validatePassword(newPassword);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}

export async function resetPassword(
  email: string,
  redirectTo: string,
): Promise<AuthResult> {
  try {
    const cleanEmail = validateEmail(email);
    validateRedirectUrl(redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });
    if (error) throw error;

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}
