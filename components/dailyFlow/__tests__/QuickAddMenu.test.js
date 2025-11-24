import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuickAddMenu from '../QuickAddMenu';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

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
        onClose: jest.fn(),
        onActivityAdded: jest.fn(),
        onSaveRecentActivity: jest.fn(),
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

    it('calls onActivityAdded when simple activity clicked', () => {
        const { getByTestId } = render(<QuickAddMenu {...defaultProps} />);
        fireEvent.press(getByTestId('quick-add-item-0')); // Movie 1

        expect(defaultProps.onActivityAdded).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('shows Alert.prompt when complex activity clicked', () => {
        jest.spyOn(Alert, 'prompt');
        const { getByTestId } = render(<QuickAddMenu {...defaultProps} />);
        fireEvent.press(getByTestId('quick-add-item-1')); // Series 1

        expect(Alert.prompt).toHaveBeenCalled();
    });

    it('calls onClose when overlay pressed', () => {
        const { getByTestId } = render(<QuickAddMenu {...defaultProps} />);
        fireEvent.press(getByTestId('quick-add-overlay'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
