import goalService from '../goalService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../authService';
import { getDoc, setDoc } from 'firebase/firestore';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('../authService', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
}));

jest.mock('../../firebase', () => ({
    db: {},
}));

describe('goalService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getGoals', () => {
        it('returns default goals when no user and no storage', async () => {
            getCurrentUser.mockReturnValue(null);
            AsyncStorage.getItem.mockResolvedValue(null);

            const goals = await goalService.getGoals();

            expect(goals).toEqual(goalService.getDefaultGoals());
        });

        it('returns stored goals from AsyncStorage when offline', async () => {
            getCurrentUser.mockReturnValue(null);
            const storedGoals = { weekly: { book: 10 } };
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedGoals));

            const goals = await goalService.getGoals();

            expect(goals).toEqual(storedGoals);
        });

        it('fetches from Firebase for logged in user', async () => {
            const mockUser = { uid: '123' };
            getCurrentUser.mockReturnValue(mockUser);

            const firebaseGoals = { weekly: { book: 20 } };
            getDoc.mockResolvedValue({
                exists: () => true,
                data: () => firebaseGoals,
            });

            const goals = await goalService.getGoals();

            expect(goals).toEqual(firebaseGoals);
            expect(AsyncStorage.setItem).toHaveBeenCalled(); // Should cache to local storage
        });
    });

    describe('setCategoryGoal', () => {
        it('updates goal and saves to storage', async () => {
            getCurrentUser.mockReturnValue(null);
            AsyncStorage.getItem.mockResolvedValue(null); // Start with defaults

            const updatedGoals = await goalService.setCategoryGoal('weekly', 'book', 50);

            expect(updatedGoals.weekly.book).toBe(50);
            expect(AsyncStorage.setItem).toHaveBeenCalled();
        });

        it('syncs to Firebase if user logged in', async () => {
            const mockUser = { uid: '123' };
            getCurrentUser.mockReturnValue(mockUser);
            AsyncStorage.getItem.mockResolvedValue(null);

            await goalService.setCategoryGoal('weekly', 'book', 50);

            expect(setDoc).toHaveBeenCalled();
        });
    });

    describe('deleteCategoryGoal', () => {
        it('removes goal value', async () => {
            getCurrentUser.mockReturnValue(null);
            const initialGoals = { weekly: { book: 50 } };
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(initialGoals));

            const updatedGoals = await goalService.deleteCategoryGoal('weekly', 'book');

            expect(updatedGoals.weekly.book).toBeNull();
            expect(AsyncStorage.setItem).toHaveBeenCalled();
        });
    });
});
