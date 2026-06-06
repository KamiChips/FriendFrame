import { mockFrom } from "@/__mocks__/supabaseMock";
import { registerDeviceToken, _removeCurrentDeviceToken } from "@/services/supabase/auth/auth.notifications";
import * as Notifications from "expo-notifications";

jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));
jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));
jest.mock("expo-notifications", () => ({
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
}));

const mockGetPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissionsAsync = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetExpoPushTokenAsync = Notifications.getExpoPushTokenAsync as jest.Mock;

const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockEq1 = jest.fn();
const mockEq2 = jest.fn().mockResolvedValue({ error: null });
const mockDelete = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "ExponentPushToken[test-token]" });

    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockDelete.mockReturnValue({ eq: mockEq1 });

    mockFrom.mockReturnValue({
        upsert: mockUpsert,
        delete: mockDelete,
    });
});

describe("registerDeviceToken", () => {
    it("registers token when permissions are already granted", async () => {
        await registerDeviceToken("uid-1");
        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: "uid-1", token: "ExponentPushToken[test-token]" }),
            expect.anything(),
        );
    });

    it("requests permissions if not granted and registers token", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
        mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });

        await registerDeviceToken("uid-1");
        expect(mockRequestPermissionsAsync).toHaveBeenCalled();
        expect(mockUpsert).toHaveBeenCalled();
    });

    it("does nothing if permission is denied after request", async () => {
        mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
        mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });

        await registerDeviceToken("uid-1");
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("does nothing if token is empty", async () => {
        mockGetExpoPushTokenAsync.mockResolvedValue({ data: null });

        await registerDeviceToken("uid-1");
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("does nothing if userId is empty", async () => {
        await registerDeviceToken("");
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("silently catches errors", async () => {
        mockGetExpoPushTokenAsync.mockRejectedValue(new Error("push error"));
        await expect(registerDeviceToken("uid-1")).resolves.toBeUndefined();
    });
});

describe("_removeCurrentDeviceToken", () => {
    it("removes token for active user", async () => {
        await _removeCurrentDeviceToken("uid-1");
        expect(mockEq1).toHaveBeenCalledWith("user_id", "uid-1");
    });

    it("does nothing if userId is empty", async () => {
        await _removeCurrentDeviceToken("");
        expect(mockEq1).not.toHaveBeenCalled();
    });

    it("does nothing if token is null", async () => {
        mockGetExpoPushTokenAsync.mockResolvedValue({ data: null });

        await _removeCurrentDeviceToken("uid-1");
        expect(mockEq1).not.toHaveBeenCalled();
    });

    it("silently catches errors", async () => {
        mockGetExpoPushTokenAsync.mockRejectedValue(new Error("token error"));
        await expect(_removeCurrentDeviceToken("uid-1")).resolves.toBeUndefined();
    });
});