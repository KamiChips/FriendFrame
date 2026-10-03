import { parseAuthError } from '@/services/supabase/auth/auth.errors';

describe('parseAuthError', () => {
    it('Shows message for null error', () => {
        expect(parseAuthError(null)).toBe('Unknown error');
    });

    it("translates 'User already registered'", () => {
        expect(parseAuthError(new Error('User already registered'))).toBe(
            'An account with that email already exists.'
        );
    });

    it("translates 'Invalid login credentials'", () => {
        expect(parseAuthError(new Error('Invalid login credentials'))).toBe(
            'Invalid email or password.'
        );
    });

    it("translates 'Email not confirmed'", () => {
        expect(parseAuthError(new Error('Email not confirmed'))).toBe(
            'Please confirm your email before logging in.'
        );
    });

    it("translates 'Auth session missing'", () => {
        expect(parseAuthError(new Error('Auth session missing'))).toBe(
            'No active session.'
        );
    });

    it('translates network errors', () => {
        expect(parseAuthError(new Error('NetworkError'))).toBe(
            'Network error. Check your connection.'
        );
    });

    it('translates fetch errors (failed to fetch)', () => {
        expect(parseAuthError(new Error('Failed to fetch'))).toBe(
            'Network error. Check your connection.'
        );
    });

    it("translates 'Unable to validate email address'", () => {
        expect(
            parseAuthError(new Error('Unable to validate email address'))
        ).toBe('Invalid email format.');
    });

    it('shows proper message sent as parameter', () => {
        const m = 'El email no tiene formato válido.';
        expect(parseAuthError(new Error(m))).toBe(m);
    });

    it('returns a generic error message for unknown messages.', () => {
        expect(parseAuthError(new Error('sepa que paso aqui'))).toBe(
            'An unexpected error occurred.'
        );
    });
});
