import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import autoSyncService from './autoSyncService';

// Completion callback for WebBrowser
WebBrowser.maybeCompleteAuthSession();

// Convert Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/invalid-email': 'invalidEmail',
    'auth/invalid-credential': 'wrongCredentials',
    'auth/user-not-found': 'userNotFound',
    'auth/wrong-password': 'wrongPassword',
    'auth/weak-password': 'weakPassword',
    'auth/email-already-in-use': 'emailAlreadyInUse',
    'auth/too-many-requests': 'tooManyRequests',
    'auth/network-request-failed': 'networkError',
    'auth/user-disabled': 'userDisabled',
    'auth/operation-not-allowed': 'operationNotAllowed',
    'auth/cancelled': 'cancelled',
    'auth/apple-not-supported': 'appleNotSupported',
    'auth/apple-not-available': 'appleNotAvailable',
    'auth/apple-auth-failed': 'appleAuthFailed',
    'auth/google-client-id-missing': 'googleAuthFailed',
    'auth/id-token-missing': 'googleAuthFailed',
    'auth/googleAuthFailed': 'googleAuthFailed',
  };
  
  return errorMessages[errorCode] || 'unknownError';
};

// User registration
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user name
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Send email verification link
    await sendEmailVerification(user);
    
    // Log out user until email is verified
    await signOut(auth);
    
    return { success: true, emailVerificationSent: true };
  } catch (error) {
    console.error('Registration error:', error);
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey, errorCode: error.code };
  }
};

// User login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Email verification check
    if (!user.emailVerified) {
      // Log out unverified user
      await signOut(auth);
      return { 
        success: false, 
        error: 'emailNotVerified', 
        errorCode: 'auth/email-not-verified'
      };
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey, errorCode: error.code };
  }
};

