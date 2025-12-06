// app.config.js - Expo configuration with environment-based setup
// Separate Firebase configs for Development and Production environments

// Load environment variables from .env files
require('dotenv').config({
  path: `.env.${process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'development'}`
});

const getConfig = () => {
  // Determine environment
  // EXPO_PUBLIC_ENV is set in package.json scripts
  const env = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  // Firebase config - based on environment
  // All values should come from .env.development or .env.production files
  const firebaseConfig = {
    development: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    },
    production: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    }
  };

  const currentConfig = firebaseConfig[isProduction ? 'production' : 'development'];

  return {
    expo: {
      name: "Binge Log",
      slug: "binge-log",
      version: "1.0.3",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      scheme: "bingelog",
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.emek02.bingelog",
        buildNumber: "1",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false
        }
      },
      android: {
        package: "com.emek02.bingelog",
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true
      },
      web: {
        favicon: "./assets/favicon.png",
        bundler: "metro"
      },
      extra: {
        eas: {
          projectId: "a17cb5e6-8d3c-4d0c-9dd7-1a9339e9e21f"
        },
        // Environment bilgisi
        environment: env,
        isProduction: isProduction,
        // Firebase config - based on environment
        firebaseApiKey: currentConfig.apiKey,
        firebaseAuthDomain: currentConfig.authDomain,
        firebaseProjectId: currentConfig.projectId,
        firebaseStorageBucket: currentConfig.storageBucket,
        firebaseMessagingSenderId: currentConfig.messagingSenderId,
        firebaseAppId: currentConfig.appId,
        firebaseMeasurementId: currentConfig.measurementId,

      }
    }
  };
};

export default getConfig();
