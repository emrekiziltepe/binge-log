import { renderHook, act } from '@testing-library/react-native';
import { useDateNavigation } from '../useDateNavigation';

describe('useDateNavigation', () => {
  const mockOnDateChange = jest.fn((fn) => {
    if (typeof fn === 'function') {
      return fn(new Date(2024, 0, 15));
    }
    return new Date(2024, 0, 15);
  });
  const mockT = (key) => key;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial date picker state', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    expect(result.current.showDatePicker).toBe(false);
    expect(result.current.showYearPicker).toBe(false);
    expect(result.current.showMonthPicker).toBe(false);
    expect(result.current.selectedYear).toBe(new Date().getFullYear());
    expect(result.current.selectedMonth).toBe(new Date().getMonth());
  });

  it('opens date picker and sets selected year/month', () => {
    const currentDate = new Date(2024, 5, 15); // June 2024
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.openDatePicker();
    });

    expect(result.current.showDatePicker).toBe(true);
    expect(result.current.selectedYear).toBe(2024);
    expect(result.current.selectedMonth).toBe(5);
  });

  it('selects date and closes picker', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.setShowDatePicker(true);
    });

    const newDate = new Date(2024, 2, 20);
    act(() => {
      result.current.selectDate(newDate);
    });

    expect(result.current.showDatePicker).toBe(false);
    expect(mockOnDateChange).toHaveBeenCalled();
  });

  it('handles year selection', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.setShowYearPicker(true);
      result.current.handleYearSelect(2025);
    });

    expect(result.current.selectedYear).toBe(2025);
    expect(result.current.showYearPicker).toBe(false);
  });

  it('handles month selection', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.setShowMonthPicker(true);
      result.current.handleMonthSelect(5);
    });

    expect(result.current.selectedMonth).toBe(5);
    expect(result.current.showMonthPicker).toBe(false);
  });

  it('goes to today', () => {
    const currentDate = new Date(2024, 5, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.setShowDatePicker(true);
      result.current.goToToday();
    });

    expect(result.current.showDatePicker).toBe(false);
    expect(mockOnDateChange).toHaveBeenCalled();
  });

  it('navigates date by direction', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.navigateDate(1); // Next day
    });

    expect(mockOnDateChange).toHaveBeenCalled();
  });

  it('generates calendar days', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    // Use default selected year/month
    const days = result.current.generateCalendarDays();
    expect(days).toBeDefined();
    expect(Array.isArray(days)).toBe(true);
    expect(days.length).toBe(42); // 6 weeks * 7 days
  });

  it('generates year options', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    const years = result.current.generateYearOptions();
    expect(Array.isArray(years)).toBe(true);
    expect(years.length).toBe(16); // Last 10 + current + next 5
    expect(years).toContain(new Date().getFullYear());
  });

  it('generates month options', () => {
    const currentDate = new Date(2024, 0, 15);
    const mockTWithMonths = (key) => {
      if (key.startsWith('datePicker.months.')) {
        return key.replace('datePicker.months.', '');
      }
      return key;
    };
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockTWithMonths)
    );

    const months = result.current.generateMonthOptions();
    expect(Array.isArray(months)).toBe(true);
    expect(months.length).toBe(12);
  });

  it('provides date swipe responder', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    expect(result.current.dateSwipeResponder).toBeDefined();
    // PanResponder is created, we just verify it exists
  });

  it('provides scroll handlers', () => {
    const currentDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    expect(typeof result.current.handleScrollBeginDrag).toBe('function');
    expect(typeof result.current.handleScrollEndDrag).toBe('function');
  });

  it('updates selected year and month when opening picker', () => {
    const currentDate = new Date(2024, 5, 15);
    const { result } = renderHook(() => 
      useDateNavigation(currentDate, mockOnDateChange, mockT)
    );

    act(() => {
      result.current.openDatePicker();
    });

    expect(result.current.selectedYear).toBe(2024);
    expect(result.current.selectedMonth).toBe(5);
  });
});

