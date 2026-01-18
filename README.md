# Binge Log

Daily activity tracking app developed with React Native and Expo. Track your books, series, movies, games, education, and sports activities with a modern, intuitive interface.

## Support

For support, questions, or feedback, please contact us at: **emrekiziltepe2@gmail.com**

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
- **Trend Charts** - Visual charts showing activity trends over time
