import { useState } from 'react';
import { createFragment } from "@/services/supabase/posts/fragment";
import { Fragment } from "@/services/supabase/posts/types";

interface UseCreateFragmentReturn {
    createFragment: (profileOwnerId: string, content: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
    data: Fragment | null;
    reset: () => void;
}

export const useCreateFragment = (): UseCreateFragmentReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [data, setData] = useState<Fragment | null>(null);

    // Función para crear un Fragment
    const handleCreateFragment = async (profileOwnerId: string, content: string) => {
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);
        
        // Llamada a la función de servicio para crear el Fragment
        const result = await createFragment(profileOwnerId, content);

        // Manejo de resultado
        if (result.error) {
            // Si hay un error, actualizamos el estado de error
            setError(result.error);
        } else {
            // Si la creación fue exitosa, actualizamos el estado con el nuevo Fragment
            setIsSuccess(true);
            setData(result.data);
        }

        setIsLoading(false);
    };

    // Función para resetear el estado del hook
    const reset = () => {
        setError(null);
        setIsSuccess(false);
        setData(null);
    };

    return {
        createFragment: handleCreateFragment, // Función para crear un fragmento
        isLoading,
        error,
        isSuccess,
        data,
        reset
    };
}