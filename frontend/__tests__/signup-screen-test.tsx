import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '@/app/(auth)/signup';
import { router } from 'expo-router';
import { signUp } from '@/services/supabase/auth/auth.sign-up';
import { Alert } from 'react-native';

jest.mock("@/services/supabase/auth/auth.sign-up", () => ({
    signUp: jest.fn(),
}));

describe('<SignUpScreen />', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Tests de Contenido
    test('renders "Get Started!" title', () => {
        const { getByText } = render(<SignUpScreen />);
        expect(getByText('Get Started!')).toBeTruthy();
    });

    test('renders Full Name field', () => {
        const { getByPlaceholderText } = render(<SignUpScreen />);
        expect(getByPlaceholderText('Full Name')).toBeTruthy();
    });

    test('renders Username field', () => {
        const { getByPlaceholderText } = render(<SignUpScreen />);
        expect(getByPlaceholderText('Username')).toBeTruthy();
    });

    test('renders Email field', () => {
        const { getByPlaceholderText } = render(<SignUpScreen />);
        expect(getByPlaceholderText('Email')).toBeTruthy();
    });

    test('renders Password field', () => {
        const { getByPlaceholderText } = render(<SignUpScreen />);
        expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    test('renders "Crear cuenta" button', () => {
        const { getByText } = render(<SignUpScreen />);
        expect(getByText('Crear cuenta')).toBeTruthy();
    });

    test('renders "Log In" link', () => {
        const { getByText } = render(<SignUpScreen />);
        expect(getByText('Log In')).toBeTruthy();
    });

    // Tests de Validación
    test('shows error when submitting empty fields', async () => {
        const { getByText } = render(<SignUpScreen />);
        
        // Aceptar términos
        fireEvent.press(getByText('Acepto los'));
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(getByText('Completa todos los campos.')).toBeTruthy();
        });
    });

    test('does not call signUp when fields are empty', async () => {
        const { getByText } = render(<SignUpScreen />);
        fireEvent.press(getByText('Crear cuenta'));
        await waitFor(() => {
            expect(signUp).not.toHaveBeenCalled();
        });
    });

    test('shows error when some fields are empty', async () => {
        const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

        fireEvent.changeText(getByPlaceholderText('Full Name'), 'Rrojelyo Kamasho');
        fireEvent.changeText(getByPlaceholderText('Username'), '7otinle');

        fireEvent.press(getByText('Acepto los'));
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(getByText('Completa todos los campos.')).toBeTruthy();
        });
    });

    // Términos y condiciones
    test('shows alert when submitting without accepting terms', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);

        fireEvent.changeText(getByPlaceholderText('Full Name'), 'Rogelio Camacho');
        fireEvent.changeText(getByPlaceholderText('Username'), 'elnito7');
        fireEvent.changeText(getByPlaceholderText('Email'), 'nito@email.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'yacomiyasoyfeliz02');
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Aviso Legal',
                expect.any(String)
            );
        });
    });

    test('terms checkbox toggles when pressed', () => {
        const { getByText } = render(<SignUpScreen />);
        const termsText = getByText('Términos de Servicio y Privacidad');
        // Antes de presionar no hay checkmark
        expect(() => getByText('✓')).toThrow();
        // Presionar checkbox
        fireEvent.press(getByText('Acepto los'));
        expect(getByText('✓')).toBeTruthy();
    });

    test('terms chackbox can be unselected after being selected', () => {
        const { getByText } = render(<SignUpScreen />);

        fireEvent.press(getByText('Acepto los'));
        expect(getByText('✓')).toBeTruthy

        fireEvent.press(getByText('Acepto los'));
        expect(() => getByText('✓')).toThrow();
    });

    // Modal de términos
    test('opens terms modal when pressing "Términos de Servicio y Privacidad"', () => {
        const { getByText } = render(<SignUpScreen />);
        fireEvent.press(getByText('Términos de Servicio y Privacidad'));
        expect(getByText('Aviso Legal y Privacidad')).toBeTruthy();
    });

    test('closes terms modal when pressing "Entendido"', async () => {
        const { getByText, queryByText } = render(<SignUpScreen />);
        fireEvent.press(getByText('Términos de Servicio y Privacidad'));
        fireEvent.press(getByText('Entendido'));
        await waitFor(() => {
            expect(queryByText('Aviso Legal y Privacidad')).toBeNull();
        });
    });

    test('closes terms modal when pressing "✕"', async () => {
        const { getByText, queryByText } = render(<SignUpScreen />);
        fireEvent.press(getByText('Términos de Servicio y Privacidad'));
        fireEvent.press(getByText('✕'));
        await waitFor(() => {
            expect(queryByText('Aviso Legal y Privacidad')).toBeNull();
        });
    });

    // Registro exitoso
    test('calls signUp with correct data', async () => {
        (signUp as jest.Mock).mockResolvedValue({ data: {}, error: null });

        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);
        fireEvent.changeText(getByPlaceholderText('Full Name'), 'Rogelio Camacho');
        fireEvent.changeText(getByPlaceholderText('Username'), 'elnito7');
        fireEvent.changeText(getByPlaceholderText('Email'), 'nito@email.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'tengosueño123');
        fireEvent.press(getByText('Acepto los'));
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(signUp).toHaveBeenCalledWith({
                full_name: 'Rogelio Camacho',
                username: 'elnito7',
                email: 'nito@email.com',
                password: 'tengosueño123',
            });
        });
    });

    test('shows success screen after successful registration', async () => {
        (signUp as jest.Mock).mockResolvedValue({ data: { user: {} }, error: null });

        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);
        fireEvent.changeText(getByPlaceholderText('Full Name'), 'Rogelio Camacho');
        fireEvent.changeText(getByPlaceholderText('Username'), 'elnito7');
        fireEvent.changeText(getByPlaceholderText('Email'), 'nito@email.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'tengosueño123');
        fireEvent.press(getByText('Acepto los'));
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(getByText('¡Cuenta creada!')).toBeTruthy();
        });
    });

    test('shows error when signUp fails', async () => {
        (signUp as jest.Mock).mockResolvedValue({ 
            data: null, 
            error: 'El email ya está en uso' 
        });

        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);
        fireEvent.changeText(getByPlaceholderText('Full Name'), 'Rogelio Camacho');
        fireEvent.changeText(getByPlaceholderText('Username'), 'elnito7');
        fireEvent.changeText(getByPlaceholderText('Email'), 'nito@email.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'tengosueño123');
        fireEvent.press(getByText('Acepto los'));
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(getByText('El email ya está en uso')).toBeTruthy();
        });
    });

    test('Sign up button is diabled while loading', async () => {
        (signUp as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByPlaceholderText, getByText, getByTestId } = render(<SignUpScreen />);
            fireEvent.changeText(getByPlaceholderText('Full Name'), 'Rogelio Camacho');
        fireEvent.changeText(getByPlaceholderText('Username'), 'elnito7');
        fireEvent.changeText(getByPlaceholderText('Email'), 'email@nito.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'queotrostestspongo967');
        fireEvent.press(getByText('Acepto los'));
        fireEvent.press(getByText('Crear cuenta'));

        await waitFor(() => {
            expect(getByTestId('signup-button').props.accessibilityState?.disabled).toBe(true);
        })
    });

    // Tests de signUpWithGoogle - no hay signUpWithGoogle??? si lo agregan luego los pongo

    // Tests de Navegación ---
    test('"Log In" navigates to /(auth)/login', () => {
        const { getByText } = render(<SignUpScreen />);
        fireEvent.press(getByText('Log In'));
        expect(router.push).toHaveBeenCalledWith('/(auth)/login');
    });

    // Snapshot
    test('matches snapshot', () => {
        const { toJSON } = render(<SignUpScreen />);
        expect(toJSON()).toMatchSnapshot();
    });
});