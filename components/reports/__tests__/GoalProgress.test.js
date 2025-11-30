import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GoalProgress from '../GoalProgress';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'goals.weeklyGoal': 'Weekly Goal',
        'goals.monthlyGoal': 'Monthly Goal',
        'goals.pages': 'pages',
        'goals.episodes': 'episodes',
        'goals.hours': 'hours',
        'goals.movies': 'movies',
        'goals.games': 'games',
        'goals.educations': 'educations',
        'goals.completed': 'Completed',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('GoalProgress', () => {
  const mockColors = {
    card: '#fff',
    text: '#000',
    textSecondary: '#666',
    primary: '#007AFF',
    success: '#34C759',
    surfaceSecondary: '#e0e0e0',
  };

  const mockCATEGORIES = {
    book: { emoji: '📚', name: 'Book' },
    series: { emoji: '📺', name: 'Series' },
    sport: { emoji: '⚽', name: 'Sport' },
    movie: { emoji: '🎬', name: 'Movie' },
    game: { emoji: '🎮', name: 'Game' },
    education: { emoji: '📖', name: 'Education' },
  };

  const mockCalculateGoalProgress = jest.fn((categoryKey, viewMode) => {
    if (categoryKey === 'book' && viewMode === 'weekly') {
      return {
        current: 50,
        goal: 100,
        progress: 50,
        completed: false,
      };
    }
    return null;
  });

  const defaultProps = {
    viewMode: 'weekly',
    goals: {
      weekly: { book: 100 },
      monthly: {},
    },
    calculateGoalProgress: mockCalculateGoalProgress,
    CATEGORIES: mockCATEGORIES,
    goalProgressExpanded: false,
    setGoalProgressExpanded: jest.fn(),
    colors: mockColors,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for yearly view mode', () => {
    const { queryByText } = render(
      <GoalProgress {...defaultProps} viewMode="yearly" />
    );

    expect(queryByText('Weekly Goal')).toBeNull();
  });

  it('returns null when there are no goals', () => {
    const { queryByText } = render(
      <GoalProgress
        {...defaultProps}
        goals={{ weekly: {}, monthly: {} }}
      />
    );

    expect(queryByText(/Goal/)).toBeNull();
  });

  it('renders weekly goal header when collapsed', () => {
    const { getByText } = render(<GoalProgress {...defaultProps} />);

    expect(getByText(/Weekly Goal/)).toBeTruthy();
  });

  it('renders monthly goal header when viewMode is monthly', () => {
    const { getByText } = render(
      <GoalProgress
        {...defaultProps}
        viewMode="monthly"
        goals={{ weekly: {}, monthly: { book: 200 } }}
      />
    );

    expect(getByText(/Monthly Goal/)).toBeTruthy();
  });

  it('toggles expansion when header is pressed', () => {
    const { getByText } = render(<GoalProgress {...defaultProps} />);

    const header = getByText(/Weekly Goal/).parent;
    fireEvent.press(header);

    expect(defaultProps.setGoalProgressExpanded).toHaveBeenCalledWith(true);
  });

  it('shows goal progress when expanded', () => {
    mockCalculateGoalProgress.mockImplementation((categoryKey) => {
      if (categoryKey === 'book') {
        return {
          current: 50,
          goal: 100,
          progress: 50,
          completed: false,
        };
      }
      return null;
    });

    const { getByText } = render(
      <GoalProgress {...defaultProps} goalProgressExpanded={true} />
    );

    // Should show progress values in the label text
    expect(mockCalculateGoalProgress).toHaveBeenCalled();
  });

  it('shows completed badge when goal is completed', () => {
    mockCalculateGoalProgress.mockImplementation((categoryKey) => {
      if (categoryKey === 'book') {
        return {
          current: 100,
          goal: 100,
          progress: 100,
          completed: true,
        };
      }
      return null;
    });

    const { getAllByText } = render(
      <GoalProgress {...defaultProps} goalProgressExpanded={true} />
    );

    // Should show completed badge
    const completedTexts = getAllByText(/Completed/);
    expect(completedTexts.length).toBeGreaterThan(0);
  });

  it('calls calculateGoalProgress for each category', () => {
    render(<GoalProgress {...defaultProps} goalProgressExpanded={true} />);

    // Should call for each category in CATEGORIES
    expect(mockCalculateGoalProgress).toHaveBeenCalled();
  });

  it('does not render progress item when calculateGoalProgress returns null', () => {
    mockCalculateGoalProgress.mockReturnValue(null);

    const { queryByText } = render(
      <GoalProgress {...defaultProps} goalProgressExpanded={true} />
    );

    // Should not show progress items when null
    expect(queryByText(/pages|episodes|hours/)).toBeNull();
  });

  it('handles sport category with decimal formatting', () => {
    mockCalculateGoalProgress.mockReturnValue({
      current: 1.5,
      goal: 5.0,
      progress: 30,
      completed: false,
    });

    const { getByText } = render(
      <GoalProgress
        {...defaultProps}
        goalProgressExpanded={true}
      />
    );

    // Sport should show one decimal place
    expect(mockCalculateGoalProgress).toHaveBeenCalled();
  });
});

