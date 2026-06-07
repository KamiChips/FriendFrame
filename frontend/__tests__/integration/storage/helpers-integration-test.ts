import {
    uploadToStorage,
    uriToArrayBuffer,
    getMimeType,
    extractPathFromUrl,
    toPickerMediaType,
    parseError,
    getFileSize,
} from "@/services/supabase/storage/storage.helpers";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { createBuckets } from "../helpers/storage-setup";
import { ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from "@/services/supabase/storage/types.storage";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("../helpers/supabase-test-client").supabaseAdmin,
}));

jest.mock("expo-file-system/legacy", () => ({
    getInfoAsync: jest.fn(),
}));

import * as FileSystem from "expo-file-system/legacy";
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;

const testUserId = "550e8400-e29b-41d4-a716-446655440097";

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

const realFetch = global.fetch;

beforeAll(async () => {
    await createBuckets();
});

afterAll(async () => {
    global.fetch = realFetch;
    await supabaseAdmin.storage
        .from("post-images")
        .remove([`${testUserId}/helpers-test.jpg`]);
});

beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = realFetch;
});

describe("uploadToStorage (integration)", () => {
    it("uploads file and returns public url", async () => {
        const filePath = `${testUserId}/helpers-test.jpg`;

        const url = await uploadToStorage(
            "post-images", filePath, cleanBuffer, "image/jpeg", true, "3600",
        );

        expect(url).toContain("post-images");
        expect(url).toContain(testUserId);

        const { data: files } = await supabaseAdmin.storage
            .from("post-images").list(testUserId);

        expect(files?.some(f => f.name === "helpers-test.jpg")).toBe(true);
    });

    it("overwrites existing file when upsert is true", async () => {
        const filePath = `${testUserId}/helpers-test.jpg`;
        await uploadToStorage("post-images", filePath, cleanBuffer, "image/jpeg", true, "3600");
        const url = await uploadToStorage("post-images", filePath, cleanBuffer, "image/jpeg", true, "3600");
        expect(url).toContain("post-images");
    });

    it("throws if bucket does not exist", async () => {
        await expect(
            uploadToStorage("nonexistent-bucket" as any, "test.jpg", cleanBuffer, "image/jpeg", false, "3600")
        ).rejects.toThrow();
    });
});

describe("uriToArrayBuffer (integration)", () => {
    it("fetches and returns ArrayBuffer from http url", async () => {
        const { data } = supabaseAdmin.storage
            .from("post-images")
            .getPublicUrl(`${testUserId}/helpers-test.jpg`);

        const buffer = await uriToArrayBuffer(data.publicUrl);
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it("throws if response is not ok", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false });
        await expect(
            uriToArrayBuffer("http://127.0.0.1:54321/nonexistent")
        ).rejects.toThrow("No se pudo leer el archivo.");
    });

    it("throws if url is not reachable", async () => {
        await expect(
            uriToArrayBuffer("http://127.0.0.1:54321/storage/v1/object/public/post-images/nonexistent/file.jpg")
        ).rejects.toThrow("No se pudo leer el archivo.");
    });
});

describe("getFileSize (integration)", () => {
    it("returns file size", async () => {
        mockGetInfoAsync.mockResolvedValueOnce({ exists: true, size: 1024 });
        const result = await getFileSize("file://photo.jpg");
        expect(result).toBe(1024);
    });

    it("returns 0 if size is undefined", async () => {
        mockGetInfoAsync.mockResolvedValueOnce({ exists: true });
        const result = await getFileSize("file://photo.jpg");
        expect(result).toBe(0);
    });

    it("throws if file does not exist", async () => {
        mockGetInfoAsync.mockResolvedValueOnce({ exists: false });
        await expect(getFileSize("file://nonexistent.jpg")).rejects.toThrow("El archivo no existe.");
    });
});

