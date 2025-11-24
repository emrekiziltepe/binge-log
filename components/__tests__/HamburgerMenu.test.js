import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HamburgerMenu from '../HamburgerMenu';
import { logoutUser } from '../../services/authService';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../services/authService', () => ({
    logoutUser: jest.fn(),
    loginUser: jest.fn(),
    registerUser: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { language: 'en' }
    }),
}));

jest.mock('../../i18n', () => ({
    changeLanguage: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('expo-constants', () => ({
    expoConfig: { version: '1.0.0' },
}));

describe('HamburgerMenu', () => {
    const mockTheme = {
        theme: 'light',
        colors: {
            surface: '#fff',
            text: '#000',
            textSecondary: '#666',
            primary: 'blue',
            modalBackground: 'rgba(0,0,0,0.5)',
            modalContent: '#fff',
            border: '#ccc',
            borderLight: '#eee',
        },
        toggleTheme: jest.fn(),
    };

    const mockProps = {
        navigation: { navigate: jest.fn() },
        user: { email: 'test@example.com' },
        onUserChange: jest.fn(),
        onShowAuthModal: jest.fn(),
        syncStatus: { isOnline: true, syncInProgress: false },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders hamburger button', () => {
        const { getByTestId } = render(
            <ThemeContext.Provider value={mockTheme}>
                <HamburgerMenu {...mockProps} />
            </ThemeContext.Provider>
        );
        expect(getByTestId('hamburger-button')).toBeTruthy();
    });

    it('shows logout option when user is logged in', async () => {
        const { getByTestId, getByText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <HamburgerMenu {...mockProps} />
            </ThemeContext.Provider>
        );

        fireEvent.press(getByTestId('hamburger-button'));

        expect(getByText('auth.logout')).toBeTruthy();
    });

    it('shows login option when user is logged out', async () => {
        const { getByTestId, getByText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <HamburgerMenu {...mockProps} user={null} />
            </ThemeContext.Provider>
        );

        fireEvent.press(getByTestId('hamburger-button'));

        expect(getByText('auth.login')).toBeTruthy();
    });

    it('calls logoutUser when logout is pressed and confirmed', async () => {
        // Mock Alert.alert
        jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
            // Execute the destructive button action (Logout)
            buttons.find(b => b.style === 'destructive').onPress();
        });

        logoutUser.mockResolvedValue({ success: true });

        const { getByTestId, getByText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <HamburgerMenu {...mockProps} />
            </ThemeContext.Provider>
        );

        fireEvent.press(getByTestId('hamburger-button'));
        fireEvent.press(getByText('auth.logout'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalled();
            expect(logoutUser).toHaveBeenCalled();
            expect(mockProps.onUserChange).toHaveBeenCalledWith(null);
        });
    });

    it('toggles theme', async () => {
        const { getByTestId, getByText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <HamburgerMenu {...mockProps} />
            </ThemeContext.Provider>
        );

        fireEvent.press(getByTestId('hamburger-button'));
        fireEvent.press(getByText('hamburgerMenu.lightTheme'));

        expect(mockTheme.toggleTheme).toHaveBeenCalled();
    });
});
