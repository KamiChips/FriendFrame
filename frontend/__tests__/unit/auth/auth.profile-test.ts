import { updateProfilePic, editUsername, editFullName } from "@/services/supabase/auth/auth.profile";
import { mockFrom, mockStorageFrom } from "@/__mocks__/supabaseMock";
import * as ImagePicker from "expo-image-picker";
import { getAuthUser } from "@/services/supabase/helpers/validation";
const { supabase } = require("@/lib/supabase/client");
console.log("supabase.storage.from === mockStorageFrom?", supabase.storage.from === mockStorageFrom);

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/auth/auth.helpers", () => ({
    ...jest.requireActual("@/services/supabase/auth/auth.helpers"),
}));

const mockRequestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockGetAuthUser = getAuthUser as jest.Mock;

const mockProfile = {
    user_id: "uid-1", full_name: "Rogelio Camacho", username: "elnito7",
    email: "nito@nitomail.com", profile_pic: null,
    created_at: "", updated_at: "",
};

beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue("uid-1");

    // default storage mock
    mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: "https://cdn.example.com/uid-1.jpg" },
        }),
    });
});

describe("updateProfilePic", () => {
    it("returns error if userId is empty", async () => {
        const result = await updateProfilePic("");
        expect(result.error).toBeTruthy();
    });

    it("returns error if gallery permission is denied", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "denied" });

        const result = await updateProfilePic("uid-1");
        expect(result.error).toBe("Se necesita permiso para acceder a la galería.");
    });

    it("returns null if user cancels picker", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

        const result = await updateProfilePic("uid-1");
        expect(result).toEqual({ data: null, error: null });
    });

    it("uploads image and returns public url", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({
            canceled: false,
            assets: [{ uri: "file://photo.jpg" }],
        });

        try {
            const fd = new FormData();
            fd.append("file", { uri: "file://photo.jpg", name: "uid-1.jpg", type: "image/jpeg" } as any);
            console.log("FormData.append works:", true);
        } catch(e) {
            console.log("FormData.append error:", e);
        }

        // primera llamada: upload
        // segunda llamada: getPublicUrl
        mockStorageFrom
            .mockReturnValueOnce({
                upload: jest.fn().mockResolvedValue({ error: null }),
            })
            .mockReturnValueOnce({
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: "https://cdn.example.com/uid-1.jpg" },
                }),
            });

        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
        });

        const result = await updateProfilePic("uid-1");
        console.log("result completo:", JSON.stringify(result));
        console.log("storageFrom calls:", mockStorageFrom.mock.calls.length);
        console.log("mockFrom calls:", mockFrom.mock.calls.length);
        expect(result.error).toBeNull();
        expect(result.data).toContain("https://cdn.example.com/uid-1.jpg");
    });

    it("returns error if upload fails", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({
            canceled: false,
            assets: [{ uri: "file://photo.jpg" }],
        });

        mockStorageFrom.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: new Error("Upload failed") }),
            getPublicUrl: jest.fn(),
        });

        const result = await updateProfilePic("uid-1");
        expect(result.error).toBeTruthy();
    });

    it("returns error if db update fails", async () => {
        mockRequestPermissions.mockResolvedValue({ status: "granted" });
        mockLaunchLibrary.mockResolvedValue({
            canceled: false,
            assets: [{ uri: "file://photo.jpg" }],
        });

        mockStorageFrom
            .mockReturnValueOnce({
                upload: jest.fn().mockResolvedValue({ error: null }),
            })
            .mockReturnValueOnce({
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: "https://cdn.example.com/uid-1.jpg" },
                }),
            });

        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: new Error("DB error") }),
            }),
        });

        const result = await updateProfilePic("uid-1");
        expect(result.error).toBeTruthy();
    });
});

describe("editUsername", () => {
    it("returns error if username is invalid", async () => {
        const result = await editUsername("");
        expect(result.error).toBeTruthy();
    });

    it("returns error if username is the same as current", async () => {
        const single = jest.fn().mockResolvedValue({ data: { username: "elnito7" }, error: null });
        const eq = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        const result = await editUsername("elnito7");
        expect(result.error).toBe("El username es igual al actual.");
    });

    it("returns error if username is already taken", async () => {
        const singleFn = jest.fn().mockResolvedValue({ data: { username: "otro" }, error: null });
        const maybeSingleFn = jest.fn().mockResolvedValue({ data: { user_id: "uid-2" }, error: null });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
            callCount++;
            if (callCount === 1) return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: singleFn }) }) };
            return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle: maybeSingleFn }) }) };
        });

        const result = await editUsername("elnito7");
        expect(result.error).toBe("Ese nombre de usuario ya está en uso.");
    });

    it("updates username successfully", async () => {
        const singleCurrent = jest.fn().mockResolvedValue({ data: { username: "viejo" }, error: null });
        const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const singleUpdate = jest.fn().mockResolvedValue({ data: mockProfile, error: null });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
            callCount++;
            if (callCount === 1) return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: singleCurrent }) }) };
            if (callCount === 2) return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle }) }) };
            return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleUpdate }) }) }) };
        });

        const result = await editUsername("elnito7");
        expect(result).toEqual({ data: mockProfile, error: null });
    });

    it("returns error if update fails", async () => {
        const singleCurrent = jest.fn().mockResolvedValue({ data: { username: "viejo" }, error: null });
        const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const singleUpdate = jest.fn().mockResolvedValue({ data: null, error: new Error("DB error") });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
            callCount++;
            if (callCount === 1) return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: singleCurrent }) }) };
            if (callCount === 2) return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle }) }) };
            return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleUpdate }) }) }) };
        });

        const result = await editUsername("elnito7");
        expect(result.error).toBeTruthy();
    });
});

describe("editFullName", () => {
    it("returns error if full name is invalid", async () => {
        const result = await editFullName("");
        expect(result.error).toBeTruthy();
    });

    it("updates full name successfully", async () => {
        const single = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({ single }),
                }),
            }),
        });

        const result = await editFullName("Rogelio Camacho");
        expect(result).toEqual({ data: mockProfile, error: null });
    });

    it("returns error if update fails", async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB error") });
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({ single }),
                }),
            }),
        });

        const result = await editFullName("Rogelio Camacho");
        expect(result.error).toBeTruthy();
    });

    it("returns error if getAuthUser fails", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("No session"));

        const result = await editFullName("Rogelio Camacho");
        expect(result.error).toBeTruthy();
    });
});