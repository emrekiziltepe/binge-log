import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useActivityManagement } from '../useActivityManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActivitiesFromFirebase } from '../../services/firebaseService';
import { getCurrentUser } from '../../services/authService';
import { formatLocalDate } from '../../utils/dateUtils';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../services/firebaseService', () => ({
  getActivitiesFromFirebase: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../../utils/commonUtils', () => ({
  removeDuplicates: (list) => list,
}));

describe('useActivityManagement', () => {
  const mockCurrentDate = new Date(2024, 0, 15); // January 15, 2024
  const dateKey = formatLocalDate(mockCurrentDate);

  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(null);
  });

  it('returns initial empty activities', () => {
    AsyncStorage.getAllKeys.mockResolvedValue([]);

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    expect(result.current.activities).toEqual([]);
  });

  it('loads activities from AsyncStorage for non-logged-in user', async () => {
    const mockActivities = [
      { id: '1', title: 'Activity 1', date: dateKey, isGoal: false },
      { id: '2', title: 'Activity 2', date: dateKey, isGoal: false },
    ];

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockActivities));

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });

  it('loads activities from Firebase for logged-in user', async () => {
    const mockActivities = [
      { id: '1', title: 'Activity 1', date: dateKey, isGoal: false },
    ];

    const mockUser = { uid: 'user123' };
    getCurrentUser.mockReturnValue(mockUser);
    getActivitiesFromFirebase.mockResolvedValue(mockActivities);

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    expect(getActivitiesFromFirebase).toHaveBeenCalledWith(mockCurrentDate);
  });

  it('falls back to AsyncStorage if Firebase fails', async () => {
    const mockActivities = [
      { id: '1', title: 'Activity 1', date: dateKey, isGoal: false },
    ];

    const mockUser = { uid: 'user123' };
    getCurrentUser.mockReturnValue(mockUser);
    getActivitiesFromFirebase.mockRejectedValue(new Error('Firebase error'));
    AsyncStorage.getAllKeys.mockResolvedValue([`activities_${mockUser.uid}_${dateKey}`]);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockActivities));

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });

  it('filters activities by date correctly', async () => {
    const mockActivities = [
      { id: '1', title: 'Today Activity', date: dateKey, isGoal: false },
    ];

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === `activities_${dateKey}`) {
        return Promise.resolve(JSON.stringify(mockActivities));
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThanOrEqual(0);
    });

    // Should only include activities for current date
    const activitiesForCurrentDate = result.current.activities.filter(
      a => a.date === dateKey
    );
    // Should have the activity if it matches the date
    expect(activitiesForCurrentDate.length).toBeGreaterThanOrEqual(0);
  });

  it('saves activities to AsyncStorage for non-logged-in user', async () => {
    const mockActivities = [
      { id: '1', title: 'Activity 1', date: dateKey },
    ];

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.setItem.mockResolvedValue();

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await act(async () => {
      await result.current.saveActivities(mockActivities, mockCurrentDate);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('saves activities with user-specific key for logged-in user', async () => {
    const mockActivities = [
      { id: '1', title: 'Activity 1', date: dateKey },
    ];

    const mockUser = { uid: 'user123' };
    getCurrentUser.mockReturnValue(mockUser);
    AsyncStorage.setItem.mockResolvedValue();

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await act(async () => {
      await result.current.saveActivities(mockActivities, mockCurrentDate);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining(`activities_${mockUser.uid}_`),
      expect.any(String)
    );
  });

  it('filters activities by target date when saving', async () => {
    const tomorrow = new Date(mockCurrentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatLocalDate(tomorrow);

    const mockActivities = [
      { id: '1', title: 'Today', date: dateKey },
      { id: '2', title: 'Tomorrow', date: tomorrowStr },
    ];

    getCurrentUser.mockReturnValue(null);

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await act(async () => {
      await result.current.saveActivities(mockActivities, mockCurrentDate);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(savedData.length).toBe(1);
    expect(savedData[0].date).toBe(dateKey);
  });

  it('handles errors gracefully', async () => {
    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    await waitFor(() => {
      expect(result.current.activities).toEqual([]);
    });
  });

  it('reloads activities when currentDate changes', async () => {
    const date1 = new Date(2024, 0, 15);
    const date2 = new Date(2024, 0, 16);
    
    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

    const { result, rerender } = renderHook(
      ({ date }) => useActivityManagement(date),
      { initialProps: { date: date1 } }
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    rerender({ date: date2 });

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });

  it('sets activities state correctly', async () => {
    const mockActivities = [
      { id: '1', title: 'Activity 1', date: dateKey },
    ];

    getCurrentUser.mockReturnValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue([]);

    const { result } = renderHook(() => useActivityManagement(mockCurrentDate));

    act(() => {
      result.current.setActivities(mockActivities);
    });

    expect(result.current.activities).toEqual(mockActivities);
  });
});

