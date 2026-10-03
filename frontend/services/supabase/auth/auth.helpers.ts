import { supabase } from '@/lib/supabase/client';
import {
    AuthUser,
    EMAIL_REGEX,
    MAX_FULL_NAME_LEN,
    MIN_PASSWORD_LEN,
    TRIGGER_RETRIES,
    TRIGGER_WAIT_MS,
    USERNAME_REGEX,
} from './auth.types';

export function validateEmail(email: string): string {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) throw new Error('Email is required.');
    if (!EMAIL_REGEX.test(trimmed))
        throw new Error('Invalid email format.');
    return trimmed;
}

export function validatePassword(password: string): void {
    if (!password) throw new Error('Password is required.');
    if (password.length < MIN_PASSWORD_LEN)
        throw new Error(
            `Password must be at least ${MIN_PASSWORD_LEN} characters.`
        );
}

export function validateUsername(username: string): string {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) throw new Error('Username is required.');
    if (!USERNAME_REGEX.test(trimmed))
        throw new Error(
            'Username can only contain lowercase letters, numbers, and underscores (3-30 characters).'
        );
    return trimmed;
}

export function validateFullName(fullName: string): string {
    const trimmed = fullName.trim();
    if (!trimmed) throw new Error('Full name is required.');
    if (trimmed.length > MAX_FULL_NAME_LEN)
        throw new Error(
            `Full name cannot exceed ${MAX_FULL_NAME_LEN} characters.`
        );
    return trimmed;
}

export function validateRedirectUrl(url: string): void {
    if (!url || !url.includes('://'))
        throw new Error('Invalid redirect URL.');
}

export async function fetchProfile(userId: string): Promise<AuthUser> {
    const { data, error } = await supabase
        .from('users')
        .select(
            'user_id, full_name, username, email, profile_pic, created_at, updated_at'
        )
        .eq('user_id', userId)
        .single();

    if (error) throw error;
    if (!data) throw new Error('User profile not found.');

    return data as AuthUser;
}

export async function waitForProfile(userId: string): Promise<AuthUser> {
    for (let attempt = 0; attempt < TRIGGER_RETRIES; attempt++) {
        await new Promise((r) =>
            setTimeout(r, TRIGGER_WAIT_MS * (attempt + 1))
        );

        const { data } = await supabase
            .from('users')
            .select(
                'user_id, full_name, username, email, profile_pic, created_at, updated_at'
            )
            .eq('user_id', userId)
            .maybeSingle();

        if (data) return data as AuthUser;
    }

    throw new Error('Could not create profile. Please try again.');
}