describe("getMimeType (integration)", () => {
    it("returns image/jpeg for .jpg", () => {
        expect(getMimeType("photo.jpg", "image")).toBe("image/jpeg");
    });

    it("returns image/png for .png", () => {
        expect(getMimeType("photo.png", "image")).toBe("image/png");
    });

    it("returns image/webp for .webp", () => {
        expect(getMimeType("photo.webp", "image")).toBe("image/webp");
    });

    it("returns image/gif for .gif", () => {
        expect(getMimeType("photo.gif", "image")).toBe("image/gif");
    });

    it("returns video/mp4 for .mp4", () => {
        expect(getMimeType("video.mp4", "video")).toBe("video/mp4");
    });

    it("returns video/quicktime for .mov", () => {
        expect(getMimeType("video.mov", "video")).toBe("video/quicktime");
    });

    it("throws for unsupported video type", () => {
        jest.spyOn(ALLOWED_VIDEO_TYPES, "has").mockReturnValueOnce(false);
        expect(() => getMimeType("video.mp4", "video")).toThrow("Tipo de video no permitido.");
        jest.restoreAllMocks();
    });

    it("throws for unsupported image type", () => {
        jest.spyOn(ALLOWED_IMAGE_TYPES, "has").mockReturnValueOnce(false);
        expect(() => getMimeType("photo.jpg", "image")).toThrow("Tipo de imagen no permitido.");
        jest.restoreAllMocks();
    });
});

describe("extractPathFromUrl (integration)", () => {
    it("extracts path from valid url", () => {
        const url = "https://cdn.example.com/storage/v1/object/public/post-images/uid/file.jpg";
        expect(extractPathFromUrl(url, "post-images")).toBe("uid/file.jpg");
    });

    it("strips query params from path", () => {
        const url = "https://cdn.example.com/storage/v1/object/public/post-images/uid/file.jpg?t=123";
        expect(extractPathFromUrl(url, "post-images")).toBe("uid/file.jpg");
    });

    it("returns null if marker not found", () => {
        expect(extractPathFromUrl("https://cdn.example.com/other/file.jpg", "post-images")).toBeNull();
    });

    it("returns null for malformed encoded url", () => {
        const malformed = "https://cdn.example.com/storage/v1/object/public/post-images/%invalid%path";
        expect(extractPathFromUrl(malformed, "post-images")).toBeNull();
    });
});

describe("toPickerMediaType (integration)", () => {
    it("returns images by default", () => {
        expect(toPickerMediaType(undefined)).toEqual(["images"]);
    });

    it("returns videos for 'videos'", () => {
        expect(toPickerMediaType("videos")).toEqual(["videos"]);
    });

    it("returns all types for 'all'", () => {
        expect(toPickerMediaType("all")).toEqual(["images", "videos", "livePhotos"]);
    });
});

describe("parseError (integration)", () => {
    it("returns unknown error for null", () => expect(parseError(null)).toBe("Error desconocido"));
    it("maps Payload too large", () => expect(parseError(new Error("Payload too large"))).toBe("El archivo es demasiado grande."));
    it("maps 413", () => expect(parseError(new Error("413"))).toBe("El archivo es demasiado grande."));
    it("maps mime", () => expect(parseError(new Error("bad mime"))).toBe("Tipo de archivo no permitido."));
    it("maps row-level security", () => expect(parseError(new Error("row-level security"))).toBe("No tienes permiso para subir archivos."));
    it("maps 403", () => expect(parseError(new Error("403"))).toBe("No tienes permiso para subir archivos."));
    it("maps Bucket not found", () => expect(parseError(new Error("Bucket not found"))).toBe("El bucket de almacenamiento no está configurado."));
    it("maps NetworkError", () => expect(parseError(new Error("NetworkError"))).toBe("Error de red. Verifica tu conexión."));
    it("maps Failed to fetch", () => expect(parseError(new Error("Failed to fetch"))).toBe("Error de red. Verifica tu conexión."));
    it("maps El archivo no existe", () => expect(parseError(new Error("El archivo no existe"))).toBe("El archivo no existe."));
    it("passes through demasiado grande", () => expect(parseError(new Error("demasiado grande"))).toBe("demasiado grande"));
    it("passes through no permitido", () => expect(parseError(new Error("no permitido"))).toBe("no permitido"));
    it("passes through no existe", () => expect(parseError(new Error("no existe"))).toBe("no existe"));
    it("passes through inválido", () => expect(parseError(new Error("inválido"))).toBe("inválido"));
    it("passes through Se necesita permiso", () => expect(parseError(new Error("Se necesita permiso"))).toBe("Se necesita permiso"));
    it("passes through No se pudo", () => expect(parseError(new Error("No se pudo"))).toBe("No se pudo"));
    it("returns generic for unknown", () => expect(parseError(new Error("algo raro"))).toBe("Ocurrió un error inesperado al procesar el archivo."));
});