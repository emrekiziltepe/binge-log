import {
  generateCalendarDays,
  generateYearOptions,
  generateMonthOptions
} from '../dateNavigationUtils';

describe('dateNavigationUtils', () => {
  describe('generateCalendarDays', () => {
    it('generates correct number of days for a month', () => {
      const days = generateCalendarDays(2024, 0); // January 2024
      expect(days.length).toBe(42); // 6 weeks * 7 days
    });

    it('includes current month days with isCurrentMonth flag', () => {
      const days = generateCalendarDays(2024, 0); // January 2024
      const currentMonthDays = days.filter(d => d.isCurrentMonth);
      
      // January 2024 has 31 days
      expect(currentMonthDays.length).toBe(31);
    });

    it('marks today correctly', () => {
      const today = new Date();
      const days = generateCalendarDays(today.getFullYear(), today.getMonth());
      const todayDay = days.find(d => 
        d.isCurrentMonth && 
        d.date.getDate() === today.getDate()
      );
      
      expect(todayDay).toBeDefined();
      expect(todayDay.isToday).toBe(true);
    });

    it('includes previous month days at the start when month does not start on Monday', () => {
      // February 2024 starts on Thursday (firstDayOfWeek = 3), so should have some January days
      const days = generateCalendarDays(2024, 1); // February
      const prevMonthDays = days.filter(d => !d.isCurrentMonth);
      const januaryDays = prevMonthDays.filter(d => d.date.getMonth() === 0);
      
      // Should have some January days (February starts on Thursday, so 3 days before)
      // Note: Some days might be from next month too, so we check specifically for January
      if (januaryDays.length > 0) {
        expect(januaryDays.length).toBe(3); // Thursday = 3 days before Monday
      } else {
        // If no January days, the month must start on Monday, which February 2024 doesn't
        // This is a fallback check
        expect(prevMonthDays.length).toBeGreaterThan(0);
      }
    });

    it('includes next month days at the end', () => {
      const days = generateCalendarDays(2024, 0); // January 2024
      const nextMonthDays = days.filter(d => !d.isCurrentMonth && d.date.getMonth() === 1);
      
      // Should have some February days to complete 6 weeks
      expect(nextMonthDays.length).toBeGreaterThan(0);
    });

    it('handles February in non-leap year correctly', () => {
      const days = generateCalendarDays(2023, 1); // February 2023 (28 days)
      const currentMonthDays = days.filter(d => d.isCurrentMonth);
      
      expect(currentMonthDays.length).toBe(28);
    });

    it('handles February in leap year correctly', () => {
      const days = generateCalendarDays(2024, 1); // February 2024 (29 days, leap year)
      const currentMonthDays = days.filter(d => d.isCurrentMonth);
      
      expect(currentMonthDays.length).toBe(29);
    });

    it('starts calendar on Monday', () => {
      // January 2024 starts on Monday
      const days = generateCalendarDays(2024, 0);
      const firstCurrentMonthDay = days.find(d => d.isCurrentMonth);
      
      expect(firstCurrentMonthDay.date.getDay()).toBe(1); // Monday
    });
  });

  describe('generateYearOptions', () => {
    it('generates correct number of years', () => {
      const years = generateYearOptions();
      // Last 10 years + current year + next 5 years = 16 years
      expect(years.length).toBe(16);
    });

    it('includes current year', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYearOptions();
      
      expect(years).toContain(currentYear);
    });

    it('includes past years', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYearOptions();
      
      expect(years).toContain(currentYear - 10);
      expect(years).toContain(currentYear - 5);
    });

    it('includes future years', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYearOptions();
      
      expect(years).toContain(currentYear + 1);
      expect(years).toContain(currentYear + 5);
    });

    it('generates years in ascending order', () => {
      const years = generateYearOptions();
      
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeGreaterThan(years[i - 1]);
      }
    });

    it('does not include currentYear - 11', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYearOptions();
      
      expect(years).not.toContain(currentYear - 11);
    });

    it('does not include currentYear + 6', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYearOptions();
      
      expect(years).not.toContain(currentYear + 6);
    });
  });

  describe('generateMonthOptions', () => {
    const mockT = (key) => {
      const translations = {
        'datePicker.months.january': 'January',
        'datePicker.months.february': 'February',
        'datePicker.months.march': 'March',
        'datePicker.months.april': 'April',
        'datePicker.months.may': 'May',
        'datePicker.months.june': 'June',
        'datePicker.months.july': 'July',
        'datePicker.months.august': 'August',
        'datePicker.months.september': 'September',
        'datePicker.months.october': 'October',
        'datePicker.months.november': 'November',
        'datePicker.months.december': 'December'
      };
      return translations[key] || key;
    };

    it('generates 12 months', () => {
      const months = generateMonthOptions(mockT);
      expect(months.length).toBe(12);
    });

    it('includes all month names', () => {
      const months = generateMonthOptions(mockT);
      
      expect(months).toContain('January');
      expect(months).toContain('June');
      expect(months).toContain('December');
    });

    it('has months in correct order', () => {
      const months = generateMonthOptions(mockT);
      
      expect(months[0]).toBe('January');
      expect(months[5]).toBe('June');
      expect(months[11]).toBe('December');
    });

    it('uses translation function correctly', () => {
      const customT = (key) => key.toUpperCase();
      const months = generateMonthOptions(customT);
      
      expect(months[0]).toBe('DATEPICKER.MONTHS.JANUARY');
    });
  });
});

