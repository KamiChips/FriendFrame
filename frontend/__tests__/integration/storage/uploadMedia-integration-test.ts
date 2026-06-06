import { uploadPostImage, uploadMultiple, uploadProfilePic, getPublicUrl } from "@/services/supabase/storage/uploadMedia";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { createBuckets, cleanBucket, cleanBucketRoot } from "../helpers/storage-setup";
import * as ImagePicker from "expo-image-picker";
import * as StorageHelpers from "@/services/supabase/storage/storage.helpers";
import * as FileSystem from "expo-file-system/legacy";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("../helpers/supabase-test-client").supabaseAdmin,
}));

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
    getInfoAsync: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => ({
    manipulateAsync: jest.fn(),
    SaveFormat: { JPEG: "jpeg" },
}));

import { manipulateAsync } from "expo-image-manipulator";

const mockRequestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockManipulateAsync = manipulateAsync as jest.Mock;

const testUserId = "550e8400-e29b-41d4-a716-446655440099";
const testEmail = "integration-storage@test.com";

const TINY_JPEG_BUFFER = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA" +
    "AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA" +
    "/9oADAMBAAIRAxEAPwCwABmX/9k=",
    "base64"
);

const cleanArrayBuffer = TINY_JPEG_BUFFER.buffer.slice(
    TINY_JPEG_BUFFER.byteOffset,
    TINY_JPEG_BUFFER.byteOffset + TINY_JPEG_BUFFER.byteLength
);

const mockAsset: ImagePicker.ImagePickerAsset = {
    uri: "file://test-photo.jpg",
    width: 1, height: 1,
    type: "image",
    fileName: "test-photo.jpg",
    fileSize: TINY_JPEG_BUFFER.length,
    assetId: null, base64: null, duration: null, exif: null,
    mimeType: "image/jpeg",
    pairedVideoAsset: null,
};

const realFetch = global.fetch;

beforeAll(async () => {
    await createBuckets();
    await supabaseAdmin.from("users").upsert({
        user_id: testUserId,
        full_name: "Integration Test",
        username: "integration_storage_test",
        email: testEmail,
        profile_pic: null,
    });
});

afterAll(async () => {
    global.fetch = realFetch;
    await cleanBucketRoot("profile-pictures", `${testUserId}.jpg`);
    await cleanBucket("post-images", testUserId);
    await supabaseAdmin.from("users").delete().eq("user_id", testUserId);
});

beforeEach(() => {
    jest.clearAllMocks();

    mockGetInfoAsync.mockResolvedValue({ exists: true, size: TINY_JPEG_BUFFER.length });
    mockManipulateAsync.mockResolvedValue({ uri: "file://test-photo.jpg" });

    // fetch selectivo: intercepta solo URIs locales, deja pasar llamadas HTTP de Supabase
    global.fetch = jest.fn().mockImplementation((url: string, ...args: any[]) => {
        if (typeof url === "string" && (url.startsWith("file://") || url.startsWith("blob:"))) {
            return Promise.resolve({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(cleanArrayBuffer),
            });
        }
        return realFetch(url, ...args);
    });
});

describe("uploadProfilePic (integration)", () => {
    it("returns error if userId is invalid", async () => {
        const result = await uploadProfilePic("no-es-uuid");
        expect(result.error).toContain("ID de usuario");
    });

    it("returns error if gallery permission denied", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "denied" });
        const result = await uploadProfilePic(testUserId);
        expect(result.error).toBe("Se necesita permiso para acceder a la galería.");
    });

    it("returns null if user cancels", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });
        const result = await uploadProfilePic(testUserId);
        expect(result).toEqual({ data: null, error: null });
    });

    it("uploads profile pic to supabase and updates db", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        const result = await uploadProfilePic(testUserId);

        expect(result.error).toBeNull();
        expect(result.data?.mediaType).toBe("image");
        expect(result.data?.filePath).toBe(`${testUserId}.jpg`);
        expect(result.data?.publicUrl).toContain("profile-pictures");

        const { data: user } = await supabaseAdmin
            .from("users")
            .select("profile_pic")
            .eq("user_id", testUserId)
            .single();

        expect(user?.profile_pic).toContain("profile-pictures");
    });

    it("returns error if file is too large", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [mockAsset] });
        mockGetInfoAsync.mockResolvedValue({ exists: true, size: 999 * 1024 * 1024 });

        const result = await uploadProfilePic(testUserId);
        expect(result.error).toContain("demasiado grande");
    });
});

