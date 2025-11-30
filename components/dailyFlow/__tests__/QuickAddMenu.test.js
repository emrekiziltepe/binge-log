import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuickAddMenu from '../QuickAddMenu';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

// Mock i18n to prevent initialization errors
jest.mock('../../../i18n', () => {
    return {
        __esModule: true,
        default: {
            language: 'en',
            changeLanguage: jest.fn(),
        },
        changeLanguage: jest.fn(),
    };
});

describe('QuickAddMenu', () => {
    const mockCategories = {
        movie: { name: 'Movie', emoji: '🎬' },
        series: { name: 'Series', emoji: '📺' },
    };

    const mockColors = {
        modalBackground: '#fff',
        modalContent: '#fff',
        text: '#000',
        textSecondary: '#666',
        surfaceSecondary: '#eee',
    };

    const mockRecentActivities = [
        { id: '1', title: 'Movie 1', type: 'movie', detail: 'Duration' },
        { id: '2', title: 'Series 1', type: 'series', detail: 'S1, E1' },
    ];

    const defaultProps = {
        visible: true,
        recentActivities: mockRecentActivities,
        CATEGORIES: mockCategories,
        activities: [],
        colors: mockColors,
        currentDate: new Date(),
        onClose: jest.fn(),
        onActivityAdded: jest.fn(),
        onSaveRecentActivity: jest.fn(),
        onOpenAddModal: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly when visible', () => {
        const { getByText } = render(<QuickAddMenu {...defaultProps} />);
        expect(getByText('activity.recentActivities')).toBeTruthy();
        expect(getByText('Movie 1')).toBeTruthy();
        expect(getByText('Series 1')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<QuickAddMenu {...defaultProps} visible={false} />);
        expect(queryByText('activity.recentActivities')).toBeNull();
    });

    it('does not render when no recent activities', () => {
        const { queryByText } = render(<QuickAddMenu {...defaultProps} recentActivities={[]} />);
        expect(queryByText('activity.recentActivities')).toBeNull();
    });

    it('calls onOpenAddModal and onClose when activity clicked', () => {
        const { getByTestId } = render(<QuickAddMenu {...defaultProps} />);
        fireEvent.press(getByTestId('quick-add-item-0')); // Movie 1

        expect(defaultProps.onOpenAddModal).toHaveBeenCalledWith(mockRecentActivities[0]);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onOpenAddModal for all activity types', () => {
        const { getByTestId } = render(<QuickAddMenu {...defaultProps} />);
        fireEvent.press(getByTestId('quick-add-item-1')); // Series 1

        expect(defaultProps.onOpenAddModal).toHaveBeenCalledWith(mockRecentActivities[1]);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when overlay pressed', () => {
        const { getByTestId } = render(<QuickAddMenu {...defaultProps} />);
        fireEvent.press(getByTestId('quick-add-overlay'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('shows only first 3 recent activities', () => {
        const extendedCategories = {
            ...mockCategories,
            book: { name: 'Book', emoji: '📚' },
            game: { name: 'Game', emoji: '🎮' },
        };
        const manyActivities = [
            { id: '1', title: 'Activity 1', type: 'movie' },
            { id: '2', title: 'Activity 2', type: 'series' },
            { id: '3', title: 'Activity 3', type: 'book' },
            { id: '4', title: 'Activity 4', type: 'game' },
        ];
        const { getByText, queryByText } = render(
            <QuickAddMenu {...defaultProps} recentActivities={manyActivities} CATEGORIES={extendedCategories} />
        );
        
        expect(getByText('Activity 1')).toBeTruthy();
        expect(getByText('Activity 2')).toBeTruthy();
        expect(getByText('Activity 3')).toBeTruthy();
        expect(queryByText('Activity 4')).toBeNull();
    });
});
