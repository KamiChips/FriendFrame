import { render, fireEvent } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import HomeScreen from '@/app/(tabs)/home';

const mockPush = jest.fn();

// Mock de expo-router
jest.mock("expo-router", () => ({
    Link: ({ href, children, asChild }: { 
        href: string; 
        children: React.ReactElement; 
        asChild?: boolean 
    }) => {
        const { TouchableOpacity } = require('react-native');
        
        if (asChild) {
            // Clonar el hijo e inyectarle el onPress de navegación
            const React = require('react');
            return React.cloneElement(children, {
                onPress: () => mockPush(href)
            });
        }
        
        return (
            <TouchableOpacity onPress={() => mockPush(href)}>
                {children}
            </TouchableOpacity>
        );
    },
}));

describe('<HomeScreen />', () => {

    // Tests de contenido
    test('Title "friendframe" renders correctly on HomeScreen', () => {
        const { getByText } = render(<HomeScreen />);
        expect(getByText('friendframe')).toBeTruthy();
    });

    test('"Get Started" button is rendered', () => {
        const { getByText } = render(<HomeScreen />);
        expect(getByText('Get Started')).toBeTruthy();
    });

    test('"Have an Account?" button is rendered', () => {
        const { getByText } = render(<HomeScreen />);
        expect(getByText('Have an Account?')).toBeTruthy();
    });

    // Tests de interacción
    test('"Get Started" button is pressable', () => {
        const { getByText } = render(<HomeScreen />);
        expect(() => fireEvent.press(getByText('Get Started'))).not.toThrow();
    });

    test('"Have an Account?" button is pressable', () => {
        const { getByText } = render(<HomeScreen />);
        expect(() => fireEvent.press(getByText('Have an Account?'))).not.toThrow();
    });

    // Tests de temas
    test("Applies 'dark' class when dark theme is on", () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');
        const { getByText } = render(<HomeScreen />);
        expect(getByText('friendframe')).toBeTruthy();
    });

    test("Doesn't apply 'dark' class when light theme is on", () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');
        const { getByText } = render(<HomeScreen />);
        expect(getByText('friendframe')).toBeTruthy();
    });

    // Snapshot
    test('Matches with snapshot', () => {
        const { toJSON } = render(<HomeScreen />);
        expect(toJSON()).toMatchSnapshot();
    });
});

describe("<HomeScreen /> - Navigation", () => {
    
    beforeEach(() => {
        mockPush.mockClear();
    });

    test("'Get Started' navigates to /signup", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText('Get Started'));
        expect(mockPush).toHaveBeenCalledWith('@/app/(auth)/signup');
    });

    test("'Have an Account?' navigates to /login", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText('Have an Account?'));
        expect(mockPush).toHaveBeenCalledWith('@/app/(auth)/login');
    });

    test('Buttons navigate to different routes', () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText('Get Started'));
        fireEvent.press(getByText('Have an Account?'));
        expect(mockPush).toHaveBeenCalledTimes(2);
        expect(mockPush).toHaveBeenNthCalledWith(1, '@/app/(auth)/signup');
        expect(mockPush).toHaveBeenNthCalledWith(2, '@/app/(auth)/login');
    });
});