describe("uploadPostImage (integration)", () => {
    it("returns error if authorId is invalid", async () => {
        const result = await uploadPostImage("no-es-uuid", mockAsset);
        expect(result.error).toContain("ID de autor");
    });

    it("uploads image to supabase successfully", async () => {
        const result = await uploadPostImage(testUserId, mockAsset);

        expect(result.error).toBeNull();
        expect(result.data?.mediaType).toBe("image");
        expect(result.data?.publicUrl).toContain("post-images");
        expect(result.data?.filePath).toContain(testUserId);

        const fileName = result.data!.filePath.split("/")[1];
        const { data: files } = await supabaseAdmin
            .storage.from("post-images")
            .list(testUserId);

        expect(files?.some(f => f.name === fileName)).toBe(true);
    });

    it("returns error if file is too large", async () => {
        mockGetInfoAsync.mockResolvedValue({ exists: true, size: 999 * 1024 * 1024 });
        const result = await uploadPostImage(testUserId, mockAsset);
        expect(result.error).toContain("demasiado grande");
    });

    it("returns error if resized image is too large", async () => {
        mockGetInfoAsync
            .mockResolvedValueOnce({ exists: true, size: 100 })
            .mockResolvedValueOnce({ exists: true, size: 999 * 1024 * 1024 });

        const result = await uploadPostImage(testUserId, mockAsset);
        expect(result.error).toBe("La imagen procesada es demasiado grande.");
    });

    it("returns error for invalid mime type", async () => {
        const badAsset = { ...mockAsset, uri: "file://photo.bmp" };
        jest.spyOn(StorageHelpers, "getMimeType").mockImplementationOnce(() => {
            throw new Error("Tipo de imagen no permitido.");
        });

        const result = await uploadPostImage(testUserId, badAsset);
        expect(result.error).toBe("Tipo de imagen no permitido.");
    });
});

describe("uploadMultiple (integration)", () => {
    it("returns error if authorId is invalid", async () => {
        const result = await uploadMultiple("no-es-uuid", [mockAsset]);
        expect(result.error).toContain("ID de autor");
    });

    it("returns empty for empty assets array", async () => {
        const result = await uploadMultiple(testUserId, []);
        expect(result).toEqual({ data: { successful: [], failed: [] }, error: null });
    });

    it("returns error if assets exceed max batch", async () => {
        const result = await uploadMultiple(testUserId, Array(11).fill(mockAsset));
        expect(result.error).toContain("Máximo");
    });

    it("uploads multiple assets and reports results", async () => {
        const result = await uploadMultiple(testUserId, [mockAsset, mockAsset]);

        expect(result.error).toBeNull();
        expect(result.data?.successful.length).toBeGreaterThanOrEqual(1);
    });

    it("tracks partial failures correctly", async () => {
        mockGetInfoAsync
            .mockResolvedValueOnce({ exists: true, size: 100 })
            .mockResolvedValueOnce({ exists: true, size: 999 * 1024 * 1024 });

        const result = await uploadMultiple(testUserId, [mockAsset, mockAsset]);

        expect(result.data?.successful).toHaveLength(1);
        expect(result.data?.failed).toHaveLength(1);
        expect(result.data?.failed[0]).toContain("Archivo 2");
    });
});

describe("getPublicUrl (integration)", () => {
    it("returns a valid public url for existing path", () => {
        const url = getPublicUrl("post-images", `${testUserId}/test.jpg`);
        expect(url).toContain("post-images");
        expect(url).toContain(testUserId);
    });
});