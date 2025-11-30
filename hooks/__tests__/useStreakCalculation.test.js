import { renderHook, act } from '@testing-library/react-native';
import { useStreakCalculation } from '../useStreakCalculation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllActivitiesFromFirebase } from '../../services/firebaseService';
import { getCurrentUser } from '../../services/authService';
import { formatLocalDate } from '../../utils/dateUtils';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../../services/firebaseService', () => ({
  getAllActivitiesFromFirebase: jest.fn(),
}));

describe('useStreakCalculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getAllKeys = jest.fn();
    AsyncStorage.getItem = jest.fn();
    getCurrentUser.mockReturnValue(null);
  });

  it('returns initial streak values', () => {
    AsyncStorage.getAllKeys.mockResolvedValue([]);
    
    const { result } = renderHook(() => useStreakCalculation());
    
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
    expect(typeof result.current.calculateStreak).toBe('function');
  });

  it('calculates streak for non-logged-in user from AsyncStorage', async () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = formatLocalDate(twoDaysAgo);

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue(['activities_' + todayStr, 'activities_' + yesterdayStr]);
    AsyncStorage.getItem
      .mockResolvedValueOnce(JSON.stringify([{ id: '1', date: todayStr, isGoal: false }]))
      .mockResolvedValueOnce(JSON.stringify([{ id: '2', date: yesterdayStr, isGoal: false }]));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    expect(result.current.currentStreak).toBe(2);
    expect(result.current.longestStreak).toBeGreaterThanOrEqual(2);
  });

  it('calculates streak for logged-in user from Firebase', async () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);

    const mockUser = { uid: 'user123' };
    getCurrentUser.mockReturnValue(mockUser);
    getAllActivitiesFromFirebase.mockResolvedValue([
      { id: '1', date: todayStr, isGoal: false },
      { id: '2', date: yesterdayStr, isGoal: false }
    ]);

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    expect(getAllActivitiesFromFirebase).toHaveBeenCalled();
    expect(result.current.currentStreak).toBe(2);
  });

  it('falls back to AsyncStorage if Firebase fails', async () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);

    const mockUser = { uid: 'user123' };
    getCurrentUser.mockReturnValue(mockUser);
    getAllActivitiesFromFirebase.mockRejectedValue(new Error('Firebase error'));
    AsyncStorage.getAllKeys.mockResolvedValue([`activities_${mockUser.uid}_${todayStr}`]);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([
      { id: '1', date: todayStr, isGoal: false }
    ]));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    expect(result.current.currentStreak).toBe(1);
  });

  it('filters out goal activities', async () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue(['activities_' + todayStr]);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([
      { id: '1', date: todayStr, isGoal: false },
      { id: '2', date: todayStr, isGoal: true }
    ]));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    // Should still calculate streak from non-goal activity
    expect(result.current.currentStreak).toBe(1);
  });

  it('handles empty activities', async () => {
    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue([]);

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
  });

  it('calculates longest streak correctly', async () => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i * 2); // Every 2 days
      dates.push(formatLocalDate(date));
    }

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue(dates.map(d => 'activities_' + d));
    dates.forEach(date => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([
        { id: '1', date, isGoal: false }
      ]));
    });

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    // Longest streak should be 1 (gaps between days)
    expect(result.current.longestStreak).toBe(1);
  });

  it('handles activities with timestamp instead of date', async () => {
    const today = new Date();
    const todayStr = formatLocalDate(today);

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue(['activities_' + todayStr]);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([
      { id: '1', timestamp: today.toISOString(), isGoal: false }
    ]));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    expect(result.current.currentStreak).toBe(1);
  });

  it('handles activities with no date or timestamp', async () => {
    const todayStr = formatLocalDate(new Date());

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue(['activities_' + todayStr]);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([
      { id: '1', isGoal: false } // No date or timestamp
    ]));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    // Should use current date as fallback
    expect(result.current.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('handles streak broken (no activity today or yesterday)', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = formatLocalDate(threeDaysAgo);

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue(['activities_' + threeDaysAgoStr]);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([
      { id: '1', date: threeDaysAgoStr, isGoal: false }
    ]));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(1);
  });

  it('handles error gracefully', async () => {
    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useStreakCalculation());

    await act(async () => {
      await result.current.calculateStreak();
    });

    // Should not crash, values remain at 0
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
  });
});

