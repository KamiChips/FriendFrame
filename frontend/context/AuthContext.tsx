import { registerDeviceToken } from '@/services/supabase/auth/auth.notifications';
import { onAuthStateChange } from '@/services/supabase/auth/auth.session';
import { getCurrentUser } from '@/services/supabase/auth/auth.sign-in';
import { AuthUser } from '@/services/supabase/auth/auth.types';
import {
    getPendingVerificationEmail,
    clearPendingVerificationEmail,
} from '@/services/supabase/auth/auth.helpers';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
    setProfilePic: (url: string) => void;
    pendingVerificationEmail: string | null;
    clearPendingVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
        string | null
    >(null);

    useEffect(() => {
        Promise.all([getCurrentUser(), getPendingVerificationEmail()]).then(
            ([{ data }, pendingEmail]) => {
                setUser(data);
                setPendingVerificationEmail(pendingEmail);
                setLoading(false);

                if (data) registerDeviceToken(data.user_id);
            }
        );
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((updatedUser) => {
            setUser(updatedUser);

            if (updatedUser?.email_confirmed_at) {
                clearPendingVerificationEmail();
                setPendingVerificationEmail(null);
            }

            if (updatedUser) {
                registerDeviceToken(updatedUser.user_id);
            }
        });
        return unsubscribe;
    }, []);

    const clearPendingVerification = useCallback(async () => {
        await clearPendingVerificationEmail();
        setPendingVerificationEmail(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const { data } = await getCurrentUser();
        setUser(data);
    }, []);

    const setProfilePic = useCallback((url: string) => {
        setUser((prev) => (prev ? { ...prev, profile_pic: url } : prev));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                refreshUser,
                setProfilePic,
                pendingVerificationEmail,
                clearPendingVerification,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvide>');
    return ctx;
}
