import * as ImagePicker from 'expo-image-picker'
import { ImagePickerOptions, StorageResul } from "./types.storage";
import { clampQuality, parseError, toPickerMediaType } from './storage.helpers';


export async function pickMedia(
    options: ImagePickerOptions = {}
): Promise<StorageResul<ImagePicker.ImagePickerAsset>>{
    try{
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted')
            return { data: null, error: 'Se necesita permiso para acceder a la galería.'}

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: toPickerMediaType(options.mediaTypes),
            allowsEditing: options.allowEditing ?? false,
            aspect: options.aspect,
            quality: clampQuality(options.quality),
        })

        if(result.canceled) return {data: null, error: null}
        if(!result.assets?.length) return { data: null, error: 'No se selecciono ningun archivo.'}

        return{data: result.assets[0], error: null}
    }catch(err){
        return { data: null, error: parseError(err)}
    }
}

export async function pickFromCamera(
    options: Pick<ImagePickerOptions, 'mediaTypes' | 'quality'> = {}
): Promise<StorageResul<ImagePicker.ImagePickerAsset>>{
    try{

        const { status } = await ImagePicker.requestCameraPermissionsAsync()

        if(status !== 'granted')
            return { data: null, error: 'Se necesita permiso para acceder a la cámara.'}

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: toPickerMediaType(options.mediaTypes),
            quality: clampQuality(options.quality),
        })

        if(result.canceled) return{data: null, error: null}

        if(!result.assets?.length) return{ data: null, error: 'No se capturó ningún archivo.'}

        return { data: result.assets[0], error: null}
    }catch(err){
        return{ data: null, error: parseError(err)}
    }
}