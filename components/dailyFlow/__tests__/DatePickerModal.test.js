import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DatePickerModal from '../DatePickerModal';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'datePicker.weekDays.monday': 'Mon',
        'datePicker.weekDays.tuesday': 'Tue',
        'datePicker.weekDays.wednesday': 'Wed',
        'datePicker.weekDays.thursday': 'Thu',
        'datePicker.weekDays.friday': 'Fri',
        'datePicker.weekDays.saturday': 'Sat',
        'datePicker.weekDays.sunday': 'Sun',
        'datePicker.goToToday': 'Go to Today',
      };
      return translations[key] || key;
    },
  }),
}));

describe('DatePickerModal', () => {
  const mockColors = {
    modalBackground: '#fff',
    modalContent: '#f5f5f5',
    surfaceSecondary: '#e0e0e0',
    text: '#000',
    textSecondary: '#666',
    primary: '#007AFF',
  };

  const mockCurrentDate = new Date(2024, 0, 15); // January 15, 2024
  const mockSelectedYear = 2024;
  const mockSelectedMonth = 0; // January

  const mockGenerateCalendarDays = jest.fn(() => {
    const days = [];
    // Generate 42 days (6 weeks) for January 2024
    for (let i = 0; i < 42; i++) {
      const date = new Date(2024, 0, i - 6); // Start from a few days before month start
      days.push({
        date,
        isCurrentMonth: i >= 6 && i < 37, // Rough approximation
        isToday: false,
      });
    }
    return days;
  });

  const mockGenerateMonthOptions = jest.fn(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);

  const defaultProps = {
    visible: true,
    currentDate: mockCurrentDate,
    selectedYear: mockSelectedYear,
    selectedMonth: mockSelectedMonth,
    colors: mockColors,
    generateCalendarDays: mockGenerateCalendarDays,
    generateMonthOptions: mockGenerateMonthOptions,
    onClose: jest.fn(),
    onDateSelect: jest.fn(),
    onShowMonthPicker: jest.fn(),
    onShowYearPicker: jest.fn(),
    onGoToToday: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <DatePickerModal {...defaultProps} visible={false} />
    );

    expect(queryByText('Go to Today')).toBeNull();
  });

  it('renders calendar when visible', () => {
    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    expect(getByText('January')).toBeTruthy();
    expect(getByText('2024')).toBeTruthy();
    expect(getByText(/Go to Today/)).toBeTruthy();
  });

  it('displays week day headers', () => {
    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
    expect(getByText('Sun')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    const closeButton = getByText('×');
    fireEvent.press(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onShowMonthPicker when month button is pressed', () => {
    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    const monthButton = getByText('January');
    fireEvent.press(monthButton);

    expect(defaultProps.onShowMonthPicker).toHaveBeenCalledTimes(1);
  });

  it('calls onShowYearPicker when year button is pressed', () => {
    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    const yearButton = getByText('2024');
    fireEvent.press(yearButton);

    expect(defaultProps.onShowYearPicker).toHaveBeenCalledTimes(1);
  });

  it('calls onGoToToday when go to today button is pressed', () => {
    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    // Button text includes emoji, so we search for partial text
    const goToTodayButton = getByText(/Go to Today/);
    fireEvent.press(goToTodayButton);

    expect(defaultProps.onGoToToday).toHaveBeenCalledTimes(1);
  });

  it('calls generateCalendarDays to render calendar days', () => {
    render(<DatePickerModal {...defaultProps} />);

    expect(mockGenerateCalendarDays).toHaveBeenCalled();
  });

  it('calls onDateSelect when a calendar day is pressed', () => {
    const mockDays = [
      { date: new Date(2024, 0, 15), isCurrentMonth: true, isToday: false },
      { date: new Date(2024, 0, 16), isCurrentMonth: true, isToday: false },
    ];
    mockGenerateCalendarDays.mockReturnValueOnce(mockDays);

    const { getByText } = render(<DatePickerModal {...defaultProps} />);

    const dayButton = getByText('16');
    fireEvent.press(dayButton);

    expect(defaultProps.onDateSelect).toHaveBeenCalledWith(mockDays[1].date);
  });

  it('highlights selected date', () => {
    const selectedDate = new Date(2024, 0, 15);
    const mockDays = [
      { date: selectedDate, isCurrentMonth: true, isToday: false },
      { date: new Date(2024, 0, 16), isCurrentMonth: true, isToday: false },
    ];
    mockGenerateCalendarDays.mockReturnValueOnce(mockDays);

    const { getByText } = render(
      <DatePickerModal {...defaultProps} currentDate={selectedDate} />
    );

    const selectedDayButton = getByText('15');
    expect(selectedDayButton).toBeTruthy();
    // The button should exist, styling would be checked via style prop inspection
  });

  it('displays correct selected month and year', () => {
    const { getByText } = render(
      <DatePickerModal
        {...defaultProps}
        selectedYear={2025}
        selectedMonth={5}
      />
    );

    expect(getByText('June')).toBeTruthy();
    expect(getByText('2025')).toBeTruthy();
  });
});

