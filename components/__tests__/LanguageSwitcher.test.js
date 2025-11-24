import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Mock translation
jest.mock('react-i18next', () => ({
    useTranslation: jest.fn(),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('LanguageSwitcher', () => {
    const mockChangeLanguage = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useTranslation.mockReturnValue({
            t: (key) => key,
            i18n: {
                language: 'tr',
                changeLanguage: mockChangeLanguage,
            },
        });
    });

    it('renders correctly with current language flag', () => {
        const { getByText } = render(<LanguageSwitcher />);
        expect(getByText('🇹🇷')).toBeTruthy();
    });

    it('opens modal on press', () => {
        const { getByText, queryByText } = render(<LanguageSwitcher />);

        // Modal content should be hidden or not interactable initially (depending on implementation details of Modal in test env)
        // But here we just check if we can press the button
        const button = getByText('🇹🇷');
        fireEvent.press(button);

        // Check if modal content appears
        expect(getByText('Dil Seç / Choose Language')).toBeTruthy();
    });

    it('changes language when option selected', () => {
        const { getByText } = render(<LanguageSwitcher />);

        // Open modal
        fireEvent.press(getByText('🇹🇷'));

        // Select English
        fireEvent.press(getByText('English'));

        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });
});
