import { supabaseAdmin } from "./supabase-test-client";

export async function createBuckets() {
    for (const bucket of ["profile-pictures", "post-images"]) {
        const { data: existing } = await supabaseAdmin.storage.getBucket(bucket);
        if (!existing) {
            await supabaseAdmin.storage.createBucket(bucket, { public: true });
        }
    }
}

export async function cleanBucket(bucket: string, prefix: string) {
    const { data: files } = await supabaseAdmin.storage.from(bucket).list(prefix);
    if (files?.length) {
        const paths = files.map(f => `${prefix}/${f.name}`);
        await supabaseAdmin.storage.from(bucket).remove(paths);
    }
}

export async function cleanBucketRoot(bucket: string, fileName: string) {
    await supabaseAdmin.storage.from(bucket).remove([fileName]);
}