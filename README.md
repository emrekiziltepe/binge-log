# Binge Log

Daily activity tracking app developed with React Native and Expo. Track your books, series, movies, games, education, and sports activities with a modern, intuitive interface.

## Features

### Core Features
- 📱 **Daily Activity Logging** - Track activities across 6 categories
- 📊 **Detailed Statistics** - Weekly, monthly, and yearly reports
- 🎯 **Goal Setting** - Set weekly and monthly goals for each category
- 🔥 **Streak Tracking** - Track your daily activity streaks
- ⭐ **Rating System** - Rate activities from 1-10
- ✅ **Completion Status** - Mark activities as completed
- 📅 **Date Navigation** - Horizontal scrollable date picker with swipe navigation
- 🔄 **Quick Add** - Quick access to recent activities
- 🗑️ **Swipe to Delete** - Swipe left on activities to delete
- 📋 **Recent Activities** - Quick access to your most recent activities

### Activity Categories
- 📚 **Books** - Track pages read
- 📺 **Series** - Track seasons and episodes (supports multiple episodes per season)
- 🎬 **Movies** - Track with optional details (IMDb rating, comments, etc.)
- 🎮 **Games** - Track with optional details (platform, duration, etc.)
- 🎓 **Education** - Track with optional details (topic, source, etc.)
- 🏃 **Sport** - Track duration (hours and minutes)

### User Features
- 🌓 **Dark/Light Theme** - Automatic theme switching
- 🌍 **Multi-language Support** - English and Turkish
- 🔒 **Authentication** - Email/Password, Google OAuth, Apple Sign-in
- ☁️ **Cloud Sync** - Firebase Firestore synchronization
- 📴 **Offline Support** - Automatic sync when connection is restored
- 🔄 **Auto Sync** - Background synchronization with offline queue
- 👤 **User Profiles** - Separate data per user account

### Technical Features
- 🔄 **Development/Production Environments** - Separate Firebase configs
- 🏗️ **EAS Build Support** - Easy builds with Expo Application Services
- 🔐 **EAS Secrets** - Secure environment variable management
- 📱 **Cross-platform** - iOS, Android, and Web support
- 🎨 **Modern UI** - Instagram-like design with smooth animations

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

**Required Environment Variables:**
```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google OAuth Client IDs (for OAuth login)
GOOGLE_IOS_CLIENT_ID=your_ios_client_id
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

### 3. Run the App

```bash
# Development environment
npm run start:dev
npm run android:dev
npm run ios:dev
npm run web:dev

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
3. Enable **Google** (requires OAuth Client IDs - see below)
4. Enable **Apple** for iOS (requires Apple Developer account)

### 6. Google OAuth Setup

For Google Sign-in to work, you need to configure OAuth Client IDs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Create OAuth 2.0 Client IDs for:
   - **iOS** - Get from Firebase Console → Project Settings → Your apps → iOS app
   - **Android** - Get from Firebase Console → Project Settings → Your apps → Android app
   - **Web** - Create new Web client ID
5. Add authorized redirect URIs:
   - `bingelog://` (for custom scheme)
   - `https://auth.expo.io` (if using Expo proxy)
6. Add the Client IDs to your `.env` files:
   ```env
   GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
   GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
   GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
   ```

### 7. Update Firestore Security Rules

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

### 8. Create Firestore Indexes (if needed)

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
- [ ] Google OAuth Client IDs configured for all platforms
- [ ] Firestore Security Rules updated for production
- [ ] Authentication providers enabled in Firebase Console
- [ ] EAS Secrets configured (see below)
- [ ] Tested with `npm run start:prod`
- [ ] Production login/signup tested

### 2. EAS Secrets Setup

For production builds, configure EAS Secrets:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure secrets (project-wide)
eas secret:create --scope project --name GOOGLE_IOS_CLIENT_ID --value your_ios_client_id
eas secret:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value your_android_client_id
eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value your_web_client_id

# Firebase config secrets
eas secret:create --scope project --name FIREBASE_API_KEY --value your_api_key
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value your_auth_domain
eas secret:create --scope project --name FIREBASE_PROJECT_ID --value your_project_id
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value your_storage_bucket
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value your_sender_id
eas secret:create --scope project --name FIREBASE_APP_ID --value your_app_id
eas secret:create --scope project --name FIREBASE_MEASUREMENT_ID --value your_measurement_id
```

### 3. Build for iOS

```bash
# Production build
npm run build:ios:prod

# Or manually
EXPO_PUBLIC_ENV=production npx eas-cli build --platform ios --profile production
```

**Requirements:**
- Apple Developer account
- Build takes 15-30 minutes
- First build may require credentials setup: `npx eas-cli build:configure`

### 4. Build for Android

```bash
# Production build
EXPO_PUBLIC_ENV=production npx eas-cli build --platform android --profile production
```

### 5. Submit to App Store

```bash
# Submit to TestFlight/App Store
npx eas-cli submit --platform ios

