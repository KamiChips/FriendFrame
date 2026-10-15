import { supabase } from '@/lib/supabase/client';

async function validatePostOwnership(postId: string, userId: string) {
    const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .single();

    if (!post) throw new Error('Not found'); // No revelar que existe
}

async function validateProfileOwnership(postId: string, userId: string) {
    const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .single();

    if (!post) throw new Error('Not found'); // No revelar que existe
}

async function validateCommentOwnership(postId: string, userId: string) {
    const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .single();

    if (!post) throw new Error('Not found'); // No revelar que existe
}

async function validateMessageOwnership(postId: string, userId: string) {
    const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .single();

    if (!post) throw new Error('Not found'); // No revelar que existe
}

async function validateGroupOwnership(postId: string, userId: string) {
    const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('post_id', postId)
        .eq('author_id', userId) // ← Validar en query
        .single();

    if (!post) throw new Error('Not found'); // No revelar que existe
}