// Clear user-specific local data
export const clearUserLocalData = async (userId) => {
  try {
    if (!userId) {
      return;
    }

    // Get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Keys to remove (user-specific):
    // - activities_${userId}_*
    // - goals_${userId}
    // - recentActivities_${userId}
    // - offline_queue (clear on logout)
    
    const keysToRemove = [];
    
    for (const key of allKeys) {
      // User-specific activities
      if (key.startsWith(`activities_${userId}_`)) {
        keysToRemove.push(key);
      }
      // User-specific goals
      else if (key === `goals_${userId}`) {
        keysToRemove.push(key);
      }
      // User-specific recent activities
      else if (key === `recentActivities_${userId}`) {
        keysToRemove.push(key);
      }
      // Offline queue (clear on logout)
      else if (key === 'offline_queue') {
        keysToRemove.push(key);
      }
    }
    
    // Remove all user-specific keys
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Cleared ${keysToRemove.length} user-specific data keys`);
    }
    
    // Also clear offline queue from memory
    try {
      await autoSyncService.clearOfflineQueue();
    } catch (error) {
      console.error('Error clearing offline queue from memory:', error);
    }
  } catch (error) {
    console.error('Error clearing user local data:', error);
    // Don't throw - logout should continue even if clearing fails
  }
};

// User logout
export const logoutUser = async () => {
  try {
    // Get user ID before signing out (auth.currentUser will be null after signOut)
    const userId = getUserId();
    
    // Sign out from Firebase
    await signOut(auth);
    
    // Clear user-specific local data
    if (userId) {
      await clearUserLocalData(userId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Listen to auth state
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Get user ID
export const getUserId = () => {
  const user = getCurrentUser();
  return user ? user.uid : null;
};

// Send email verification link
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'userNotLoggedIn' };
    }
    
    if (user.emailVerified) {
      return { success: false, error: 'emailAlreadyVerified' };
    }
    
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    console.error('Email verification send error:', error);
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey, errorCode: error.code };
  }
};

// Send password reset email
export const sendPasswordReset = async (email) => {
  try {
    if (!email) {
      return { success: false, error: 'emailRequired' };
    }
    
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Password reset email send error:', error);
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey, errorCode: error.code };
  }
};

// Login with Google
export const loginWithGoogle = async () => {
  try {
    // For production, use direct OAuth flow with client IDs
    // This is more reliable than Firebase Auth Domain endpoint
    return await loginWithGoogleDirect();
  } catch (error) {
    console.error('Google login error:', error);
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey || 'googleAuthFailed', errorCode: error.code };
  }
};

// Login with Google (Direct OAuth - Production ready)
const loginWithGoogleDirect = async () => {
  try {
    // Discovery endpoint for Google OAuth
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    // Create redirect URI
    // For development, use custom scheme (more reliable)
    // For production, useProxy can be true or false depending on setup
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: __DEV__ ? false : true, // Development'ta custom scheme kullan
    });

    // Google OAuth Client ID - platform specific
    // Get from environment variables via app.config.js
    const clientId = Platform.select({
      ios: Constants.expoConfig?.extra?.googleIosClientId,
      android: Constants.expoConfig?.extra?.googleAndroidClientId,
      web: Constants.expoConfig?.extra?.googleWebClientId,
      default: Constants.expoConfig?.extra?.googleWebClientId, // Fallback
    });
    
    // Debug logging (only in development)
    if (__DEV__) {
      console.log('Google OAuth - Platform:', Platform.OS);
      console.log('Google OAuth - Redirect URI:', redirectUri);
      console.log('Google OAuth - Client ID configured:', !!clientId);
    }
    
    // Client ID is required for production
    if (!clientId) {
      console.error('Google OAuth Client ID is not configured for this platform.');
      console.error('Platform:', Platform.OS);
      console.error('Available config keys:', Object.keys(Constants.expoConfig?.extra || {}));
      return { 
        success: false, 
        error: 'googleAuthFailed', 
        errorCode: 'auth/google-client-id-missing' 
      };
    }

    // Create request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
      extraParams: {},
    });

    // Start auth session
    const result = await request.promptAsync(discovery);

    if (result.type === 'success') {
      const { id_token } = result.params;
      if (id_token) {
        // Create Google credential
        const credential = GoogleAuthProvider.credential(id_token);
        
        // Login with Firebase
        const userCredential = await signInWithCredential(auth, credential);
        
        return { success: true, user: userCredential.user };
      } else {
        console.error('Google OAuth: No id_token in response');
        return { 
          success: false, 
          error: 'googleAuthFailed', 
          errorCode: 'auth/id-token-missing' 
        };
      }
    } else if (result.type === 'cancel') {
      return { success: false, error: 'cancelled', errorCode: 'auth/cancelled' };
    } else {
      console.error('Google OAuth: Unexpected result type:', result.type);
      return { 
        success: false, 
        error: 'googleAuthFailed', 
        errorCode: `auth/oauth-${result.type}` 
      };
    }
  } catch (error) {
    console.error('Google direct login error:', error);
    const errorKey = getErrorMessage(error.code);
    return { 
      success: false, 
      error: errorKey || 'googleAuthFailed', 
      errorCode: error.code || 'auth/unknown-error' 
    };
  }
};

// Login with Apple (iOS only)
export const loginWithApple = async () => {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'appleNotSupported', errorCode: 'auth/apple-not-supported' };
    }

    // Apple Authentication check
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'appleNotAvailable', errorCode: 'auth/apple-not-available' };
    }

    // Authenticate with Apple
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { success: false, error: 'appleAuthFailed', errorCode: 'auth/apple-auth-failed' };
    }

    // Create Firebase OAuth provider (for Apple)
    const provider = new OAuthProvider('apple.com');
    
    // Create Firebase credential with Apple credential
    const firebaseCredential = provider.credential({
      idToken: credential.identityToken,
      rawNonce: credential.nonce,
    });

    // Login with Firebase
    const userCredential = await signInWithCredential(auth, firebaseCredential);
    
    // If new user and no displayName, use information from Apple
    if (userCredential.user && userCredential.additionalUserInfo?.isNewUser) {
      if (credential.fullName && !userCredential.user.displayName) {
        const displayName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
        if (displayName) {
          await updateProfile(userCredential.user, {
            displayName: displayName
          });
        }
      }
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Apple login error:', error);
    
    // If user cancelled
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'cancelled', errorCode: 'auth/cancelled' };
    }
    
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey, errorCode: error.code };
  }
};
