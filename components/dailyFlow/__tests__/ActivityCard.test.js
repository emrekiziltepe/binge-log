import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActivityCard from '../ActivityCard';
import { Animated } from 'react-native';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('../../../i18n', () => ({
    t: (key) => key,
    language: 'en',
}));

jest.mock('../../icons/TrashIcon', () => 'TrashIcon');

describe('ActivityCard', () => {
    const mockActivity = {
        id: '1',
        title: 'Test Activity',
        type: 'book',
        detail: '100',
        isCompleted: false,
        rating: 0,
        timestamp: new Date().toISOString(),
    };

    const mockCategory = {
        color: 'blue',
        detailLabel: 'Pages',
    };

    const mockProps = {
        activity: mockActivity,
        category: mockCategory,
        isSwiped: false,
        isDeleting: false,
        slideAnimation: new Animated.Value(0),
        colors: {
            card: '#fff',
            text: '#000',
            textSecondary: '#666',
            error: 'red',
            success: 'green',
            successLight: '#e6fffa',
        },
        formatSeriesDetail: jest.fn(),
        getRatingColor: jest.fn(),
        onEdit: jest.fn(),
        onSwipeDelete: jest.fn(),
        onLongPress: jest.fn(),
        onToggleSwipe: jest.fn(),
    };

    it('renders correctly', () => {
        const { getByText } = render(<ActivityCard {...mockProps} />);
        expect(getByText('Test Activity')).toBeTruthy();
        expect(getByText('Pages: 100')).toBeTruthy();
    });

    it('calls onEdit when pressed', () => {
        const { getByText } = render(<ActivityCard {...mockProps} />);
        fireEvent.press(getByText('Test Activity'));
        expect(mockProps.onEdit).toHaveBeenCalled();
    });

    it('shows completion icon when completed', () => {
        const completedActivity = { ...mockActivity, isCompleted: true };
        const { getByText } = render(<ActivityCard {...mockProps} activity={completedActivity} />);
        expect(getByText('✓')).toBeTruthy();
    });
});
