import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, connectAuthEmulator, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Determine environment
const getEnvironment = () => {
  // First check explicit environment variable
  if (Constants.expoConfig?.extra?.environment) {
    return Constants.expoConfig.extra.environment;
  }
  // Then from isProduction flag
  if (Constants.expoConfig?.extra?.isProduction) {
    return 'production';
  }
  // Then from environment variables
  if (process.env.EXPO_PUBLIC_ENV) {
    return process.env.EXPO_PUBLIC_ENV;
  }
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  // Default: development
  return 'development';
};

const isDevelopment = getEnvironment() === 'development';
const isProduction = getEnvironment() === 'production';

// Firebase configuration
// Uses development or production config based on environment
// Comes from app.config.js via Constants.expoConfig.extra
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.FIREBASE_APP_ID,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || process.env.FIREBASE_MEASUREMENT_ID,
};

// Log environment information (only in development)
if (__DEV__ && isDevelopment) {
  console.log('🔥 Firebase Environment: DEVELOPMENT');
  console.log('🔥 Firebase Project:', firebaseConfig.projectId);
} else if (isProduction) {
  console.log('🔥 Firebase Environment: PRODUCTION');
  console.log('🔥 Firebase Project:', firebaseConfig.projectId);
}

// Initialize Firebase (if not already initialized)
let app;
try {
  // If app already exists, use it
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Start new app
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  // On error, get existing app or start new one
  try {
    app = getApp();
  } catch {
    app = initializeApp(firebaseConfig);
  }
}

// Get Firestore service
export const db = getFirestore(app);

// Initialize Auth service specifically for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get existing auth
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth };

// Emulator connection for development (optional)
if (__DEV__) {
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;
