import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GoalModal from '../GoalModal';
import goalService from '../../services/goalService';
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../services/goalService', () => ({
    getGoals: jest.fn(),
    setCategoryGoal: jest.fn(),
    deleteCategoryGoal: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('GoalModal', () => {
    const mockTheme = {
        colors: {
            modalBackground: '#fff',
            modalContent: '#fff',
            text: '#000',
            textSecondary: '#666',
            primary: 'blue',
            surfaceSecondary: '#eee',
            inputBackground: '#f0f0f0',
            inputBorder: '#ccc',
            placeholder: '#999',
            error: 'red',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        goalService.getGoals.mockResolvedValue({
            weekly: { book: 10 },
            monthly: {},
        });
    });

    it('renders correctly when visible', async () => {
        const { getByText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <GoalModal visible={true} onClose={() => { }} />
            </ThemeContext.Provider>
        );

        await waitFor(() => {
            expect(getByText('hamburgerMenu.goals')).toBeTruthy();
        });
    });

    it('loads goals on mount', async () => {
        render(
            <ThemeContext.Provider value={mockTheme}>
                <GoalModal visible={true} onClose={() => { }} />
            </ThemeContext.Provider>
        );

        await waitFor(() => {
            expect(goalService.getGoals).toHaveBeenCalled();
        });
    });

    it('saves goal when save button pressed', async () => {
        const onClose = jest.fn();
        const { getByText, getByPlaceholderText } = render(
            <ThemeContext.Provider value={mockTheme}>
                <GoalModal visible={true} onClose={onClose} />
            </ThemeContext.Provider>
        );

        await waitFor(() => expect(goalService.getGoals).toHaveBeenCalled());

        // Enter a value
        const input = getByPlaceholderText('goals.enterValue');
        fireEvent.changeText(input, '20');

        // Save
        fireEvent.press(getByText('common.save'));

        await waitFor(() => {
            expect(goalService.setCategoryGoal).toHaveBeenCalledWith('weekly', 'book', 20);
            expect(onClose).toHaveBeenCalled();
        });
    });
});
