import { renderHook } from '@testing-library/react-native';
import { useWeeklyCategoryData, useGoalProgress } from '../useReportsData';

describe('useReportsData', () => {
    const mockT = (key) => key;

    describe('useWeeklyCategoryData', () => {
        it('aggregates weekly activities correctly', () => {
            const today = new Date();
            const weeklyData = {
                '2024-01-01': {
                    activities: [
                        { type: 'book', title: 'Book 1', timestamp: today.toISOString() },
                        { type: 'book', title: 'Book 1', timestamp: today.toISOString() },
                        { type: 'movie', title: 'Movie 1', timestamp: today.toISOString() },
                    ],
                },
            };

            const { result } = renderHook(() => useWeeklyCategoryData(weeklyData, mockT));

            expect(result.current.book.count).toBe(2);
            expect(result.current.movie.count).toBe(1);
        });
    });

    describe('useGoalProgress', () => {
        it('calculates progress correctly for count-based goals', () => {
            const category = 'movie';
            const period = 'weekly';
            const goals = { weekly: { movie: 5 } };
            const categoryData = {
                movie: { count: 2 },
            };

            const { result } = renderHook(() => useGoalProgress(category, period, goals, categoryData));

            expect(result.current.current).toBe(2);
            expect(result.current.goal).toBe(5);
            expect(result.current.progress).toBe(40);
        });

        it('calculates progress correctly for detail-based goals (book pages)', () => {
            const category = 'book';
            const period = 'weekly';
            const goals = { weekly: { book: 100 } };
            const categoryData = {
                book: {
                    groupedActivities: {
                        'Book 1': { details: ['50'] },
                        'Book 2': { details: ['20'] },
                    },
                },
            };

            const { result } = renderHook(() => useGoalProgress(category, period, goals, categoryData));

            expect(result.current.current).toBe(70);
            expect(result.current.progress).toBe(70);
        });
    });
});
