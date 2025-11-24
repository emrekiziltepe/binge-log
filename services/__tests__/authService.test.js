import {
    registerUser,
    loginUser,
    logoutUser,
} from '../authService';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendEmailVerification,
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
    sendEmailVerification: jest.fn(),
    onAuthStateChanged: jest.fn(),
    GoogleAuthProvider: {
        credential: jest.fn(),
    },
    OAuthProvider: jest.fn(),
}));

// Mock other dependencies
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-web-browser', () => ({
    maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({}));
jest.mock('../../firebase', () => ({
    auth: {},
}));

describe('authService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('registers user successfully', async () => {
            const mockUser = { uid: '123', email: 'test@example.com' };
            createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            updateProfile.mockResolvedValue();
            sendEmailVerification.mockResolvedValue();
            signOut.mockResolvedValue();

            const result = await registerUser('test@example.com', 'password', 'Test User');

            expect(createUserWithEmailAndPassword).toHaveBeenCalled();
            expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
            expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
            expect(signOut).toHaveBeenCalled();
            expect(result).toEqual({ success: true, emailVerificationSent: true });
        });

        it('handles registration error', async () => {
            const error = { code: 'auth/email-already-in-use' };
            createUserWithEmailAndPassword.mockRejectedValue(error);

            const result = await registerUser('test@example.com', 'password', 'Test User');

            expect(result.success).toBe(false);
            expect(result.error).toBe('emailAlreadyInUse');
        });
    });

    describe('loginUser', () => {
        it('logs in verified user successfully', async () => {
            const mockUser = { uid: '123', email: 'test@example.com', emailVerified: true };
            signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

            const result = await loginUser('test@example.com', 'password');

            expect(signInWithEmailAndPassword).toHaveBeenCalled();
            expect(result).toEqual({ success: true, user: mockUser });
        });

        it('rejects unverified user', async () => {
            const mockUser = { uid: '123', email: 'test@example.com', emailVerified: false };
            signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            signOut.mockResolvedValue();

            const result = await loginUser('test@example.com', 'password');

            expect(signOut).toHaveBeenCalled();
            expect(result.success).toBe(false);
            expect(result.error).toBe('emailNotVerified');
        });

        it('handles login error', async () => {
            const error = { code: 'auth/wrong-password' };
            signInWithEmailAndPassword.mockRejectedValue(error);

            const result = await loginUser('test@example.com', 'password');

            expect(result.success).toBe(false);
            expect(result.error).toBe('wrongPassword');
        });
    });

    describe('logoutUser', () => {
        it('logs out successfully', async () => {
            signOut.mockResolvedValue();

            const result = await logoutUser();

            expect(signOut).toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        it('handles logout error', async () => {
            signOut.mockRejectedValue(new Error('Logout failed'));

            const result = await logoutUser();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Logout failed');
        });
    });
});
