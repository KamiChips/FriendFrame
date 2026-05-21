import { supabase } from "@/lib/supabase/client"
import { AuthUser } from "@/services/supabase/auth/types"

export function onAuthStateChange(
    callback: (user: AuthUser | null) => void
): () => void{
    const{ data: {subscription }} = supabase.auth.onAuthStateChange(
        async(event, session) => {
            if(!session?.user){
                callback(null)
                return
            }

            if(event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED'){
                const{data: profile} = await supabase
                .from('users')
                .select('*')
                .eq('user_id', session.user.id)
                .single()

                callback(profile as AuthUser ?? null)
            }

            if(event === 'SIGNED_OUT'){
                callback(null)
            }
        }
    )

    return () => subscription.unsubscribe();
}