# Submit to Google Play
npx eas-cli submit --platform android
```

## Activity Categories & Details

### 📚 Books
- **Required Detail:** Page count
- **Example:** "150" (pages read)

### 📺 Series
- **Required Detail:** Season and Episode(s)
- **Format:** `Season,Episode1,Episode2,...` or multiple seasons: `Season1,Ep1,Ep2;Season2,Ep1`
- **Example:** "3,5" (Season 3, Episode 5) or "3,5,6,7" (Season 3, Episodes 5, 6, 7)

### 🎬 Movies
- **Optional Detail:** IMDb rating, comments, etc.
- **Example:** "IMDb: 8.5, Great cinematography"

### 🎮 Games
- **Optional Detail:** Platform, duration, etc.
- **Example:** "PC, 2 hours"

### 🎓 Education
- **Optional Detail:** Topic, source, etc.
- **Example:** "React Native, YouTube tutorial"

### 🏃 Sport
- **Optional Detail:** Duration (hours and minutes)
- **Example:** "1 hour 30 minutes"

## UI Features

### Daily Flow Screen
- **Horizontal Date Picker** - Scrollable week view with today highlighted
- **Streak Card** - Compact single-line display of current and best streak
- **Activity Cards** - Modern card design with:
  - Category emoji and color
  - Completion status indicator
  - Rating badge (1-10 stars)
  - Swipe to delete with chevron indicator
  - Goal indicator (🎯) for future activities
- **Quick Add Menu** - Access recent activities for quick logging
- **Floating Action Buttons** - Add activity and quick add toggle

### Statistics Screen
- **Weekly View** - Category breakdown with grouped activities
- **Monthly View** - Monthly statistics per category
- **Yearly View** - Annual overview with monthly breakdown
- **Goal Progress** - Visual progress indicators for weekly/monthly goals

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
├── app.config.js         # Expo configuration with environment support
├── eas.json              # EAS build configuration
├── App.js                # Main app component with navigation
├── firebase.js           # Firebase initialization
├── components/           # React components
│   ├── dailyFlow/       # Daily flow screen components
│   │   ├── ActivityCard.js
│   │   ├── ActivityFormModal.js
│   │   ├── DatePickerModal.js
│   │   ├── QuickAddMenu.js
│   │   └── ...
│   ├── reports/         # Reports screen components
│   ├── HamburgerMenu.js # Menu with sync status
│   └── GoalModal.js     # Goal setting modal
├── screens/             # Main screens
│   ├── DailyFlowScreen.js
│   ├── ReportsScreen.js
│   └── AuthScreen.js
├── services/            # Business logic and Firebase services
│   ├── authService.js   # Authentication (Email, Google, Apple)
│   ├── firebaseService.js # Firestore operations
│   ├── autoSyncService.js # Background sync with offline queue
│   ├── goalService.js   # Goal management
│   └── themeService.js  # Theme management
├── hooks/               # Custom React hooks
│   ├── useActivityManagement.js
│   ├── useStreakCalculation.js
│   ├── useDateNavigation.js
│   ├── useActivityForm.js
│   ├── useGoals.js
│   └── useReportsData.js
├── utils/               # Utility functions
│   ├── categoryUtils.js # Category definitions
│   ├── dateUtils.js     # Date formatting
│   ├── activityUtils.js # Activity helpers
│   └── commonUtils.js   # Common utilities
├── contexts/            # React contexts
│   └── ThemeContext.js  # Theme context
├── styles/              # Style definitions
│   └── dailyFlowStyles.js
└── locales/             # Translation files
    ├── en.json          # English
    └── tr.json          # Turkish
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

### Google OAuth not working
- Verify OAuth Client IDs are configured in `.env` files
- Check Google Cloud Console for authorized redirect URIs
- Ensure `bingelog://` scheme is added to authorized URIs
- For production builds, verify EAS Secrets are configured

### Build errors
- Run `npm run start:prod` to test production config locally
- Check EAS build logs in Expo Dashboard
- Verify all credentials are properly configured
- Ensure EAS Secrets are set for production builds

### "Could not connect to server" in Expo
- Kill existing Expo processes: `lsof -ti:8081 | xargs kill -9`
- Restart Expo with `--clear` flag: `npx expo start --clear`
- Check that phone and computer are on the same Wi-Fi network
- Try manual connection with IP address in Expo Go

## License

This is a private project.

## Support

For issues or questions, check the Firebase Console logs and Firestore Security Rules first.
