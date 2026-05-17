import { supabase } from "@/lib/supabase/client"
import { AuthUser } from "@supabase/supabase-js"
import { SignInParams, AuthResult } from "./types"
import { parseAuthError } from "./auth.errors"

export async function signIn({
    email,
    password
}: SignInParams) : Promise<AuthResult<AuthUser>>{
    try{
        const {data: authData, error: authError} =
        await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        })

        if(authError) throw authError
        if(!authData.user) throw new Error('No se pudo iniciar sesión.')

        const{data: profile, error: profileError} = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

        if(profileError) throw profileError

        return{data: profile as AuthUser, error: null}
    }catch(err){
        return{data:null, error: parseAuthError(err)}
    }
}

export async function signInWithGoogle(
    redirectTo:string
): Promise<AuthResult>{
    try{
        const{error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {redirectTo},
        })

        if(error) throw error

        return{data: null, error: null}
    }catch(err){
        return{data: null, error: parseAuthError(err)}
    }
}

export async function signOut(): Promise<AuthResult>{
    try{
        const{ data: {user}} = await supabase.auth.getUser()

        if(user){
            await _removeCurrentDeviceToken(user.id)
        }

        const{error} = await supabase.auth.signOut()
        if(error) throw error

        return{data:null, error: null}
    } catch(err){
        return{data:null, error: parseAuthError(err)}
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
export async function getCurrentUser(): Promise<AuthResult<AuthUser>>{
    try{
        const{data:{user}, error: authError} = await supabase.auth.getUser()

        if(authError) throw authError
        if(!user) return {data:null, error: null}

        const{data: profile, error: profileError} = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single()

        if(profileError) throw profileError

        return{data: profile as AuthUser, error: null}
    } catch(err){
        const msg = (err as Error).message ?? ''
        if(msg.includes('Auth session missing')){
            return{data: null, error:null}
        }
        return{data:null, error:parseAuthError(err)}
    }
}

export async function changePassword(
    newPassword: string
): Promise<AuthResult>{
    try{
        const{ error } = await supabase.auth.updateUser({password: newPassword})
        if(error) throw error
        return{data: null, error: null}
    } catch(err){
        return{ data: null, error: parseAuthError(err)}
    }
}

function _removeCurrentDeviceToken(id: string) {
    throw new Error("Function not implemented.")
}
