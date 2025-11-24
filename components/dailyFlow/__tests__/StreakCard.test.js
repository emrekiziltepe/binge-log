import React from 'react';
import { render } from '@testing-library/react-native';
import StreakCard from '../StreakCard';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('StreakCard', () => {
    const mockColors = {
        card: '#fff',
        text: '#000',
        textSecondary: '#666',
    };

    it('renders correctly with streak', () => {
        const { getByText } = render(
            <StreakCard colors={mockColors} currentStreak={7} longestStreak={10} />
        );
        expect(getByText(/🔥/)).toBeTruthy();
        expect(getByText(/7/)).toBeTruthy();
    });

    it('renders null when zero streak', () => {
        const { toJSON } = render(
            <StreakCard colors={mockColors} currentStreak={0} longestStreak={0} />
        );
        expect(toJSON()).toBeNull();
    });
});
