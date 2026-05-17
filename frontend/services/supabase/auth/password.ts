import { supabase } from "@/lib/supabase/client"
import { AuthResult } from "./types"
import { parseAuthError } from "./auth.errors"

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