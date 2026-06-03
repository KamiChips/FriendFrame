import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { router } from 'expo-router';
import { signIn, signInWithGoogle } from '@/services/supabase/auth/auth.sign-in';
import { useColorScheme } from 'react-native';

jest.mock("@/services/supabase/auth/auth.sign-in", () => ({
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
}));

jest.mock('@/components/ui/TextField', () => {
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
    test('renders "Welcome Back!" title', () => {
        const { getByText } = render(<LoginScreen />);
        expect(getByText('Welcome Back!')).toBeTruthy();
    });

    test('renders username field', () => {
        const { getByTestId } = render(<LoginScreen />);
        expect(getByTestId('username-textfield')).toBeTruthy();
    });

    test('renders password field', () => {
        const { getByTestId } = render(<LoginScreen />);
        expect(getByTestId('password-textfield')).toBeTruthy();
    });

    test('renders login button', () => {
        const { getByText } = render(<LoginScreen />);
        expect(getByText('Iniciando Sesión')).toBeTruthy();
    });

    test('renders "Sign up" link', () => {
        const { getByText } = render(<LoginScreen />);
        expect(getByText('Sign up')).toBeTruthy();
    });

    test('renders "Forgot Password?" text', () => {
        const { getByText } = render(<LoginScreen />);
        expect(getByText('Forgot Password?')).toBeTruthy();
    });

    // Tests de Tema
    test('renders correctly in light mode', () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');
        const { getByText } = render(<LoginScreen />);
        expect(getByText('Welcome Back!')).toBeTruthy();
    });

    test('renders correctly in dark mode', () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');
        const { getByText } = render(<LoginScreen />);
        expect(getByText('Welcome Back!')).toBeTruthy();
    });

    // Tests de Validación
    test('shows error when submitting empty fields', async () => {
        const { getByTestId, getByText } = render(<LoginScreen />);
        fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(getByText('Completa todos los campos.')).toBeTruthy();
        });
    });

    test('shows error when only username is filled', async () => {
        const { getByTestId, getByText } = render(<LoginScreen />);
        fireEvent.changeText(getByTestId('username-textfield'), 'nito@email.com');
        // password vacío
        fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(getByText('Completa todos los campos.')).toBeTruthy();
        });
    });

    test('shows error when only password is filled', async () => {
        const { getByTestId, getByText } = render(<LoginScreen />);
        // username vacío
        fireEvent.changeText(getByTestId('password-textfield'), 'password123');
        fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(getByText('Completa todos los campos.')).toBeTruthy();
        });
    });

    test('does not call signIn when fields are empty', async () => {
        const { getByTestId } = render(<LoginScreen />);
        fireEvent.press(getByTestId('login-button'));
        await waitFor(() => {
            expect(signIn).not.toHaveBeenCalled();
        });
    });

    // Tests de Interacción con campos
    test('user can type in username field', () => {
        const { getByTestId } = render(<LoginScreen />);
        const input = getByTestId('username-textfield');
        fireEvent.changeText(input, 'nitito@email.com');
        expect(input.props.value).toBe('nitito@email.com');
    });

    test('user can type in password field', () => {
        const { getByTestId } = render(<LoginScreen />);
        const input = getByTestId('password-textfield');
        fireEvent.changeText(input, 'tengohambre123');
        expect(input.props.value).toBe('tengohambre123');
    });

    test('password field has secureTextEntry enabled', () => {
        const { getByTestId } = render(<LoginScreen />);
        const input = getByTestId('password-textfield');
        expect(input.props.secureTextEntry).toBe(true);
    });

    // Llamada a signIn 
    test('Button is disabled and shows ActivityIndicator while loading', async () => {
        // no resuelve, loading queda en true para verificar que la cosa aparezca en loading
        (signIn as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByTestId } = render(<LoginScreen />);
        fireEvent.changeText(getByTestId('username-textfield'), 'nito@email.com');
        fireEvent.changeText(getByTestId('password-textfield'), 'estoylavandoropa01');
        fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByTestId('loading-indicator')).toBeTruthy();
        });
    });

    test('calls signIn with correct credentials', async () => {
        (signIn as jest.Mock).mockResolvedValue({ data: {}, error: null });

        const { getByTestId } = render(<LoginScreen />);
        fireEvent.changeText(getByTestId('username-textfield'), 'nito@email.com');
        fireEvent.changeText(getByTestId('password-textfield'), 'tengosueño123');
        fireEvent.press(getByTestId('login-button'));

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
            error: 'invalid login credentials'
        });

        const { getByTestId, getByText } = render(<LoginScreen />);
        fireEvent.changeText(getByTestId('username-textfield'), 'etecorreonoexiste@todomal.com');
        fireEvent.changeText(getByTestId('password-textfield'), 'muymuymal123');
        fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByText('Invalid login credentials')).toBeTruthy();
        });
    });

    test('shows error message when signIn fails', async () => {
        (signIn as jest.Mock).mockResolvedValue({ 
            data: null, 
            error: 'Credenciales incorrectas' 
        });

        const { getByTestId, getByText } = render(<LoginScreen />);
        fireEvent.changeText(getByTestId('username-textfield'), 'nito@email.com');
        fireEvent.changeText(getByTestId('password-textfield'), 'quienestaleyendoesto');
        fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByText('Credenciales incorrectas')).toBeTruthy();
        });
    });

    test('Google button is disabled while login is loading', async () => {
        (signIn as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByTestId } = render(<LoginScreen />);
        fireEvent.changeText(getByTestId('username-textfield'), 'nito@email.com');
        fireEvent.changeText(getByTestId('password-textfield'), 'quierocomidaaaa12');
        fireEvent.press(getByTestId('login-button'));

        await waitFor(() => {
            expect(getByTestId('google-signin-button').props.accessibilityState?.disabled).toBe(true);
        });
    });

    // Tests signInWithGoogle
    test('calls signInWithGoogle when Google button is pressed', async () => {
        (signInWithGoogle as jest.Mock).mockResolvedValue({ error: null });

        const { getByTestId } = render(<LoginScreen />);
        fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(signInWithGoogle).toHaveBeenCalledWith('frontend://auth/callback');
        });
    });

    test('shows error when Google sing in fails', async () => {
        (signInWithGoogle as jest.Mock).mockResolvedValue({ 
            error: 'Error al iniciar sesión con Google' 
        });

        const { getByTestId, getByText } = render(<LoginScreen />);
        fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(getByText('Error al iniciar sesión con Google')).toBeTruthy();
        });
    });

    test('Googele button is disabled while loading', async () => {
        (signInWithGoogle as jest.Mock).mockResolvedValue({ error: null });

        const { getByTestId } = render(<LoginScreen />);
        fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(getByTestId('google-signin-button').props.accessibilityState?.disabled).toBe(true);
        });
    });

    test('login button is disabled while Google sign in is loading', async () => {
        (signInWithGoogle as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByTestId } = render(<LoginScreen />);
        fireEvent.press(getByTestId('google-signin-button'));

        await waitFor(() => {
            expect(getByTestId('login-button').props.accessibilityState?.disabled).toBe(true);
        });
    });

    // Tests de Navegación
    test('"Sign up" navigates to /(auth)/signup', () => {
        const { getByText } = render(<LoginScreen />);
        fireEvent.press(getByText('Sign up'));
        expect(router.push).toHaveBeenCalledWith('/(auth)/signup');
    });

    // Snapshot
    test('matches snapshot', () => {
        const { toJSON } = render(<LoginScreen />);
        expect(toJSON()).toMatchSnapshot();
    });
});