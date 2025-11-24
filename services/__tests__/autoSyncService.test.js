import autoSyncService from '../autoSyncService';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncLocalDataToFirebase } from '../firebaseService';
import { getCurrentUser } from '../authService';
import goalService from '../goalService';

// Mock dependencies
jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('../firebaseService', () => ({
    syncLocalDataToFirebase: jest.fn(),
    syncFirebaseToLocal: jest.fn(),
    getAllActivitiesFromFirebase: jest.fn(),
}));

jest.mock('../authService', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('../goalService', () => ({
    getGoals: jest.fn(),
}));

describe('autoSyncService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        autoSyncService.isOnline = true;
        autoSyncService.syncInProgress = false;
        autoSyncService.offlineQueue = [];
        autoSyncService.listeners = [];
    });

    describe('startListening', () => {
        it('registers NetInfo listener', () => {
            autoSyncService.startListening();
            expect(NetInfo.addEventListener).toHaveBeenCalled();
        });

        it('loads offline queue on start', () => {
            autoSyncService.startListening();
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('offline_queue');
        });
    });

    describe('performAutoSync', () => {
        it('syncs local data to firebase if user logged in', async () => {
            getCurrentUser.mockReturnValue({ uid: '123' });

            await autoSyncService.performAutoSync();

            expect(syncLocalDataToFirebase).toHaveBeenCalled();
            expect(goalService.getGoals).toHaveBeenCalled();
        });

        it('skips sync if no user', async () => {
            getCurrentUser.mockReturnValue(null);

            await autoSyncService.performAutoSync();

            expect(syncLocalDataToFirebase).not.toHaveBeenCalled();
        });

        it('skips sync if already in progress', async () => {
            getCurrentUser.mockReturnValue({ uid: '123' });
            autoSyncService.syncInProgress = true;

            await autoSyncService.performAutoSync();

            expect(syncLocalDataToFirebase).not.toHaveBeenCalled();
        });
    });

    describe('offlineQueue', () => {
        it('adds to queue when offline', () => {
            autoSyncService.isOnline = false;
            const operation = { type: 'ADD_ACTIVITY', data: {} };

            autoSyncService.addToOfflineQueue(operation);

            expect(autoSyncService.offlineQueue.length).toBe(1);
            expect(AsyncStorage.setItem).toHaveBeenCalled();
        });

        it('does not add to queue when online', () => {
            autoSyncService.isOnline = true;
            const operation = { type: 'ADD_ACTIVITY', data: {} };

            autoSyncService.addToOfflineQueue(operation);

            expect(autoSyncService.offlineQueue.length).toBe(0);
        });
    });
});
