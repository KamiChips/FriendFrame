import { supabase } from "@/lib/supabase/client"
import { AuthResult } from "./types"
import { parseAuthError } from "./auth.errors"
import * as ImagePicker from 'expo-image-picker'


export async function updateProfilePic(
    userId: string
): Promise<AuthResult<string>>{
    try{
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted'){
            return{
                data:null,
                error: 'Se necesita permiso para acceder a galería',
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if(result.canceled) return {data: null, error: null}

        const image = result.assets[0]

        const response = await fetch(image.uri)
        const blob = await response.blob()

        const filePath = `${userId}.jpg`

        const{ error: uploadError} = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
        })

        if(uploadError) throw uploadError

        const{ data: urlData} = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

        const{ error: updateError} = await supabase
        .from('users')
        .update({profile_pic: publicUrl})
        .eq('user_id', userId)

        if(updateError) throw updateError

        return{data:publicUrl, error: null}
    }catch(err){
        return{ data: null, error: parseAuthError(err)}
    }
}