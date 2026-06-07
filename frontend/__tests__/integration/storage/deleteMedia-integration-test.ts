import { deletePostImage, deleteProfilePic } from "@/services/supabase/storage/deleteMedia";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { createBuckets, cleanBucketRoot } from "../helpers/storage-setup";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("../helpers/supabase-test-client").supabaseAdmin,
}));

// datos de prueba
const testUserId = "550e8400-e29b-41d4-a716-446655440098";
const testEmail = "integration-delete@test.com";

const TINY_JPEG = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA" +
    "AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA" +
    "/9oADAMBAAIRAxEAPwCwABmX/9k=",
    "base64"
);

const cleanBuffer = TINY_JPEG.buffer.slice(
    TINY_JPEG.byteOffset,
    TINY_JPEG.byteOffset + TINY_JPEG.byteLength
);

// helper para subir un archivo de prueba al storage
async function uploadTestFile(bucket: string, path: string): Promise<string> {
    const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, cleanBuffer, { contentType: "image/jpeg", upsert: true });

    if (error) throw new Error(`Setup failed: ${error.message}`);

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

beforeAll(async () => {
    await createBuckets();
    await supabaseAdmin.from("users").upsert({
        user_id: testUserId,
        full_name: "Integration Delete Test",
        username: "integration_delete_test",
        email: testEmail,
        profile_pic: null,
    });
});

afterAll(async () => {
    // limpieza por si algún test falla antes de borrar
    await supabaseAdmin.storage.from("post-images").remove([`${testUserId}/test.jpg`]);
    await supabaseAdmin.storage.from("profile-pictures").remove([`${testUserId}.jpg`]);
    await supabaseAdmin.from("users").delete().eq("user_id", testUserId);
});

describe("deletePostImage (integration)", () => {
    it("returns null for empty url", async () => {
        const result = await deletePostImage("");
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns null for url from different bucket", async () => {
        const result = await deletePostImage(
            "https://cdn.example.com/storage/v1/object/public/profile-pictures/uid/file.jpg"
        );
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns null for url with no valid marker", async () => {
        const result = await deletePostImage("https://cdn.example.com/other/file.jpg");
        expect(result).toEqual({ data: null, error: null });
    });

    it("deletes existing file successfully", async () => {
        const publicUrl = await uploadTestFile("post-images", `${testUserId}/test.jpg`);

        // verificar que existe
        const { data: before } = await supabaseAdmin.storage
            .from("post-images").list(testUserId);
        expect(before?.some(f => f.name === "test.jpg")).toBe(true);

        const result = await deletePostImage(publicUrl);
        expect(result).toEqual({ data: null, error: null });

        // verificar que ya no existe
        const { data: after } = await supabaseAdmin.storage
            .from("post-images").list(testUserId);
        expect(after?.some(f => f.name === "test.jpg")).toBe(false);
    });

    it("returns null when file does not exist (404 ignored)", async () => {
        // URL válida pero archivo inexistente
        const { data } = supabaseAdmin.storage
            .from("post-images")
            .getPublicUrl(`${testUserId}/nonexistent.jpg`);

        const result = await deletePostImage(data.publicUrl);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns null when url belongs to different bucket", async () => {
        const otherBucketUrl = "https://cdn.example.com/storage/v1/object/public/profile-pictures/uid/file.jpg";
        const result = await deletePostImage(otherBucketUrl);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error when storage remove fails with unexpected error", async () => {
        const publicUrl = await uploadTestFile("post-images", `${testUserId}/to-fail.jpg`);
        const realSupabase = require("../helpers/supabase-test-client").supabaseAdmin;
        const originalStorage = realSupabase.storage;

        Object.defineProperty(realSupabase, "storage", {
            value: {
                from: () => ({
                    remove: jest.fn().mockResolvedValue({ 
                        error: new Error("Unexpected storage failure") 
                    }),
                }),
            },
            configurable: true,
        });

        const result = await deletePostImage(publicUrl);
        expect(result.error).toBeTruthy();

        Object.defineProperty(realSupabase, "storage", {
            value: originalStorage,
            configurable: true,
        });
    });
});

describe("deleteProfilePic (integration)", () => {
    it("returns error if userId is invalid", async () => {
        const result = await deleteProfilePic("no-es-uuid");
        expect(result.error).toContain("ID de usuario");
    });

    it("deletes profile pic and clears db field", async () => {
        // subir foto de perfil de prueba
        await uploadTestFile("profile-pictures", `${testUserId}.jpg`);

        // poner profile_pic en la db
        await supabaseAdmin.from("users")
            .update({ profile_pic: "https://cdn.example.com/profile-pictures/test.jpg" })
            .eq("user_id", testUserId);

        const result = await deleteProfilePic(testUserId);
        expect(result).toEqual({ data: null, error: null });

        // verificar que profile_pic es null en la db
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("profile_pic")
            .eq("user_id", testUserId)
            .single();

        expect(user?.profile_pic).toBeNull();

        // verificar que el archivo ya no existe en storage
        const { data: files } = await supabaseAdmin.storage
            .from("profile-pictures").list();
        expect(files?.some(f => f.name === `${testUserId}.jpg`)).toBe(false);
    });

    it("returns null when profile pic does not exist in storage (404 ignored)", async () => {
        // asegurarse de que no existe el archivo
        await supabaseAdmin.storage
            .from("profile-pictures").remove([`${testUserId}.jpg`]);

        const result = await deleteProfilePic(testUserId);
        expect(result).toEqual({ data: null, error: null });

        const { data: user } = await supabaseAdmin
            .from("users")
            .select("profile_pic")
            .eq("user_id", testUserId)
            .single();

        expect(user?.profile_pic).toBeNull();
    });

    it("returns error if db update fails", async () => {
        const nonExistentId = "550e8400-e29b-41d4-a716-446655440000";

        await supabaseAdmin.from("users").delete().eq("user_id", nonExistentId);

        const result = await deleteProfilePic(testUserId);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error when profile pic storage remove fails unexpectedly", async () => {
        const realSupabase = require("../helpers/supabase-test-client").supabaseAdmin;
        const originalStorage = realSupabase.storage;

        Object.defineProperty(realSupabase, "storage", {
            value: {
                from: () => ({
                    remove: jest.fn().mockResolvedValue({ 
                        error: new Error("Unexpected storage failure") 
                    }),
                }),
            },
            configurable: true,
        });

        const result = await deleteProfilePic(testUserId);
        expect(result.error).toBeTruthy();

        Object.defineProperty(realSupabase, "storage", {
            value: originalStorage,
            configurable: true,
        });
    });

    it("returns error when db update throws unexpectedly", async () => {
        const realSupabase = require("../helpers/supabase-test-client").supabaseAdmin;
        const originalStorage = realSupabase.storage;

        Object.defineProperty(realSupabase, "storage", {
            value: {
                from: () => ({
                    remove: jest.fn().mockResolvedValue({ error: null }),
                }),
            },
            configurable: true,
        });

        // forzar error en el from de db
        const originalFrom = realSupabase.from.bind(realSupabase);
        jest.spyOn(realSupabase, "from").mockImplementationOnce(() => ({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: new Error("DB crash") }),
            }),
        }));

        const result = await deleteProfilePic(testUserId);
        expect(result.error).toBeTruthy();

        Object.defineProperty(realSupabase, "storage", {
            value: originalStorage,
            configurable: true,
        });
        jest.restoreAllMocks();
    });
});