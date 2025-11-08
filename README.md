# Binge Log

Daily activity tracking app developed with React Native and Expo.

## Features

- 📱 Daily activity logging and tracking
- 📊 Detailed statistics (weekly, monthly, yearly)
- 🎯 Goal setting and progress tracking
- 🔥 Streak tracking
- 🌓 Dark/Light theme support
- 🌍 Multi-language support (English/Turkish)
- ☁️ Cloud synchronization with Firebase
- 🔒 User authentication (Email/Password, Google, Apple)
- 🔄 Development and Production environment support
- 📴 Offline support with automatic sync

## Quick Start

### 1. Installation

```bash
git clone <repo-url>
cd binge-log
npm install
```

### 2. Environment Setup

Create environment files:
```bash
# Development environment (required)
cp .env.example .env.development

# Production environment (required for production builds)
cp .env.example .env.production
```

Edit `.env.development` and `.env.production` with your Firebase credentials (see Firebase Setup section below).

### 3. Run the App

```bash
# Development environment
npm run start:dev
npm run android:dev
npm run ios:dev

# Production environment
npm run start:prod
npm run android:prod
npm run ios:prod
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "binge-log-dev" for development)
4. Enable Google Analytics (optional)
5. Click "Create project"

**Recommended:** Create separate Firebase projects for Development and Production
- Development: `binge-log-dev`
- Production: `binge-log-prod`

### 2. Create Firestore Database

1. Select "Firestore Database" from left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (e.g., europe-west1)
5. Click "Done"

### 3. Add Web App

1. Go to Project Settings (⚙️)
2. Under "Your apps", click Web icon (</>)
3. Enter app nickname (e.g., "binge-log-web")
4. Click "Register app"
5. Copy the Firebase SDK configuration

### 4. Configure Environment Variables

Add the Firebase configuration to your `.env.development` file:

```env
NODE_ENV=development
EXPO_PUBLIC_ENV=development

FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

Repeat for `.env.production` with your production Firebase project credentials.

### 5. Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional)
4. Enable **Apple** for iOS (optional)

### 6. Update Firestore Security Rules

⚠️ **CRITICAL**: Update security rules before going to production!

**Development (test mode):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Test mode - development only
    }
  }
}
```

**Production (secure):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/activities/{activityId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Goals - user based
    match /users/{userId}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny for all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 7. Create Firestore Indexes (if needed)

If you get index errors, create a composite index:

1. Go to [Firestore Indexes](https://console.firebase.google.com/project/your-project/firestore/indexes)
2. Create composite index with:
   - Collection: `activities`
   - Fields: `date` (Ascending), `createdAt` (Descending)

**Note:** Current code uses client-side sorting to avoid index requirements.

## Environment Configuration

The project uses separate configurations for development and production:

- **`.env.development`** - Development Firebase config (gitignored)
- **`.env.production`** - Production Firebase config (gitignored)
- **`app.config.js`** - Automatic config selection based on `EXPO_PUBLIC_ENV`
- **`firebase.js`** - Firebase initialization based on environment

### How It Works:

1. **package.json scripts** set the `EXPO_PUBLIC_ENV` variable
2. **app.config.js** loads the appropriate `.env` file using dotenv
3. **firebase.js** reads config from `Constants.expoConfig.extra`
4. Console logs show which environment is active

### Switching Environments:

```bash
# Development
export EXPO_PUBLIC_ENV=development
expo start

# Production
export EXPO_PUBLIC_ENV=production
expo start
```

Or use the npm scripts directly:
```bash
npm run start:dev   # Development
npm run start:prod  # Production
```

## Production Deployment

### 1. Production Checklist

- [ ] Production Firebase project created
- [ ] `.env.production` file created and filled with production credentials
- [ ] Firestore Security Rules updated for production
- [ ] Authentication providers enabled in Firebase Console
- [ ] Tested with `npm run start:prod`
- [ ] Production login/signup tested

### 2. Build for iOS

```bash
# Production build
EXPO_PUBLIC_ENV=production npx eas-cli build --platform ios --profile production

# Preview build (for testing)
EXPO_PUBLIC_ENV=production npx eas-cli build --platform ios --profile preview
```

**Requirements:**
- Apple Developer account
- Build takes 15-30 minutes
- First build may require credentials setup: `npx eas-cli build:configure`

### 3. Build for Android

```bash
# Production build
EXPO_PUBLIC_ENV=production npx eas-cli build --platform android --profile production
```

### 4. Submit to App Store

```bash
# Submit to TestFlight/App Store
npx eas-cli submit --platform ios

# Submit to Google Play
npx eas-cli submit --platform android
```

## Security Notes

### ⚠️ Before Pushing to GitHub

1. **✅ Environment files are protected**
   - `.env.development` and `.env.production` are in `.gitignore`
   - No hardcoded credentials in code files
   - All sensitive data comes from environment variables

2. **⚠️ Firebase API Keys**
   - Firebase client-side API keys can be public (by Firebase design)
   - Real security comes from Firestore Security Rules
   - Recommended: Set up API key restrictions in Firebase Console (domain/IP based)

3. **⚠️ Firestore Security Rules**
   - **CRITICAL**: Update security rules before production
   - Development can use test mode (open access)
   - Production MUST use user-based access control

4. **✅ No sensitive data in code**
   - No hardcoded passwords
   - No API secrets
   - No private keys

### Firebase API Key Restrictions (Optional)

In Firebase Console → Project Settings → API Keys:
- Restrict keys to specific domains
- Set up usage quotas
- Enable monitoring

## Project Structure

```
binge-log/
├── .env.development      # Development config (gitignored)
├── .env.production       # Production config (gitignored)
├── app.config.js         # Expo configuration
├── App.js                # Main app component
├── firebase.js           # Firebase initialization
├── components/           # React components
│   ├── dailyFlow/       # Daily flow screen components
│   └── reports/         # Reports screen components
├── screens/             # Main screens
├── services/            # Business logic and Firebase services
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── contexts/            # React contexts
├── styles/              # Style definitions
└── locales/             # Translation files (en, tr)
```

## Troubleshooting

### Environment not loading
- Check that `.env.development` or `.env.production` exists
- Verify `EXPO_PUBLIC_ENV` is set in package.json scripts
- Check console logs for "🔥 Firebase Environment" message

### Firebase connection errors
- Verify Firebase config in `.env` files
- Check Firestore Security Rules
- Ensure Authentication providers are enabled

### Build errors
- Run `npm run start:prod` to test production config locally
- Check EAS build logs in Expo Dashboard
- Verify all credentials are properly configured

## License

This is a private project.

## Support

For issues or questions, check the Firebase Console logs and Firestore Security Rules first.
