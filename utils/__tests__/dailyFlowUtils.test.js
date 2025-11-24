import * as dailyFlowUtils from '../dailyFlowUtils';
import * as dateUtils from '../dateUtils';

describe('dailyFlowUtils', () => {
    it('re-exports formatDate from dateUtils', () => {
        expect(dailyFlowUtils.formatDate).toBe(dateUtils.formatDate);
    });

    it('re-exports getDaysInMonthForCalendar from dateUtils', () => {
        expect(dailyFlowUtils.getDaysInMonthForCalendar).toBe(dateUtils.getDaysInMonthForCalendar);
    });

    it('re-exports isSameDay from dateUtils', () => {
        expect(dailyFlowUtils.isSameDay).toBe(dateUtils.isSameDay);
    });

    it('re-exports getStartOfDay from dateUtils', () => {
        expect(dailyFlowUtils.getStartOfDay).toBe(dateUtils.getStartOfDay);
    });

    it('re-exports getEndOfDay from dateUtils', () => {
        expect(dailyFlowUtils.getEndOfDay).toBe(dateUtils.getEndOfDay);
    });
});
