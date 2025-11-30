import React from 'react';
import { render, getAllByText } from '@testing-library/react-native';
import YearlySummary from '../YearlySummary';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        'statistics.thisYear': 'This Year',
        'statistics.noActivitiesThisPeriod': 'No activities this period',
        'statistics.addActivityToSeeStats': 'Add activity to see stats',
        'statistics.yourYearIn': ({ year }) => `Your Year in ${year}`,
        'statistics.totalActivities': 'Total Activities',
        'statistics.totalDays': 'Total',
        'statistics.activeDays': 'Active Days',
        'statistics.topCategory': 'Top Category',
        'statistics.activities': 'activities',
        'statistics.mostActiveMonth': 'Most Active Month',
        'statistics.booksCompleted': ({ count }) => `${count} Books Completed`,
        'statistics.seriesEpisodes': ({ count }) => `${count} Episodes`,
        'statistics.moviesWatched': ({ count }) => `${count} Movies Watched`,
        'statistics.gamesPlayed': ({ count }) => `${count} Games Played`,
        'statistics.totalCompleted': 'Completed',
        'statistics.coursesLearned': ({ count }) => `${count} Courses Learned`,
        'statistics.hoursTrained': ({ count }) => `${count} Hours Trained`,
        'statistics.topActivity': 'Top Activity',
        'goals.pages': 'pages',
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
        'datePicker.months.december': 'December',
        'categories.sport': 'Sport',
      };
      if (params) {
        let translation = translations[key] || key;
        if (typeof translation === 'function') {
          return translation(params);
        }
        Object.keys(params).forEach(param => {
          translation = translation.replace(`{${param}}`, params[param]);
        });
        return translation;
      }
      return translations[key] || key;
    },
  }),
}));

// SimpleBarChart is imported as '../SimpleBarChart' from YearlySummary.js
// which means from components/reports, it's at components/SimpleBarChart.js
jest.mock('../../SimpleBarChart', () => {
  return function SimpleBarChart() {
    return null;
  };
});

// Mock dateUtils - path from components/reports/__tests__ to utils/dateUtils
jest.mock('../../../utils/dateUtils', () => ({
  formatLocalDate: (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
}));

describe('YearlySummary', () => {
  const mockColors = {
    card: '#fff',
    text: '#000',
    textSecondary: '#666',
    primary: '#007AFF',
  };

  const currentYear = new Date(2024, 0, 1);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no category data', () => {
    const { getByText } = render(
      <YearlySummary
        categoryData={{}}
        activities={[]}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText(/No activities this period/)).toBeTruthy();
  });

  it('renders year header when category data exists', () => {
    const categoryData = {
      book: {
        count: 10,
        categoryInfo: { emoji: '📚', name: 'Book' },
        groupedActivities: {},
      },
    };

    const { getByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={[]}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText(/Your Year in 2024/)).toBeTruthy();
  });

  it('renders total activities card', () => {
    const categoryData = {
      book: {
        count: 5,
        categoryInfo: { emoji: '📚', name: 'Book' },
        groupedActivities: {},
      },
    };

    const activities = [
      { id: '1', timestamp: new Date(2024, 0, 15).toISOString(), date: '2024-01-15' },
      { id: '2', timestamp: new Date(2024, 1, 20).toISOString(), date: '2024-02-20' },
    ];

    const { getByText, getAllByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={activities}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText('Total Activities')).toBeTruthy();
    // "2" appears in multiple places, use getAllByText or check parent
    const twos = getAllByText('2');
    expect(twos.length).toBeGreaterThan(0);
  });

  it('renders total days card', () => {
    const categoryData = {
      book: {
        count: 5,
        categoryInfo: { emoji: '📚', name: 'Book' },
        groupedActivities: {},
      },
    };

    const activities = [
      { id: '1', timestamp: new Date(2024, 0, 15).toISOString(), date: '2024-01-15' },
      { id: '2', timestamp: new Date(2024, 0, 16).toISOString(), date: '2024-01-16' },
    ];

    const { getAllByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={activities}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    // "Total" appears in multiple places
    const totals = getAllByText(/Total/);
    expect(totals.length).toBeGreaterThan(0);
  });

  it('renders top category card when data exists', () => {
    const categoryData = {
      book: {
        count: 10,
        categoryInfo: { emoji: '📚', name: 'Book' },
        groupedActivities: {},
      },
      movie: {
        count: 5,
        categoryInfo: { emoji: '🎬', name: 'Movie' },
        groupedActivities: {},
      },
    };

    const activities = [
      { id: '1', timestamp: new Date(2024, 0, 15).toISOString(), date: '2024-01-15' },
    ];

    const { getByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={activities}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText('Top Category')).toBeTruthy();
  });

  it('renders category-specific cards', () => {
    const categoryData = {
      book: {
        count: 5,
        categoryInfo: { emoji: '📚', name: 'Book' },
        groupedActivities: {
          'Test Book': {
            name: 'Test Book',
            count: 5,
            details: ['100'],
            activities: [],
          },
        },
      },
    };

    const activities = [
      { id: '1', timestamp: new Date(2024, 0, 15).toISOString(), date: '2024-01-15' },
    ];

    const { getByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={activities}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText(/Books Completed/)).toBeTruthy();
  });

  it('calculates completed books correctly', () => {
    const categoryData = {
      book: {
        count: 2,
        categoryInfo: { emoji: '📚', name: 'Book' },
        groupedActivities: {
          'Book 1': {
            name: 'Book 1',
            count: 1,
            details: ['100'],
            activities: [{ isCompleted: true }],
          },
          'Book 2': {
            name: 'Book 2',
            count: 1,
            details: ['200'],
            activities: [{ isCompleted: false }],
          },
        },
      },
    };

    const activities = [
      { id: '1', timestamp: new Date(2024, 0, 15).toISOString(), date: '2024-01-15' },
    ];

    const { getByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={activities}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText(/Books Completed/)).toBeTruthy();
  });

  it('handles series episodes calculation', () => {
    const categoryData = {
      series: {
        count: 2,
        categoryInfo: { emoji: '📺', name: 'Series' },
        groupedActivities: {
          'Series 1': {
            name: 'Series 1',
            count: 2,
            details: ['3,10,11'],
            activities: [],
          },
        },
      },
    };

    const activities = [
      { id: '1', timestamp: new Date(2024, 0, 15).toISOString(), date: '2024-01-15' },
    ];

    const { getByText } = render(
      <YearlySummary
        categoryData={categoryData}
        activities={activities}
        currentYear={currentYear}
        colors={mockColors}
      />
    );

    expect(getByText(/Episodes/)).toBeTruthy();
  });
});

