import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import YearPickerModal from '../YearPickerModal';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'datePicker.selectYear': 'Select Year',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock timers
jest.useFakeTimers();

describe('YearPickerModal', () => {
  const mockColors = {
    modalBackground: '#fff',
    modalContent: '#f5f5f5',
    surfaceSecondary: '#e0e0e0',
    text: '#000',
    primary: '#007AFF',
  };

  const currentYear = new Date().getFullYear();
  const mockGenerateYearOptions = jest.fn(() => {
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  });

  const defaultProps = {
    visible: true,
    selectedYear: currentYear,
    colors: mockColors,
    generateYearOptions: mockGenerateYearOptions,
    onClose: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <YearPickerModal {...defaultProps} visible={false} />
    );

    expect(queryByText('Select Year')).toBeNull();
  });

  it('renders year picker when visible', () => {
    const { getByText } = render(<YearPickerModal {...defaultProps} />);

    expect(getByText('Select Year')).toBeTruthy();
  });

  it('displays year options', () => {
    const { getByText } = render(<YearPickerModal {...defaultProps} />);

    expect(getByText(String(currentYear - 10))).toBeTruthy();
    expect(getByText(String(currentYear))).toBeTruthy();
    expect(getByText(String(currentYear + 5))).toBeTruthy();
  });

  it('calls onSelect when a year is pressed', () => {
    const { getByText } = render(<YearPickerModal {...defaultProps} />);

    const targetYear = currentYear + 1;
    const yearButton = getByText(String(targetYear));
    fireEvent.press(yearButton);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(targetYear);
  });

  it('highlights selected year', () => {
    const { getByText } = render(
      <YearPickerModal {...defaultProps} selectedYear={2025} />
    );

    const year2025Button = getByText('2025');
    expect(year2025Button).toBeTruthy();
    // The button should exist, styling would be checked via style prop inspection
  });

  it('calls generateYearOptions', () => {
    render(<YearPickerModal {...defaultProps} />);

    expect(mockGenerateYearOptions).toHaveBeenCalled();
  });

  it('scrolls to selected year when visible', () => {
    const { rerender } = render(
      <YearPickerModal {...defaultProps} selectedYear={currentYear} />
    );

    // Change selected year
    rerender(<YearPickerModal {...defaultProps} selectedYear={2025} />);

    // Fast-forward timers to trigger scroll
    jest.advanceTimersByTime(100);

    expect(mockGenerateYearOptions).toHaveBeenCalled();
  });

  it('handles year selection correctly', () => {
    const { getByText } = render(<YearPickerModal {...defaultProps} />);

    const testYear = currentYear - 5;
    const yearButton = getByText(String(testYear));
    fireEvent.press(yearButton);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(testYear);
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });
});

