import {
    addActivityToFirebase,
    updateActivityInFirebase,
    deleteActivityFromFirebase,
    getActivitiesFromFirebase,
} from '../firebaseService';
import {
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { auth } from '../../firebase';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn(),
    serverTimestamp: jest.fn(),
}));

jest.mock('../../firebase', () => ({
    db: {},
    auth: {
        currentUser: { uid: 'test-user' },
    },
}));

describe('firebaseService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        auth.currentUser = { uid: 'test-user' };
    });

    describe('addActivityToFirebase', () => {
        it('adds activity successfully', async () => {
            addDoc.mockResolvedValue({ id: 'new-doc-id' });
            const activity = { title: 'Test Activity' };

            const result = await addActivityToFirebase(activity);

            expect(addDoc).toHaveBeenCalled();
            expect(result).toBe('new-doc-id');
        });

        it('returns null if no user', async () => {
            auth.currentUser = null;
            const result = await addActivityToFirebase({});
            expect(result).toBeNull();
        });
    });

    describe('updateActivityInFirebase', () => {
        it('updates existing activity', async () => {
            getDoc.mockResolvedValue({ exists: () => true });
            updateDoc.mockResolvedValue();

            await updateActivityInFirebase('doc-id', { title: 'Updated' });

            expect(updateDoc).toHaveBeenCalled();
        });

        it('does nothing if no user', async () => {
            auth.currentUser = null;
            await updateActivityInFirebase('doc-id', {});
            expect(updateDoc).not.toHaveBeenCalled();
        });
    });

    describe('deleteActivityFromFirebase', () => {
        it('deletes activity successfully', async () => {
            deleteDoc.mockResolvedValue();

            await deleteActivityFromFirebase('doc-id');

            expect(deleteDoc).toHaveBeenCalled();
        });
    });

    describe('getActivitiesFromFirebase', () => {
        it('fetches and filters activities by date', async () => {
            const date = new Date('2024-01-01');
            const mockDocs = [
                { id: '1', data: () => ({ date: '2024-01-01', title: 'A1' }) },
                { id: '2', data: () => ({ date: '2024-01-02', title: 'A2' }) },
            ];
            getDocs.mockResolvedValue(mockDocs);

            const result = await getActivitiesFromFirebase(date);

            expect(result.length).toBe(1);
            expect(result[0].title).toBe('A1');
        });
    });
});
