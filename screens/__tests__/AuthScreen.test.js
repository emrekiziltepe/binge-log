import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AuthScreen from '../AuthScreen';
import { loginUser, registerUser } from '../../services/authService';
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../services/authService', () => ({
    loginUser: jest.fn(),
    registerUser: jest.fn(),
    onAuthStateChange: jest.fn(() => () => { }),
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('AuthScreen', () => {
    const mockTheme = {
        colors: {
            background: '#fff',
            card: '#fff',
            text: '#000',
            textSecondary: '#666',
            primary: 'blue',
            inputBackground: '#f0f0f0',
            inputBorder: '#ccc',
            placeholder: '#999',
            error: 'red',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form by default', () => {
        const { getAllByText, getByPlaceholderText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <AuthScreen onAuthSuccess={() => { }} />
            </ThemeContext.Provider>
        );

        const loginTexts = getAllByText('auth.login');
        expect(loginTexts.length).toBeGreaterThan(0);
        expect(getByPlaceholderText('auth.emailPlaceholder')).toBeTruthy();
        expect(getByPlaceholderText('auth.passwordPlaceholder')).toBeTruthy();
    });

    it('switches to register form', () => {
        const { getByText, getAllByText, getByPlaceholderText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <AuthScreen onAuthSuccess={() => { }} />
            </ThemeContext.Provider>
        );
        fireEvent.press(getByText('auth.noAccount'));

        const registerTexts = getAllByText('auth.register');
        expect(registerTexts.length).toBeGreaterThan(0);
        expect(getByPlaceholderText('auth.displayNamePlaceholder')).toBeTruthy();
    });

    it('calls loginUser on submit', async () => {
        loginUser.mockResolvedValue({ success: true, user: { uid: '123' } });
        const onAuthSuccess = jest.fn();

        const { getAllByText, getByPlaceholderText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <AuthScreen onAuthSuccess={onAuthSuccess} />
            </ThemeContext.Provider>
        );

        fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('auth.passwordPlaceholder'), 'password');

        // There might be multiple 'auth.login' texts (header and button)
        // The button is likely the last one or we can just press all of them (not ideal)
        // Or better, find the one that is a button.
        // For simplicity in this environment, let's assume the button is the last one.
        const loginButtons = getAllByText('auth.login');
        fireEvent.press(loginButtons[loginButtons.length - 1]);

        await waitFor(() => {
            expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password');
            expect(onAuthSuccess).toHaveBeenCalled();
        });
    });

    it('calls registerUser on submit', async () => {
        registerUser.mockResolvedValue({ success: true, user: { uid: '123' } });
        const onAuthSuccess = jest.fn();

        const { getByText, getAllByText, getByPlaceholderText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <AuthScreen onAuthSuccess={onAuthSuccess} />
            </ThemeContext.Provider>
        );

        // Switch to register
        fireEvent.press(getByText('auth.noAccount'));

        fireEvent.changeText(getByPlaceholderText('auth.displayNamePlaceholder'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('auth.passwordPlaceholder'), 'password');

        const registerButtons = getAllByText('auth.register');
        fireEvent.press(registerButtons[registerButtons.length - 1]);

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith('test@example.com', 'password', 'Test User');
        });
    });
});
