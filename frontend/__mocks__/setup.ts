// Mocks compartidos en login y signup
jest.mock("expo-linear-gradient", () => ({
    LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-router", () => ({
    router: { push: jest.fn() },
    Stack: { Screen: () => null },
}));

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
    default: jest.fn(() => "light"),
}));

jest.mock("react-native-safe-area-context", () => ({
    useSafeArea: jest.fn(() => ({ top: 0, bottom: 0 })),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));