import { registerDeviceToken } from "@/services/supabase/auth/notifications";
import { onAuthStateChange } from "@/services/supabase/auth/session";
import { getCurrentUser } from "@/services/supabase/auth/sign-in";
import { AuthUser } from "@/services/supabase/auth/types";
import React, { createContext, useCallback, useEffect, useState } from "react";

interface AuthContextValue{
    user: AuthUser | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    setProfilePic: (url: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}:{children: React.ReactNode}){
    const [ user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUser().then(({data}) => {
            setUser(data)
            setLoading(false)

            if(data){
                registerDeviceToken(data.user_id)
            }
        })
    },[]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((updatedUser) => {
            setUser(updatedUser)

            if(updatedUser){
                registerDeviceToken(updatedUser.user_id)
            }
        })
        return unsubscribe
    }, [])

    const refreshUser = useCallback(async () => {
        const{ data } = await getCurrentUser()
        setUser(data)
    }, [])

    const setProfilePic = useCallback((url: string) => {
        setUser(prev => prev ? {...prev, profile_pic: url} : prev)
    }, [])

    return(
        <AuthContext.Provider value={{user, loading, refreshUser, setProfilePic}}>
            {children}
        </AuthContext.Provider>
    )
}