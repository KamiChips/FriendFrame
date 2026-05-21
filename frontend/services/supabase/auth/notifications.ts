import { supabase } from '@/lib/supabase/client'
import { Platform } from 'react-native'
import * as Device from 'expo-device'


export async function registerDeviceToken(userId: string): Promise<void>{
    if(!Device.isDevice) return
    try{
        const Notifications = await import('expo-notifications')
        const{ status: existing} = await Notifications.getPermissionsAsync()
        let finalStatus = existing

        if(finalStatus !== 'granted')return

        const token = (await Notifications.getExpoPushTokenAsync()).data

        await supabase.from('device_tokens').upsert(
            {
                user_id: userId,
                token,
                platform: Platform.OS,
            },
            { onConflict: 'user_id, token'}
        )
    } catch{

    }
}

export async function _removeCurrentDeviceToken(userId: string): Promise<void>{
    try{
        const Notifications = await import('expo-notifications')
        const token = (await Notifications.getExpoPushTokenAsync()).data

        await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token)
    }catch{}
}