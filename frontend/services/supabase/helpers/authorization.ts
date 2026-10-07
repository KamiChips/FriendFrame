import { supabase } from '@/lib/supabase/client';

export async function validatePostOwnership(postId: string, userId: string) {
    const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .single();

    if (!post) throw new Error('Post Not found'); // No revelar que existe
}

// no hay perfil?
export async function validateProfileOwnership(userId: string, currentUserId: string) {
    const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .eq('user_id', currentUserId) // ← Validar en query
        .single();

    if (!profile) throw new Error('Profile Not found'); // No revelar que existe
}

export async function validateCommentOwnership(commentId: string, userId: string) {
    const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('comment_id', commentId)
        .eq('user_id', userId) // ← Validar en query
        .single();

    if (!comment) throw new Error('Comment Not found'); // No revelar que existe
}

export async function validateMessageOwnership(messageId: string, userId: string) {
    const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('message_id', messageId)
        .eq('sender_id', userId) // ← Validar en query
        .single();

    if (!message) throw new Error('Message Not found'); // No revelar que existe
}

export async function validateGroupOwnership(chatId: string, userId: string) {
    const { data: chat } = await supabase
        .from('chat')
        .select('created_by')
        .eq('chat_id', chatId)
        .eq('created_by', userId) // ← Validar en query
        .single();

    if (!chat) throw new Error('Group chat Not found'); // No revelar que existe
}
