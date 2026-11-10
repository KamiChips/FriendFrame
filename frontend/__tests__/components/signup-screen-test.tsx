import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '@/app/(auth)/signup';
import { router } from 'expo-router';
import { signUp } from '@/services/supabase/auth/auth.sign-up';
import { Alert } from 'react-native';

jest.mock('@/services/supabase/auth/auth.sign-up', () => ({
    signUp: jest.fn(),
}));

jest.mock('@/components/ui/TextField', () => {
    const React = require('react');
    const { TextInput } = require('react-native');

    return {
        TextField: (props: any) => <TextInput {...props} />,
    };
});

describe('<SignUpScreen />', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Tests de Contenido
    test('renders "Get Started!" title', async () => {
        const { getByText } = await render(<SignUpScreen />);
        expect(getByText('Get Started!')).toBeTruthy();
    });

    test('renders Full Name field', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        expect(getByTestId('fullname-textfield')).toBeTruthy();
    });

    test('renders Username field', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        expect(getByTestId('username-signup-textfield')).toBeTruthy();
    });

    test('renders Email field', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        expect(getByTestId('email-signup-textfield')).toBeTruthy();
    });

    test('renders Password field', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        expect(getByTestId('password-signup-textfield')).toBeTruthy();
    });

    test('renders "Crear cuenta" button', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        expect(getByTestId('signup-button')).toBeTruthy();
    });

    test('renders Terms and Conditions checkbox', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        expect(getByTestId('tac-button')).toBeTruthy();
    });

    test('renders "Log In" link', async () => {
        const { getByText } = await render(<SignUpScreen />);
        expect(getByText('Log In')).toBeTruthy();
    });

    // Tests de Validación
    test('shows error when submitting empty fields', async () => {
        const { getByText, getByTestId } = await render(<SignUpScreen />);

        // Aceptar términos
        await fireEvent.press(getByTestId('tac-button'));
        await fireEvent.press(getByTestId('signup-button'));

        await waitFor(() => {
            expect(getByText('Please fill in all fields.')).toBeTruthy();
        });
    });

    test('does not call signUp when fields are empty', async () => {
        const { getByTestId } = await render(<SignUpScreen />);
        await fireEvent.press(getByTestId('signup-button'));
        await waitFor(() => {
            expect(signUp).not.toHaveBeenCalled();
        });
    });

    test('shows error when some fields are empty', async () => {
        const { getByTestId, getByText } = await render(<SignUpScreen />);

        await fireEvent.changeText(
            getByTestId('fullname-textfield'),
            'Rrojelyo Kamasho'
        );
        await fireEvent.changeText(
            getByTestId('username-signup-textfield'),
            '7otinle'
        );

        await fireEvent.press(getByTestId('tac-button'));
        await fireEvent.press(getByTestId('signup-button'));

        await waitFor(() => {
            expect(getByText('Please fill in all fields.')).toBeTruthy();
        });
    });

    // Términos y condiciones
    test('shows alert when submitting without accepting terms', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByTestId } = await render(<SignUpScreen />);

        await fireEvent.changeText(
            getByTestId('fullname-textfield'),
            'Rogelio Camacho'
        );
        await fireEvent.changeText(
            getByTestId('username-signup-textfield'),
            'elnito7'
        );
        await fireEvent.changeText(
            getByTestId('email-signup-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-signup-textfield'),
            'yacomiyasoyfeliz02'
        );
        await fireEvent.press(getByTestId('signup-button'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Legal Notice',
                expect.any(String)
            );
        });
    });

    test('terms checkbox toggles when pressed', async () => {
        const { getByText, getByTestId } = await render(<SignUpScreen />);
        const termsText = getByText('Terms of Service and Privacy Policy');
        // Antes de presionar no hay checkmark
        expect(() => getByText('✓')).toThrow();
        // Presionar checkbox
        await fireEvent.press(getByTestId('tac-button'));
        expect(getByText('✓')).toBeTruthy();
    });

    test('terms chackbox can be unselected after being selected', async () => {
        const { getByTestId, getByText } = await render(<SignUpScreen />);

        await fireEvent.press(getByTestId('tac-button'));
        expect(getByText('✓')).toBeTruthy();

        await fireEvent.press(getByTestId('tac-button'));
        expect(() => getByText('✓')).toThrow();
    });

    // Modal de términos
    test('opens terms modal when pressing "Terms of Service and Privacy Policy"', async () => {
        const { getByText } = await render(<SignUpScreen />);
        await fireEvent.press(getByText('Terms of Service and Privacy Policy'));
        expect(getByText('Terms & Privacy Policy')).toBeTruthy();
    });

    test('closes terms modal when pressing "Got it"', async () => {
        const { getByText, queryByText } = await render(<SignUpScreen />);
        await fireEvent.press(getByText('Terms of Service and Privacy Policy'));
        await fireEvent.press(getByText('Got it'));
        await waitFor(() => {
            expect(queryByText('Terms & Privacy Policy')).toBeNull();
        });
    });

    test('closes terms modal when pressing "✕"', async () => {
        const { getByText, queryByText } = await render(<SignUpScreen />);
        await fireEvent.press(getByText('Terms of Service and Privacy Policy'));
        await fireEvent.press(getByText('✕'));
        await waitFor(() => {
            expect(queryByText('Terms & Privacy Policy')).toBeNull();
        });
    });

    // Registro exitoso
    test('calls signUp with correct data', async () => {
        (signUp as jest.Mock).mockResolvedValue({ data: {}, error: null });

        const { getByTestId } = await render(<SignUpScreen />);
        await fireEvent.changeText(
            getByTestId('fullname-textfield'),
            'Rogelio Camacho'
        );
        await fireEvent.changeText(
            getByTestId('username-signup-textfield'),
            'elnito7'
        );
        await fireEvent.changeText(
            getByTestId('email-signup-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-signup-textfield'),
            'tengosueño123'
        );
        await fireEvent.press(getByTestId('tac-button'));
        await fireEvent.press(getByTestId('signup-button'));

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
        (signUp as jest.Mock).mockResolvedValue({
            data: { user: {} },
            error: null,
        });

        const { getByText, getByTestId } = await render(<SignUpScreen />);
        await fireEvent.changeText(
            getByTestId('fullname-textfield'),
            'Rogelio Camacho'
        );
        await fireEvent.changeText(
            getByTestId('username-signup-textfield'),
            'elnito7'
        );
        await fireEvent.changeText(
            getByTestId('email-signup-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-signup-textfield'),
            'tengosueño123'
        );
        await fireEvent.press(getByTestId('tac-button'));
        await fireEvent.press(getByTestId('signup-button'));

        await waitFor(() => {
            expect(getByText('Account created!')).toBeTruthy();
        });
    });

    test('shows error when signUp fails', async () => {
        (signUp as jest.Mock).mockResolvedValue({
            data: null,
            error: 'An account with that email already exists.',
        });

        const { getByText, getByTestId } = await render(<SignUpScreen />);
        await fireEvent.changeText(
            getByTestId('fullname-textfield'),
            'Rogelio Camacho'
        );
        await fireEvent.changeText(
            getByTestId('username-signup-textfield'),
            'elnito7'
        );
        await fireEvent.changeText(
            getByTestId('email-signup-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-signup-textfield'),
            'tengosueño123'
        );
        await fireEvent.press(getByTestId('tac-button'));
        await fireEvent.press(getByTestId('signup-button'));

        await waitFor(() => {
            expect(
                getByText('An account with that email already exists.')
            ).toBeTruthy();
        });
    });

    test('Sign up button is diabled while loading', async () => {
        (signUp as jest.Mock).mockImplementation(() => new Promise(() => {}));

        const { getByTestId } = await render(<SignUpScreen />);
        await fireEvent.changeText(
            getByTestId('fullname-textfield'),
            'Rogelio Camacho'
        );
        await fireEvent.changeText(
            getByTestId('username-signup-textfield'),
            'elnito7'
        );
        await fireEvent.changeText(
            getByTestId('email-signup-textfield'),
            'nito@email.com'
        );
        await fireEvent.changeText(
            getByTestId('password-signup-textfield'),
            'tengosueño123'
        );
        await fireEvent.press(getByTestId('tac-button'));
        fireEvent.press(getByTestId('signup-button'));

        await waitFor(() => {
            expect(
                getByTestId('signup-button').props.accessibilityState?.disabled
            ).toBe(true);
        });
    });

    // Tests de signUpWithGoogle - no hay signUpWithGoogle??? si lo agregan luego los pongo

    // Tests de Navegación ---
    test('"Log In" navigates to /(auth)/login', async () => {
        const { getByText } = await render(<SignUpScreen />);
        await fireEvent.press(getByText('Log In'));
        expect(router.push).toHaveBeenCalledWith('/(auth)/login');
    });

    // Snapshot
    test('matches snapshot', async () => {
        const { toJSON } = await render(<SignUpScreen />);
        expect(toJSON()).toMatchSnapshot();
    });
});
