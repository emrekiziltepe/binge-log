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
import { auth } from '../firebase';

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

// User logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
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
    // Start Google OAuth flow using Firebase Auth Domain
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    // Firebase's Google OAuth endpoint
    const authUrl = `https://${auth.app.options.authDomain}/__/auth/handler?authType=signInWithPopup&providerId=google.com&redirectUri=${encodeURIComponent(redirectUri)}&apikey=${auth.app.options.apiKey}`;

    // Open in web browser
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success') {
      // Get token from URL
      const { url } = result;
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');

      if (idToken) {
        // Create Google credential
        const credential = GoogleAuthProvider.credential(idToken);
        
        // Login with Firebase
        const userCredential = await signInWithCredential(auth, credential);
        
        return { success: true, user: userCredential.user };
      } else {
        // Alternative: Direct OAuth flow
        return await loginWithGoogleDirect();
      }
    } else {
      return { success: false, error: 'cancelled', errorCode: 'auth/cancelled' };
    }
  } catch (error) {
    console.error('Google login error:', error);
    // Try alternative method
    return await loginWithGoogleDirect();
  }
};

// Login with Google (Alternative - Direct OAuth)
const loginWithGoogleDirect = async () => {
  try {
    // Discovery endpoint for Google OAuth
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    // Create redirect URI
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    // Google OAuth Client ID is required for Firebase Project
    // Using Firebase API Key for now (may not work)
    // User needs to enable Google provider in Firebase Console and get OAuth Client ID
    const clientId = auth.app.options.apiKey; // Google OAuth Client ID should be used instead

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
      }
    }
    
    return { success: false, error: 'cancelled', errorCode: 'auth/cancelled' };
  } catch (error) {
    console.error('Google direct login error:', error);
    const errorKey = getErrorMessage(error.code);
    return { success: false, error: errorKey || 'googleAuthFailed', errorCode: error.code };
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
