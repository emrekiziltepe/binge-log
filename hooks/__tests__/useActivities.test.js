import { renderHook, act } from '@testing-library/react-native';
import { useActivities } from '../useActivities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllActivitiesFromFirebase } from '../../services/firebaseService';
import { getCurrentUser } from '../../services/authService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
    getAllKeys: jest.fn(),
    getItem: jest.fn(),
}));

jest.mock('../../services/firebaseService', () => ({
    getAllActivitiesFromFirebase: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('../../utils/commonUtils', () => ({
    removeDuplicates: (list) => list,
}));

describe('useActivities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads from AsyncStorage for non-logged-in user', async () => {
        getCurrentUser.mockReturnValue(null);
        AsyncStorage.getAllKeys.mockResolvedValue(['activities_2024-01-01']);
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify([{ id: '1', title: 'Test' }]));

        const { result } = renderHook(() => useActivities());

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await Promise.resolve();
        });

        expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('activities_2024-01-01');
        expect(result.current.activities).toHaveLength(1);
        expect(result.current.loading).toBe(false);
    });

    it('loads from Firebase for logged-in user', async () => {
        getCurrentUser.mockReturnValue({ uid: '123' });
        getAllActivitiesFromFirebase.mockResolvedValue([{ id: '2', title: 'Firebase Activity' }]);

        const { result } = renderHook(() => useActivities());

        await act(async () => {
            await Promise.resolve();
        });

        expect(getAllActivitiesFromFirebase).toHaveBeenCalled();
        expect(result.current.activities).toHaveLength(1);
        expect(result.current.activities[0].title).toBe('Firebase Activity');
    });

    it('falls back to AsyncStorage if Firebase fails', async () => {
        getCurrentUser.mockReturnValue({ uid: '123' });
        getAllActivitiesFromFirebase.mockRejectedValue(new Error('Network error'));

        AsyncStorage.getAllKeys.mockResolvedValue(['activities_123_2024-01-01']);
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify([{ id: '3', title: 'Local Backup' }]));

        const { result } = renderHook(() => useActivities());

        await act(async () => {
            await Promise.resolve();
        });

        expect(getAllActivitiesFromFirebase).toHaveBeenCalled();
        expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
        expect(result.current.activities).toHaveLength(1);
        expect(result.current.activities[0].title).toBe('Local Backup');
    });
});
