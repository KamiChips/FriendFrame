import {
    clampQuality, clampSize, parseError, uriToArrayBuffer,
    getFileSize, getMimeType, extractPathFromUrl, resizeImage, uploadToStorage,
    toPickerMediaType,
} from "@/services/supabase/storage/storage.helpers";
import { mockStorageFrom } from "@/__mocks__/supabaseMock";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("expo-file-system/legacy", () => ({
    getInfoAsync: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => ({
    manipulateAsync: jest.fn(),
    SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("expo-image-picker", () => ({}));

import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync } from "expo-image-manipulator";

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockManipulateAsync = manipulateAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// clampQuality
describe("clampQuality", () => {
    it("returns default 0.85 when no arg", () => expect(clampQuality()).toBe(0.85));
    it("clamps below 0.1 to 0.1", () => expect(clampQuality(0)).toBe(0.1));
    it("clamps above 1 to 1", () => expect(clampQuality(2)).toBe(1));
    it("returns value within range", () => expect(clampQuality(0.5)).toBe(0.5));
});

// clampSize
describe("clampSize", () => {
    it("returns default 400 when no arg", () => expect(clampSize()).toBe(400));
    it("clamps below 100 to 100", () => expect(clampSize(50)).toBe(100));
    it("clamps above 2000 to 2000", () => expect(clampSize(9999)).toBe(2000));
    it("returns value within range", () => expect(clampSize(500)).toBe(500));
});

// parseError
describe("parseError", () => {
    it("returns unknown error for null", () => expect(parseError(null)).toBe("Error desconocido"));
    it("maps Payload too large", () => expect(parseError(new Error("Payload too large"))).toBe("El archivo es demasiado grande."));
    it("maps 413", () => expect(parseError(new Error("413"))).toBe("El archivo es demasiado grande."));
    it("maps Invalid mime type", () => expect(parseError(new Error("Invalid mime type"))).toBe("Tipo de archivo no permitido."));
    it("maps mime", () => expect(parseError(new Error("bad mime here"))).toBe("Tipo de archivo no permitido."));
    it("maps row-level security", () => expect(parseError(new Error("row-level security"))).toBe("No tienes permiso para subir archivos."));
    it("maps 403", () => expect(parseError(new Error("403"))).toBe("No tienes permiso para subir archivos."));
    it("maps Bucket not found", () => expect(parseError(new Error("Bucket not found"))).toBe("El bucket de almacenamiento no está configurado."));
    it("maps NetworkError", () => expect(parseError(new Error("NetworkError"))).toBe("Error de red. Verifica tu conexión."));
    it("maps network", () => expect(parseError(new Error("network issue"))).toBe("Error de red. Verifica tu conexión."));
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

// uriToArrayBuffer
describe("uriToArrayBuffer", () => {
    it("returns ArrayBuffer on success", async () => {
        const mockBuffer = new ArrayBuffer(8);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: jest.fn().mockResolvedValue(mockBuffer),
        });

        const result = await uriToArrayBuffer("file://photo.jpg");
        expect(result).toBe(mockBuffer);
    });

    it("throws if response is not ok", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false });
        await expect(uriToArrayBuffer("file://photo.jpg")).rejects.toThrow("No se pudo leer el archivo.");
    });
});

// getFileSize
describe("getFileSize", () => {
    it("returns file size on success", async () => {
        mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
        const result = await getFileSize("file://photo.jpg");
        expect(result).toBe(1024);
    });

    it("returns 0 if size is undefined", async () => {
        mockGetInfoAsync.mockResolvedValue({ exists: true });
        const result = await getFileSize("file://photo.jpg");
        expect(result).toBe(0);
    });

    it("throws if file does not exist", async () => {
        mockGetInfoAsync.mockResolvedValue({ exists: false });
        await expect(getFileSize("file://photo.jpg")).rejects.toThrow("El archivo no existe.");
    });
});

// getMimeType
describe("getMimeType", () => {
    it("returns image/jpeg for unknown image extension", () => expect(getMimeType("photo.jpg", "image")).toBe("image/jpeg"));
    it("returns image/png for .png", () => expect(getMimeType("photo.png", "image")).toBe("image/png"));
    it("returns image/webp for .webp", () => expect(getMimeType("photo.webp", "image")).toBe("image/webp"));
    it("returns image/gif for .gif", () => expect(getMimeType("photo.gif", "image")).toBe("image/gif"));
    it("returns video/mp4 for .mp4", () => expect(getMimeType("video.mp4", "video")).toBe("video/mp4"));
    it("returns video/quicktime for .mov", () => expect(getMimeType("video.mov", "video")).toBe("video/quicktime"));
});

// extractPathFromUrl
describe("extractPathFromUrl", () => {
    it("extracts path from valid url", () => {
        const url = "https://cdn.example.com/storage/v1/object/public/post-images/uid-1/file.jpg";
        expect(extractPathFromUrl(url, "post-images")).toBe("uid-1/file.jpg");
    });

    it("returns null if marker not found", () => {
        expect(extractPathFromUrl("https://cdn.example.com/other/file.jpg", "post-images")).toBeNull();
    });

    it("strips query params from path", () => {
        const url = "https://cdn.example.com/storage/v1/object/public/post-images/uid-1/file.jpg?t=123";
        expect(extractPathFromUrl(url, "post-images")).toBe("uid-1/file.jpg");
    });
});

// resizeImage
describe("resizeImage", () => {
    it("returns resized uri", async () => {
        mockManipulateAsync.mockResolvedValue({ uri: "file://resized.jpg" });
        const result = await resizeImage("file://photo.jpg", 800, 0.8);
        expect(result).toBe("file://resized.jpg");
    });

    it("clamps maxWidth to 4096", async () => {
        mockManipulateAsync.mockResolvedValue({ uri: "file://resized.jpg" });
        await resizeImage("file://photo.jpg", 9999, 0.8);
        expect(mockManipulateAsync).toHaveBeenCalledWith(
            expect.anything(),
            [{ resize: { width: 4096 } }],
            expect.anything(),
        );
    });

    it("clamps maxWidth to 100 minimum", async () => {
        mockManipulateAsync.mockResolvedValue({ uri: "file://resized.jpg" });
        await resizeImage("file://photo.jpg", 10, 0.8);
        expect(mockManipulateAsync).toHaveBeenCalledWith(
            expect.anything(),
            [{ resize: { width: 100 } }],
            expect.anything(),
        );
    });
});

// uploadToStorage
describe("uploadToStorage", () => {
    it("uploads and returns public url", async () => {
        mockStorageFrom.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/file.jpg" } }),
        });

        const result = await uploadToStorage("post-images", "uid-1/file.jpg", new ArrayBuffer(8), "image/jpeg", true, "3600");
        expect(result).toBe("https://cdn.example.com/file.jpg");
    });

    it("throws if upload fails", async () => {
        mockStorageFrom.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: new Error("Upload failed") }),
        });

        await expect(
            uploadToStorage("post-images", "uid-1/file.jpg", new ArrayBuffer(8), "image/jpeg", true, "3600")
        ).rejects.toThrow("Upload failed");
    });
});

// toPickerMediaType
describe("toPickerMediaType", () => {
    it("returns videos for 'videos'", () => expect(toPickerMediaType("videos")).toEqual(["videos"]));
    it("returns all types for 'all'", () => expect(toPickerMediaType("all")).toEqual(["images", "videos", "livePhotos"]));
    it("returns images by default", () => expect(toPickerMediaType(undefined)).toEqual(["images"]));
    it("returns images for 'images'", () => expect(toPickerMediaType("images")).toEqual(["images"]));
});