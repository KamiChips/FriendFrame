import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { router } from 'expo-router';
import {
    signIn,
    signInWithGoogle,
} from '@/services/supabase/auth/auth.sign-in';
import { useColorScheme } from 'react-native';

jest.mock('@/services/supabase/auth/auth.sign-in', () => ({
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
}));

jest.mock('@/components/ui/common/text-field', () => {
    const React = require('react');
    const { TextInput } = require('react-native');

    return {
        TextField: (props: any) => <TextInput {...props} />,
    };
});

describe('<LoginScreen />', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Tests de Contenido
    test('renders "Welcome Back!" title', async () => {
        const { getByText } = await render(<LoginScreen />);
        expect(getByText('Welcome Back!')).toBeTruthy();
    });

    test('renders username field', async () => {
        const { getByTestId } = await render(<LoginScreen />);
        expect(getByTestId('username-textfield')).toBeTruthy();
    });

    test('renders password field', async () => {
        const { getByTestId } = await render(<LoginScreen />);
        expect(getByTestId('password-textfield')).toBeTruthy();
    });

    test('renders login button', async () => {
        const { getByText } = await render(<LoginScreen />);
        expect(getByText('Log In')).toBeTruthy();
    });

    test('renders "Sign up" link', async () => {
        const { getByText } = await render(<LoginScreen />);
        expect(getByText('Sign up')).toBeTruthy();
    });

    test('renders "Forgot Password?" text', async () => {
        const { getByText } = await render(<LoginScreen />);
        expect(getByText('Forgot Password?')).toBeTruthy();
    });

    // Tests de Tema
    test('renders correctly in light mode', async () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');
        const { getByText } = await render(<LoginScreen />);
        expect(getByText('Welcome Back!')).toBeTruthy();
    });

    test('renders correctly in dark mode', async () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');
        const { getByText } = await render(<LoginScreen />);
        expect(getByText('Welcome Back!')).toBeTruthy();
    });

    // Tests de Validación
    test('shows error when submitting empty fields', async () => {
        const { getByTestId, getByText } = await render(<LoginScreen />);
        await fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(getByText('Please fill in all fields.')).toBeTruthy();
        });
    });

    test('shows error when only username is filled', async () => {
        const { getByTestId, getByText } = await render(<LoginScreen />);
        await fireEvent.changeText(
            getByTestId('username-textfield'),
            'nito@email.com'
        );
        // password vacío
        await fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(getByText('Please fill in all fields.')).toBeTruthy();
        });
    });

    test('shows error when only password is filled', async () => {
        const { getByTestId, getByText } = await render(<LoginScreen />);
        // username vacío
        await fireEvent.changeText(
            getByTestId('password-textfield'),
            'password123'
        );
        await fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(getByText('Please fill in all fields.')).toBeTruthy();
        });
    });

    test('does not call signIn when fields are empty', async () => {
        const { getByTestId } = await render(<LoginScreen />);
        await fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(signIn).not.toHaveBeenCalled();
        });
    });

    // Tests de Interacción con campos
    test('user can type in username field', async () => {
        const { getByTestId } = await render(<LoginScreen />);
        const input = getByTestId('username-textfield');
        await fireEvent.changeText(input, 'nitito@email.com');
        expect(input.props.value).toBe('nitito@email.com');
    });

    test('user can type in password field', async () => {
        const { getByTestId } = await render(<LoginScreen />);
        const input = getByTestId('password-textfield');
        await fireEvent.changeText(input, 'tengohambre123');
        expect(input.props.value).toBe('tengohambre123');
    });

    test('password field has secureTextEntry enabled', async () => {
        const { getByTestId } = await render(<LoginScreen />);
        const input = getByTestId('password-textfield');
        expect(input.props.secureTextEntry).toBe(true);
    });

    // Llamada a signIn
    test('Button is disabled and shows ActivityIndicator while loading', async () => {
        // no resuelve, loading queda en true para verificar que la cosa aparezca en loading
        (signIn as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByTestId } = await render(<LoginScreen />);
        await fireEvent.changeText(
            getByTestId('username-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-textfield'),
            'estoylavandoropa01'
        );
        fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByTestId('loading-indicator')).toBeTruthy();
        });
    });

    test('calls signIn with correct credentials', async () => {
        (signIn as jest.Mock).mockResolvedValue({ data: {}, error: null });

        const { getByTestId } = await render(<LoginScreen />);
        await fireEvent.changeText(
            getByTestId('username-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-textfield'),
            'tengosueño123'
        );
        await fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith({
                email: 'nito@email.com',
                password: 'tengosueño123',
            });
        });
    });

    test('shows error when email and password are valid but not exist in database', async () => {
        (signIn as jest.Mock).mockResolvedValue({
            data: null,
            error: 'Invalid login credentials',
        });

        const { getByTestId, getByText } = await render(<LoginScreen />);
        await fireEvent.changeText(
            getByTestId('username-textfield'),
            'etecorreonoexiste@todomal.com'
        );
        await fireEvent.changeText(
            getByTestId('password-textfield'),
            'muymuymal123'
        );
        await fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByText('Invalid login credentials')).toBeTruthy();
        });
    });

    test('shows error message when signIn fails', async () => {
        (signIn as jest.Mock).mockResolvedValue({
            data: null,
            error: 'Credenciales incorrectas',
        });

        const { getByTestId, getByText } = await render(<LoginScreen />);
        await fireEvent.changeText(
            getByTestId('username-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-textfield'),
            'quienestaleyendoesto'
        );
        await fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByText('Credenciales incorrectas')).toBeTruthy();
        });
    });

    test('Google button is disabled while login is loading', async () => {
        (signIn as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByTestId } = await render(<LoginScreen />);
        await fireEvent.changeText(
            getByTestId('username-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-textfield'),
            'quierocomidaaaa12'
        );
        fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(
                getByTestId('google-signin-button').props.accessibilityState
                    ?.disabled
            ).toBe(true);
        });
    });

    // Tests signInWithGoogle
    test('calls signInWithGoogle when Google button is pressed', async () => {
        (signInWithGoogle as jest.Mock).mockResolvedValue({ error: null });

        const { getByTestId } = await render(<LoginScreen />);
        await fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(signInWithGoogle).toHaveBeenCalledWith(
                'frontend://auth/callback'
            );
        });
    });

    test('shows error when Google sing in fails', async () => {
        (signInWithGoogle as jest.Mock).mockResolvedValue({
            error: 'Error al iniciar sesión con Google',
        });

        const { getByTestId, getByText } = await render(<LoginScreen />);
        await fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(
                getByText('Error al iniciar sesión con Google')
            ).toBeTruthy();
        });
    });

    test('Googele button is disabled while loading', async () => {
        (signInWithGoogle as jest.Mock).mockImplementation(
            () => new Promise(() => {})
        );

        const { getByTestId } = await render(<LoginScreen />);
        fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(
                getByTestId('google-signin-button').props.accessibilityState
                    ?.disabled
            ).toBe(true);
        });
    });

    test('login button is disabled while Google sign in is loading', async () => {
        (signInWithGoogle as jest.Mock).mockImplementation(
            () => new Promise(() => {})
        );

        const { getByTestId } = await render(<LoginScreen />);
        fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(
                getByTestId('login-button').props.accessibilityState?.disabled
            ).toBe(true);
        });
    });

    // Tests de Navegación
    test('"Sign up" navigates to /(auth)/signup', async () => {
        const { getByText } = await render(<LoginScreen />);
        await fireEvent.press(getByText('Sign up'));
        expect(router.push).toHaveBeenCalledWith('/(auth)/signup');
    });

    // Snapshot
    test('matches snapshot', async () => {
        const { toJSON } = await render(<LoginScreen />);
        expect(toJSON()).toMatchSnapshot();
    });
});
