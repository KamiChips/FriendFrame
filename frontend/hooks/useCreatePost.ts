import { useState, useCallback } from "react";
import type { ImagePickerAsset } from "expo-image-picker";

import { pickMedia, pickFromCamera } from "@/services/supabase/storage/media";
import { uploadPostImage } from "@/services/supabase/storage/uploadMedia";
import { createPost } from "@/services/supabase/posts/posts";
import type { Post } from "@/services/supabase/posts/types";

export type MediaSource = "gallery" | "camera";

export interface CreatePostState {
  selectedAsset: ImagePickerAsset | null;
  createdPost: Post | null;
  isLoading: boolean;
  isPicking: boolean;
  isUploading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export interface CreatePostActions {
  setAsset: (asset: any) => void;
  pickAsset: (source?: MediaSource) => Promise<void>;
  clearAsset: () => void;
  submit: (
    profileOwnerId: string,
    description?: string,
  ) => Promise<Post | null>;
  reset: () => void;
}

export type UseCreatePostReturn = CreatePostState & CreatePostActions;

const INITIAL_STATE: CreatePostState = {
  selectedAsset: null,
  createdPost: null,
  isLoading: false,
  isPicking: false,
  isUploading: false,
  isSubmitting: false,
  error: null,
};

export function useCreatePost(authorId: string): UseCreatePostReturn {
  const [state, setState] = useState<CreatePostState>(INITIAL_STATE);

  console.log("[UseCreatPost] authorId recibido:", authorId);

  const patch = useCallback(
    (partial: Partial<CreatePostState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    [],
  );

  const pickAsset = useCallback(
    async (source: MediaSource = "gallery") => {
      patch({ isPicking: true, isLoading: true, error: null });

      try {
        const result =
          source === "camera"
            ? await pickFromCamera({ mediaTypes: "all", quality: 0.85 })
            : await pickMedia({ mediaTypes: "all", quality: 0.85 });

        if (result.error) {
          patch({ error: result.error, isPicking: false, isLoading: false });
          return;
        }

        // result.data === null → usuario canceló, sin error
        patch({
          selectedAsset: result.data,
          isPicking: false,
          isLoading: false,
        });
      } catch (err) {
        patch({
          error:
            err instanceof Error ? err.message : "Error al seleccionar media.",
          isPicking: false,
          isLoading: false,
        });
      }
    },
    [patch],
  );
  const setAsset = useCallback(
    (asset: any) => {
      patch({ selectedAsset: asset, error: null });
    },
    [patch],
  );

  const clearAsset = useCallback(() => {
    patch({ selectedAsset: null, error: null });
  }, [patch]);

  const submit = useCallback(
    async (
      profileOwnerId: string,
      description?: string,
    ): Promise<Post | null> => {
      if (!state.selectedAsset) {
        patch({ error: "Selecciona una imagen o video antes de publicar." });
        return null;
      }

      patch({ isLoading: true, isUploading: true, error: null });

      try {
        // Paso 1 — Upload al storage
        const uploadResult = await uploadPostImage(
          authorId,
          state.selectedAsset,
        );

        if (uploadResult.error || !uploadResult.data) {
          patch({
            error: uploadResult.error ?? "Error al subir el archivo.",
            isLoading: false,
            isUploading: false,
          });
          return null;
        }

        patch({ isUploading: false, isSubmitting: true });

        // Paso 2 — Inserción en BD + notificación
        // Extraemos la URL y el tipo de archivo desde el resultado de subida
        const publicUrl = uploadResult.data.publicUrl;
        const mediaType = uploadResult.data.mediaType; 
        
        // Llamamos a la función con el orden correcto y los 4 parámetros
        const postResult = await createPost(
          profileOwnerId,
          publicUrl,
          mediaType,
          description
        );

        if (postResult.error || !postResult.data) {
          patch({
            error: postResult.error ?? "Error al crear el post.",
            isLoading: false,
            isSubmitting: false,
          });
          return null;
        }

        patch({
          createdPost: postResult.data,
          selectedAsset: null,
          isLoading: false,
          isSubmitting: false,
        });

        return postResult.data;
      } catch (err) {
        patch({
          error: err instanceof Error ? err.message : "Error inesperado.",
          isLoading: false,
          isUploading: false,
          isSubmitting: false,
        });
        return null;
      }
    },
    [authorId, state.selectedAsset, patch],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    ...state,
    pickAsset,
    clearAsset,
    submit,
    reset,
    setAsset,
  };
}