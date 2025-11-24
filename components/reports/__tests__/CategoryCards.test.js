import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryCards from '../CategoryCards';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('CategoryCards', () => {
    const mockColors = {
        card: '#fff',
        text: '#000',
        textSecondary: '#666',
        primary: 'blue',
        successLight: '#e6fffa',
        surfaceSecondary: '#eee',
    };

    const mockNavigation = {
        navigate: jest.fn(),
    };

    const mockCategoryData = {
        book: {
            count: 5,
            categoryInfo: { name: 'Books', emoji: '📚' },
            groupedActivities: {
                'Book 1': {
                    name: 'Book 1',
                    count: 3,
                    details: ['100', '50', '25'],
                    activities: [],
                },
            },
        },
    };

    it('renders empty state when no data', () => {
        const { getByText } = render(
            <CategoryCards
                categoryData={{}}
                viewMode="weekly"
                colors={mockColors}
                navigation={mockNavigation}
            />
        );
        // The text is split, so we need to check for both parts
        expect(getByText(/statistics.thisWeek/)).toBeTruthy();
        expect(getByText(/statistics.noActivitiesThisPeriod/)).toBeTruthy();
    });

    it('renders category cards when data exists', () => {
        const { getByText } = render(
            <CategoryCards
                categoryData={mockCategoryData}
                viewMode="weekly"
                colors={mockColors}
                navigation={mockNavigation}
            />
        );
        expect(getByText('Books')).toBeTruthy();
    });

    it('navigates to Daily when button pressed in empty state', () => {
        const { getByText } = render(
            <CategoryCards
                categoryData={{}}
                viewMode="weekly"
                colors={mockColors}
                navigation={mockNavigation}
            />
        );
        fireEvent.press(getByText('dailyFlow.goToDailyFlow'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Daily');
    });
});
