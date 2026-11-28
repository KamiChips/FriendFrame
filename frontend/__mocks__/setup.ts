import { supabase } from './supabaseMock';

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-router', () => ({
    router: { push: jest.fn() },
    Stack: { Screen: () => null },
}));

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    default: jest.fn(() => 'light'),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeArea: jest.fn(() => ({ top: 0, bottom: 0 })),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/supabase/client', () => ({
    supabase: require('./supabaseMock').supabase,
}));

jest.mock('@/services/ratelimit/rateLimiter', () => ({
    signupAttempts: jest.fn().mockResolvedValue({
        success: true,
        remaining: 2,
        resetAt: new Date(Date.now() + 60_000),
    }),
    postCreation: jest.fn().mockResolvedValue({
        success: true,
        remaining: 49,
        resetAt: new Date(Date.now() + 60_000),
    }),
}));