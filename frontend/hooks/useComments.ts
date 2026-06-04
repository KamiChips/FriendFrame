import { useState, useCallback } from "react";
import { getComments, addComment } from "@/services/supabase/interactions/comments";
import { CommentWithReplies, PublicationTarget } from "@/services/supabase/interactions/types";
import { getAuthUser } from "@/services/supabase/helpers/validation";

interface UseCommentsState {
    comments: CommentWithReplies[];
    isLoading: boolean;
    isPosting: boolean;
    error: string | null;
}

export function useComments(target: PublicationTarget) {
    const [state, setState] = useState<UseCommentsState>({
        comments: [],
        isLoading: false,
        isPosting: false,
        error: null,
    });

    const patch = useCallback(
        (partial: Partial<UseCommentsState>) =>
            setState((prev) => ({ ...prev, ...partial })),
        []
    );

    const load = useCallback(async () => {
        patch({ isLoading: true, error: null });
        try {
            const currentUserId = await getAuthUser();
            const result = await getComments(target, currentUserId, { include_replies: true });
            if (result.error) throw new Error(result.error);
            patch({ comments: result.data ?? [], isLoading: false });
        } catch (e) {
            patch({
                error: e instanceof Error ? e.message : "Error al cargar comentarios.",
                isLoading: false,
            });
        }
    }, [target]);

    const post = useCallback(
        async (content: string, parentCommentId?: string) => {
            patch({ isPosting: true, error: null });
            try {
                const result = await addComment(target, content, parentCommentId);
                if (result.error || !result.data) throw new Error(result.error ?? "Error.");

                // insertar al inicio si es un comentario raiz, al finla si es respuesta
                setState((prev) => ({
                    ...prev,
                    isPosting: false,
                    comments: parentCommentId
                        ? prev.comments
                        : [result.data!, ...prev.comments],
                }));

                return result.data;
            } catch (e) {
                patch({
                    error: e instanceof Error ? e.message : "Error al comentar.",
                    isPosting: false,
                });
                return null;
            }
        },
        [target]
    );

    return { ...state, load, post }
}