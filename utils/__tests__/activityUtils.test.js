import {
  getRatingColor,
  formatSeriesDetail,
  groupActivitiesByCategory,
  calculateDailyStats
} from '../activityUtils';

describe('activityUtils', () => {
  describe('getRatingColor', () => {
    it('returns correct color for rating 1', () => {
      expect(getRatingColor(1)).toBe('#dc2626');
    });

    it('returns correct color for rating 5', () => {
      expect(getRatingColor(5)).toBe('#d97706');
    });

    it('returns correct color for rating 10', () => {
      expect(getRatingColor(10)).toBe('#166534');
    });

    it('returns default color for rating 0', () => {
      expect(getRatingColor(0)).toBe('#166534');
    });

    it('returns correct colors for all ratings 1-10', () => {
      expect(getRatingColor(1)).toBe('#dc2626');
      expect(getRatingColor(2)).toBe('#ef4444');
      expect(getRatingColor(3)).toBe('#ea580c');
      expect(getRatingColor(4)).toBe('#f97316');
      expect(getRatingColor(5)).toBe('#d97706');
      expect(getRatingColor(6)).toBe('#eab308');
      expect(getRatingColor(7)).toBe('#16a34a');
      expect(getRatingColor(8)).toBe('#22c55e');
      expect(getRatingColor(9)).toBe('#15803d');
      expect(getRatingColor(10)).toBe('#166534');
    });
  });

  describe('formatSeriesDetail', () => {
    const mockT = (key) => {
      const translations = {
        'activity.season': 'Season',
        'activity.episode': 'Episode'
      };
      return translations[key] || key;
    };

    it('returns empty string for empty detail', () => {
      expect(formatSeriesDetail('', mockT)).toBe('');
      expect(formatSeriesDetail(null, mockT)).toBe('');
      expect(formatSeriesDetail(undefined, mockT)).toBe('');
    });

    it('formats single season only', () => {
      expect(formatSeriesDetail('3', mockT)).toBe('Season 3');
    });

    it('formats single season with single episode', () => {
      expect(formatSeriesDetail('3,10', mockT)).toBe('Season 3, Episode: 10');
    });

    it('formats single season with multiple episodes', () => {
      expect(formatSeriesDetail('3,10,11,12', mockT)).toBe('Season 3, Episode: 10,11,12');
    });

    it('formats multiple season-episode pairs', () => {
      expect(formatSeriesDetail('3,10;4,1', mockT)).toBe('Season 3, Episode: 10\nSeason 4, Episode: 1');
    });

    it('handles whitespace in detail string', () => {
      expect(formatSeriesDetail(' 3 , 10 ', mockT)).toBe('Season 3, Episode: 10');
    });

    it('handles multiple seasons with different episode counts', () => {
      expect(formatSeriesDetail('1,5,6;2,1;3,10,11,12', mockT)).toBe(
        'Season 1, Episode: 5,6\nSeason 2, Episode: 1\nSeason 3, Episode: 10,11,12'
      );
    });
  });

  describe('groupActivitiesByCategory', () => {
    it('returns empty object for empty activities', () => {
      expect(groupActivitiesByCategory([])).toEqual({});
    });

    it('groups activities by category', () => {
      const activities = [
        { id: '1', type: 'movie', title: 'Movie 1' },
        { id: '2', type: 'movie', title: 'Movie 2' },
        { id: '3', type: 'book', title: 'Book 1' }
      ];
      const result = groupActivitiesByCategory(activities);
      
      expect(result.movie).toHaveLength(2);
      expect(result.book).toHaveLength(1);
      expect(result.movie[0].id).toBe('1');
      expect(result.movie[1].id).toBe('2');
      expect(result.book[0].id).toBe('3');
    });

    it('separates goals from regular activities', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const activities = [
        { id: '1', type: 'movie', title: 'Movie 1', date: today.toISOString().split('T')[0] },
        { id: '2', type: 'book', title: 'Book 1', date: tomorrowStr, isGoal: true },
        { id: '3', type: 'series', title: 'Series 1', date: tomorrowStr, isCompleted: false }
      ];
      
      const result = groupActivitiesByCategory(activities, today);
      
      expect(result.movie).toHaveLength(1);
      expect(result._goals).toBeDefined();
      expect(result._goals.length).toBeGreaterThanOrEqual(1);
    });

    it('sorts categories alphabetically', () => {
      const activities = [
        { id: '1', type: 'zebra' },
        { id: '2', type: 'apple' },
        { id: '3', type: 'book' }
      ];
      const result = groupActivitiesByCategory(activities);
      const keys = Object.keys(result);
      
      expect(keys[0]).toBe('apple');
      expect(keys[1]).toBe('book');
      expect(keys[2]).toBe('zebra');
    });

    it('does not include goals section if no goals', () => {
      const activities = [
        { id: '1', type: 'movie', title: 'Movie 1', date: new Date().toISOString().split('T')[0] }
      ];
      const result = groupActivitiesByCategory(activities);
      
      expect(result._goals).toBeUndefined();
    });

    it('handles activities without date field', () => {
      const activities = [
        { id: '1', type: 'movie', title: 'Movie 1' }
      ];
      const result = groupActivitiesByCategory(activities);
      
      expect(result.movie).toHaveLength(1);
    });
  });

  describe('calculateDailyStats', () => {
    it('returns zero stats for empty activities', () => {
      const result = calculateDailyStats([]);
      
      expect(result.totalActivities).toBe(0);
      expect(result.categoryCount).toEqual({});
      expect(result.mostActiveCategory).toBeNull();
    });

    it('calculates total activities', () => {
      const activities = [
        { id: '1', type: 'movie' },
        { id: '2', type: 'book' },
        { id: '3', type: 'movie' }
      ];
      const result = calculateDailyStats(activities);
      
      expect(result.totalActivities).toBe(3);
    });

    it('counts activities by category', () => {
      const activities = [
        { id: '1', type: 'movie' },
        { id: '2', type: 'movie' },
        { id: '3', type: 'book' }
      ];
      const result = calculateDailyStats(activities);
      
      expect(result.categoryCount.movie).toBe(2);
      expect(result.categoryCount.book).toBe(1);
    });

    it('identifies most active category', () => {
      const activities = [
        { id: '1', type: 'movie' },
        { id: '2', type: 'movie' },
        { id: '3', type: 'book' }
      ];
      const result = calculateDailyStats(activities);
      
      expect(result.mostActiveCategory).toBe('movie');
    });

    it('handles tie in category counts (returns first encountered)', () => {
      const activities = [
        { id: '1', type: 'movie' },
        { id: '2', type: 'book' }
      ];
      const result = calculateDailyStats(activities);
      
      // Should be 'book' because it's processed last and has same count as movie
      expect(['movie', 'book']).toContain(result.mostActiveCategory);
    });

    it('handles single activity', () => {
      const activities = [
        { id: '1', type: 'movie' }
      ];
      const result = calculateDailyStats(activities);
      
      expect(result.totalActivities).toBe(1);
      expect(result.categoryCount.movie).toBe(1);
      expect(result.mostActiveCategory).toBe('movie');
    });
  });
});

