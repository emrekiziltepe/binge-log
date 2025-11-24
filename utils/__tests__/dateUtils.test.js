import {
    formatDate,
    getWeekStart,
    formatWeek,
    formatMonth,
    formatYear,
    getDaysInMonth,
    getWeeksInMonth,
    getDaysInMonthForCalendar,
    isSameDay,
    getStartOfDay,
    getEndOfDay,
    formatLocalDate,
} from '../dateUtils';

// Mock i18n
jest.mock('../../i18n', () => ({
    language: 'en-US',
}));

describe('dateUtils', () => {
    const testDate = new Date('2024-01-15T12:00:00Z'); // Monday

    describe('formatDate', () => {
        it('formats date correctly for default locale', () => {
            // Note: Actual output depends on the environment's locale implementation
            // We check if it contains expected parts
            const result = formatDate(testDate, 'en-US');
            expect(result).toContain('2024');
            expect(result).toContain('January');
            expect(result).toContain('15');
        });
    });

    describe('getWeekStart', () => {
        it('returns Monday as start of week', () => {
            const wednesday = new Date('2024-01-17T12:00:00Z');
            const monday = getWeekStart(wednesday);
            expect(monday.getDay()).toBe(1); // 1 is Monday
            expect(monday.getDate()).toBe(15);
        });

        it('handles Sunday correctly (returns previous Monday)', () => {
            const sunday = new Date('2024-01-21T12:00:00Z');
            const monday = getWeekStart(sunday);
            expect(monday.getDay()).toBe(1);
            expect(monday.getDate()).toBe(15);
        });
    });

    describe('formatWeek', () => {
        it('formats week range correctly', () => {
            // Mocking getWeekStart to ensure consistency
            const result = formatWeek(testDate);
            expect(result).toContain('Jan 15');
            expect(result).toContain('Jan 21');
            expect(result).toContain('2024');
        });
    });

    describe('formatMonth', () => {
        it('formats month correctly', () => {
            const result = formatMonth(testDate);
            expect(result).toContain('January');
            expect(result).toContain('2024');
        });
    });

    describe('formatYear', () => {
        it('formats year correctly', () => {
            const result = formatYear(testDate);
            expect(result).toBe('2024');
        });
    });

    describe('getDaysInMonth', () => {
        it('returns correct array for January 2024', () => {
            // Jan 1 2024 is Monday
            const days = getDaysInMonth(testDate);
            expect(days.length).toBe(31); // 0 padding + 31 days
            expect(days[0]).toBe(1);
            expect(days[30]).toBe(31);
        });

        it('handles padding correctly', () => {
            // Feb 2024 starts on Thursday
            const febDate = new Date('2024-02-15T12:00:00Z');
            const days = getDaysInMonth(febDate);
            // Mon, Tue, Wed are padded (3 nulls)
            expect(days[0]).toBeNull();
            expect(days[1]).toBeNull();
            expect(days[2]).toBeNull();
            expect(days[3]).toBe(1);
        });
    });

    describe('getWeeksInMonth', () => {
        it('groups days into weeks', () => {
            const weeks = getWeeksInMonth(testDate);
            expect(weeks.length).toBeGreaterThanOrEqual(5);
            expect(weeks[0].length).toBe(7);
        });
    });

    describe('getDaysInMonthForCalendar', () => {
        it('returns Date objects', () => {
            const days = getDaysInMonthForCalendar(2024, 0); // January
            expect(days[0]).toBeInstanceOf(Date);
            expect(days[0].getDate()).toBe(1);
        });
    });

    describe('isSameDay', () => {
        it('returns true for same day', () => {
            const d1 = new Date('2024-01-15T10:00:00');
            const d2 = new Date('2024-01-15T20:00:00');
            expect(isSameDay(d1, d2)).toBe(true);
        });

        it('returns false for different days', () => {
            const d1 = new Date('2024-01-15T10:00:00');
            const d2 = new Date('2024-01-16T10:00:00');
            expect(isSameDay(d1, d2)).toBe(false);
        });
    });

    describe('getStartOfDay', () => {
        it('returns 00:00:00', () => {
            const start = getStartOfDay(testDate);
            expect(start.getHours()).toBe(0);
            expect(start.getMinutes()).toBe(0);
            expect(start.getSeconds()).toBe(0);
            expect(start.getMilliseconds()).toBe(0);
        });
    });

    describe('getEndOfDay', () => {
        it('returns 23:59:59', () => {
            const end = getEndOfDay(testDate);
            expect(end.getHours()).toBe(23);
            expect(end.getMinutes()).toBe(59);
            expect(end.getSeconds()).toBe(59);
            expect(end.getMilliseconds()).toBe(999);
        });
    });

    describe('formatLocalDate', () => {
        it('formats as YYYY-MM-DD', () => {
            const result = formatLocalDate(testDate);
            expect(result).toBe('2024-01-15');
        });
    });
});
