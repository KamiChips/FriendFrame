import { supabase } from '@/lib/supabase/client';

export async function validatePostOwnership(postId: string, userId: string) {
    const { data: post, error } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!post) throw new Error('Post Not found'); // No revelar que existe
}

export function validateProfileOwnership(userId: string, currentUserId: string) {
    if (userId !== currentUserId) throw new Error('Profile Not found'); // No revelar que existe
}

export async function validateCommentOwnership(commentId: string, userId: string) {
    const { data: comment, error } = await supabase
        .from('comments')
        .select('user_id')
        .eq('comment_id', commentId)
        .eq('user_id', userId) // ← Validar en query
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!comment) throw new Error('Comment Not found'); // No revelar que existe
}

export async function validateMessageOwnership(messageId: string, userId: string) {
    const { data: message, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('message_id', messageId)
        .eq('sender_id', userId) // ← Validar en query
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!message) throw new Error('Message Not found'); // No revelar que existe
}

export async function validateGroupOwnership(chatId: string, userId: string) {
    const { data: chat, error } = await supabase
        .from('chat')
        .select('created_by')
        .eq('chat_id', chatId)
        .eq('created_by', userId) // ← Validar en query
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!chat) throw new Error('Group chat Not found'); // No revelar que existe
}
