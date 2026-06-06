import { pickMedia, pickFromCamera } from "@/services/supabase/storage/media";
import * as ImagePicker from "expo-image-picker";

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    launchCameraAsync: jest.fn(),
}));

jest.mock("@/services/supabase/storage/storage.helpers", () => ({
    clampQuality: jest.requireActual("@/services/supabase/storage/storage.helpers").clampQuality,
    parseError: jest.requireActual("@/services/supabase/storage/storage.helpers").parseError,
    toPickerMediaType: jest.requireActual("@/services/supabase/storage/storage.helpers").toPickerMediaType,
}));

const mockRequestLibrary = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockRequestCamera = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;

const mockAsset = { uri: "file://photo.jpg", width: 100, height: 100 };

beforeEach(() => jest.clearAllMocks());

describe("pickMedia", () => {
    it("returns error if gallery permission is denied", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "denied" });

        const result = await pickMedia();
        expect(result).toEqual({ data: null, error: "Se necesita permiso para acceder a la galería." });
    });

    it("returns null if user cancels", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

        const result = await pickMedia();
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error if no assets returned", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [] });

        const result = await pickMedia();
        expect(result).toEqual({ data: null, error: "No se selecciono ningun archivo." });
    });

    it("returns first asset on success", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        const result = await pickMedia();
        expect(result).toEqual({ data: mockAsset, error: null });
    });

    it("passes options to launchImageLibraryAsync", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        await pickMedia({ mediaTypes: "videos", allowEditing: true, quality: 0.5 });

        expect(mockLaunchLibrary).toHaveBeenCalledWith(expect.objectContaining({
            mediaTypes: ["videos"],
            allowsEditing: true,
            quality: 0.5,
        }));
    });

    it("uses default options when none provided", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        await pickMedia();

        expect(mockLaunchLibrary).toHaveBeenCalledWith(expect.objectContaining({
            allowsEditing: false,
            quality: 0.85,
        }));
    });

    it("passes mediaTypes all correctly", async () => {
        mockRequestLibrary.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        await pickMedia({ mediaTypes: "all" });

        expect(mockLaunchLibrary).toHaveBeenCalledWith(expect.objectContaining({
            mediaTypes: ["images", "videos", "livePhotos"],
        }));
    });

    it("silently catches errors", async () => {
        mockRequestLibrary.mockRejectedValue(new Error("NetworkError"));

        const result = await pickMedia();
        expect(result.error).toBe("Error de red. Verifica tu conexión.");
    });
});

describe("pickFromCamera", () => {
    it("returns error if camera permission is denied", async () => {
        mockRequestCamera.mockResolvedValue({ status: "denied" });

        const result = await pickFromCamera();
        expect(result).toEqual({ data: null, error: "Se necesita permiso para acceder a la cámara." });
    });

    it("returns null if user cancels", async () => {
        mockRequestCamera.mockResolvedValue({ status: "granted" });
        mockLaunchCamera.mockResolvedValue({ canceled: true, assets: [] });

        const result = await pickFromCamera();
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error if no assets returned", async () => {
        mockRequestCamera.mockResolvedValue({ status: "granted" });
        mockLaunchCamera.mockResolvedValue({ canceled: false, assets: [] });

        const result = await pickFromCamera();
        expect(result).toEqual({ data: null, error: "No se capturó ningún archivo." });
    });

    it("returns first asset on success", async () => {
        mockRequestCamera.mockResolvedValue({ status: "granted" });
        mockLaunchCamera.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        const result = await pickFromCamera();
        expect(result).toEqual({ data: mockAsset, error: null });
    });

    it("passes options to launchCameraAsync", async () => {
        mockRequestCamera.mockResolvedValue({ status: "granted" });
        mockLaunchCamera.mockResolvedValue({ canceled: false, assets: [mockAsset] });

        await pickFromCamera({ mediaTypes: "videos", quality: 0.7 });

        expect(mockLaunchCamera).toHaveBeenCalledWith(expect.objectContaining({
            mediaTypes: ["videos"],
            quality: 0.7,
        }));
    });

    it("silently catches errors", async () => {
        mockRequestCamera.mockRejectedValue(new Error("NetworkError"));

        const result = await pickFromCamera();
        expect(result.error).toBe("Error de red. Verifica tu conexión.");
    });
});