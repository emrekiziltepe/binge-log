import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SimpleBarChart from '../SimpleBarChart';
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('SimpleBarChart', () => {
    const mockColors = {
        card: '#ffffff',
        text: '#000000',
        textSecondary: '#666666',
        textTertiary: '#999999',
        primary: '#blue',
    };

    const mockData = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
    ];
    const mockLabels = ['A', 'B', 'C'];

    const renderWithTheme = (component) => {
        return render(
            <ThemeContext.Provider value={{ colors: mockColors }}>
                {component}
            </ThemeContext.Provider>
        );
    };

    it('renders correctly', () => {
        const { getByText } = renderWithTheme(
            <SimpleBarChart data={mockData} labels={mockLabels} />
        );
        expect(getByText('📊 Trend Grafiği')).toBeTruthy();
    });

    it('toggles expansion on press', () => {
        const { getByText, queryByText } = renderWithTheme(
            <SimpleBarChart data={mockData} labels={mockLabels} />
        );

        // Initially collapsed (chart content not visible)
        // Note: The implementation conditionally renders the chart container
        expect(queryByText('A')).toBeNull();

        // Press header to expand
        fireEvent.press(getByText('📊 Trend Grafiği'));

        // Now visible
        expect(getByText('A')).toBeTruthy();
        expect(getByText('B')).toBeTruthy();
        expect(getByText('C')).toBeTruthy();
    });

    it('displays correct max value', () => {
        const { getByText } = renderWithTheme(
            <SimpleBarChart data={mockData} labels={mockLabels} maxValue={100} />
        );

        fireEvent.press(getByText('📊 Trend Grafiği'));

        expect(getByText('100')).toBeTruthy();
    });
});
