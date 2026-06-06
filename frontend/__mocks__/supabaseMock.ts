export const mockFrom = jest.fn();
export const mockStorageFrom = jest.fn();

export const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    onAuthStateChange: jest.fn(),
};

export const supabase = {
    auth: mockAuth,
    from: mockFrom,
    storage: {
        from: (...args: any[]) => mockStorageFrom(...args),
    },
};