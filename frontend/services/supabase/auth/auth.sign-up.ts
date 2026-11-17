import { supabase } from '@/lib/supabase/client';
import { SignUpParams, AuthResult, AuthUser } from './auth.types';
import { parseAuthError } from './auth.errors';
import {
    validateEmail,
    validateFullName,
    validatePassword,
    validateUsername,
    waitForProfile,
} from './auth.helpers';
import { signupAttempts } from '@/services/ratelimit/rateLimiter';

export const SIGNUP_RATE_LIMIT_MESSAGE = 'Demasiados registros. Intenta más tarde';

export async function signUp({
    email,
    password,
    full_name,
    username,
    ip,
}: SignUpParams & { ip: string }): Promise<AuthResult<AuthUser>> {
    try {
        const cleanEmail = validateEmail(email);
        const cleanUsername = validateUsername(username);
        const cleanName = validateFullName(full_name);
        validatePassword(password);

        // Rate limit por IP ANTES de tocar la base de datos
        const rateLimit = await signupAttempts(ip);
        if (!rateLimit.success) {
            return { data: null, error: SIGNUP_RATE_LIMIT_MESSAGE };
        }

        // Verificar username disponible antes de crear la cuenta
        const { data: existing, error: existingError } = await supabase
            .from('users')
            .select('user_id')
            .eq('username', cleanUsername)
            .maybeSingle();

        if (existing)
            return {
                data: null,
                error: 'Ese nombre de usuario ya está en uso.',
            };

        const { data: authData, error: authError } = await supabase.auth.signUp(
            {
                email: cleanEmail,
                password,
                options: {
                    data: {
                        full_name: cleanName,
                        username: cleanUsername,
                    },
                },
            }
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo crear el usuario.');

        const profile = await waitForProfile(authData.user.id);
        return { data: profile, error: null };
    } catch (err) {
        return { data: null, error: parseAuthError(err) };
    }
}
