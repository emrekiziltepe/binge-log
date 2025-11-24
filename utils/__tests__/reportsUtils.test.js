import { formatActivityDetail } from '../reportsUtils';

describe('reportsUtils', () => {
    const mockT = (key, params) => {
        if (key === 'activity.season') return 'Season';
        if (key === 'activity.episode') return 'Episode';
        if (key === 'activity.pagesCount') return `${params.pages} pages`;
        return key;
    };

    describe('formatActivityDetail', () => {
        it('returns empty string for null activity', () => {
            expect(formatActivityDetail(null, mockT)).toBe('');
        });

        it('formats book detail correctly', () => {
            const activity = { type: 'book', detail: '150' };
            expect(formatActivityDetail(activity, mockT)).toBe('150 pages');
        });

        it('formats series detail with single episode', () => {
            const activity = { type: 'series', detail: '1,5' }; // Season 1, Episode 5
            expect(formatActivityDetail(activity, mockT)).toBe('Season 1, Episode: 5');
        });

        it('formats series detail with multiple episodes', () => {
            const activity = { type: 'series', detail: '1,5,6,7' };
            expect(formatActivityDetail(activity, mockT)).toBe('Season 1, Episode: 5-7');
        });

        it('formats series detail with non-consecutive episodes', () => {
            const activity = { type: 'series', detail: '1,5,7' };
            expect(formatActivityDetail(activity, mockT)).toBe('Season 1, Episode: 5, 7');
        });

        it('formats other activity types', () => {
            const activity = { type: 'movie', detail: 'Some detail' };
            expect(formatActivityDetail(activity, mockT)).toBe('Some detail');
        });
    });
});
