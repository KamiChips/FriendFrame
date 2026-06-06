import { deletePostImage, deleteProfilePic } from "@/services/supabase/storage/deleteMedia";
import { mockFrom, mockStorageFrom } from "@/__mocks__/supabaseMock";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/storage/storage.helpers", () => ({
    ...jest.requireActual("@/services/supabase/storage/storage.helpers"),
}));

const userId = "550e8400-e29b-41d4-a716-446655440000";
const validUrl = "https://cdn.example.com/storage/v1/object/public/post-images/uid-1/file.jpg";

beforeEach(() => {
    jest.clearAllMocks();
    mockStorageFrom.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
    });
});

describe("deletePostImage", () => {
    it("returns null if publicUrl is empty", async () => {
        const result = await deletePostImage("");
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns null if url has no valid path", async () => {
        const result = await deletePostImage("https://cdn.example.com/other/file.jpg");
        expect(result).toEqual({ data: null, error: null });
    });

    it("deletes file successfully", async () => {
        const result = await deletePostImage(validUrl);
        expect(result).toEqual({ data: null, error: null });
        expect(mockStorageFrom).toHaveBeenCalledWith("post-images");
    });

    it("ignores 404 errors", async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest.fn().mockResolvedValue({ error: new Error("404 Not Found") }),
        });

        const result = await deletePostImage(validUrl);
        expect(result).toEqual({ data: null, error: null });
    });

    it("ignores Not Found errors", async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest.fn().mockResolvedValue({ error: new Error("Not Found") }),
        });

        const result = await deletePostImage(validUrl);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error on unexpected storage error", async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest.fn().mockResolvedValue({ error: new Error("NetworkError") }),
        });

        const result = await deletePostImage(validUrl);
        expect(result.error).toBe("Error de red. Verifica tu conexión.");
    });
});

describe("deleteProfilePic", () => {
    beforeEach(() => {
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
        });
    });

    it("returns error if userId is invalid", async () => {
        const result = await deleteProfilePic("no-es-uuid");
        expect(result.error).toContain("ID de usuario");
    });

    it("deletes profile pic and updates db successfully", async () => {
        const result = await deleteProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
        expect(mockStorageFrom).toHaveBeenCalledWith("profile-pictures");
        expect(mockFrom).toHaveBeenCalledWith("users");
    });

    it("ignores 404 storage errors", async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest.fn().mockResolvedValue({ error: new Error("404 Not Found") }),
        });

        const result = await deleteProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
    });

    it("ignores Not Found storage errors", async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest.fn().mockResolvedValue({ error: new Error("Not Found") }),
        });

        const result = await deleteProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error on unexpected storage error", async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest.fn().mockResolvedValue({ error: new Error("NetworkError") }),
        });

        const result = await deleteProfilePic(userId);
        expect(result.error).toBe("Error de red. Verifica tu conexión.");
    });

    it("returns error if db update fails", async () => {
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: new Error("DB error") }),
            }),
        });

        const result = await deleteProfilePic(userId);
        expect(result.error).toBeTruthy();
    });
});