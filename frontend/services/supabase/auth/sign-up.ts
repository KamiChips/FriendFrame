import { supabase } from "@/lib/supabase/client"
import { AuthUser } from "@supabase/supabase-js"
import { SignUpParams, AuthResult } from "./types"
import { parseAuthError } from "./auth.errors"

export async function signUp({
    email,
    password,
    full_name,
    username
}: SignUpParams): Promise <AuthResult<AuthUser>>{
    try{
        const {data: existing} = await supabase
        .from('users')
        .select('user_id')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle()

        if(existing){
            return{data: null, error: 'Ese nombre usuario ya esta en uso.'}
        }

        const{data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options:{
                data:{
                    full_name: full_name.trim(),
                    username: username.trim().toLowerCase(),
                },
            },
        })

        if(authError) throw authError

        if(!authData.user) throw new Error('No se pudo crear el usuario.')

        await new Promise(r => setTimeout(r, 800))

        const{data: profile, error: profileError} = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

        if(profileError) throw profileError

        return{data: profile as AuthUser, error: null}
    } catch(err){
        return{data: null, error: parseAuthError(err)}
    }
}