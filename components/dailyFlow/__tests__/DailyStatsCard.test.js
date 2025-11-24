import React from 'react';
import { render } from '@testing-library/react-native';
import DailyStatsCard from '../DailyStatsCard';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('DailyStatsCard', () => {
    const mockColors = {
        card: '#fff',
        text: '#000',
        textSecondary: '#666',
    };

    it('renders correctly with stats', () => {
        const mockCategories = {
            book: { emoji: '📚' },
            movie: { emoji: '🎬' },
        };
        const mockDailyStats = {
            totalActivities: 5,
            categoryCount: { book: 3, movie: 2 },
        };

        const { getByText } = render(
            <DailyStatsCard colors={mockColors} dailyStats={mockDailyStats} CATEGORIES={mockCategories} />
        );
        expect(getByText(/📊/)).toBeTruthy();
        expect(getByText(/5/)).toBeTruthy();
    });

    it('renders null when no activities', () => {
        const mockDailyStats = {
            totalActivities: 0,
            categoryCount: {},
        };
        const { toJSON } = render(
            <DailyStatsCard colors={mockColors} dailyStats={mockDailyStats} CATEGORIES={{}} />
        );
        expect(toJSON()).toBeNull();
    });
});
