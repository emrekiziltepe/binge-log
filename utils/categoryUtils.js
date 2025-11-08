/**
 * Category definitions and utilities
 * Centralized category configuration for the entire application
 */

// Category constants
export const CATEGORY_COLORS = {
  book: '#8B4513',
  series: '#FF6B6B',
  movie: '#4ECDC4',
  game: '#45B7D1',
  education: '#96CEB4',
  sport: '#FF6B6B',
};

export const CATEGORY_EMOJIS = {
  book: '📚',
  series: '📺',
  movie: '🎬',
  game: '🎮',
  education: '🎓',
  sport: '🏃',
};

// Full category definition for DailyFlowScreen and form components
export const getCategories = (t) => ({
  book: { 
    name: t('categories.book'), 
    emoji: CATEGORY_EMOJIS.book, 
    color: CATEGORY_COLORS.book,
    detailLabel: t('activity.pages'),
    detailPlaceholder: t('activity.pages') + ': 150',
    requiresDetail: true,
    hasSpecialInput: false
  },
  series: { 
    name: t('categories.series'), 
    emoji: CATEGORY_EMOJIS.series, 
    color: CATEGORY_COLORS.series,
    detailLabel: t('activity.season') + ' ' + t('common.and') + ' ' + t('activity.episode'),
    detailPlaceholder: t('activity.season') + ': 3, ' + t('activity.episode') + ': 5',
    requiresDetail: true,
    hasSpecialInput: true
  },
  movie: { 
    name: t('categories.movie'), 
    emoji: CATEGORY_EMOJIS.movie, 
    color: CATEGORY_COLORS.movie,
    detailLabel: t('activity.detail') + ' (' + t('activity.optional') + ')',
    detailPlaceholder: t('activity.moviePlaceholder'),
    requiresDetail: false,
    hasSpecialInput: false
  },
  game: { 
    name: t('categories.game'), 
    emoji: CATEGORY_EMOJIS.game, 
    color: CATEGORY_COLORS.game,
    detailLabel: t('activity.detail') + ' (' + t('activity.optional') + ')',
    detailPlaceholder: t('activity.gamePlaceholder'),
    requiresDetail: false,
    hasSpecialInput: false
  },
  education: { 
    name: t('categories.education'), 
    emoji: CATEGORY_EMOJIS.education, 
    color: CATEGORY_COLORS.education,
    detailLabel: t('activity.detail') + ' (' + t('activity.optional') + ')',
    detailPlaceholder: t('activity.educationPlaceholder'),
    requiresDetail: false,
    hasSpecialInput: false
  },
  sport: { 
    name: t('categories.sport'), 
    emoji: CATEGORY_EMOJIS.sport, 
    color: CATEGORY_COLORS.sport,
    detailLabel: t('activity.duration') + ' (' + t('activity.optional') + ')',
    detailPlaceholder: t('activity.sportPlaceholder'),
    requiresDetail: false,
    hasSpecialInput: true
  },
});

// Simplified category definition for ReportsScreen (only name and emoji)
export const getCategoriesSimple = (t) => ({
  book: { name: t('categories.book'), emoji: CATEGORY_EMOJIS.book },
  series: { name: t('categories.series'), emoji: CATEGORY_EMOJIS.series },
  movie: { name: t('categories.movie'), emoji: CATEGORY_EMOJIS.movie },
  game: { name: t('categories.game'), emoji: CATEGORY_EMOJIS.game },
  education: { name: t('categories.education'), emoji: CATEGORY_EMOJIS.education },
  sport: { name: t('categories.sport'), emoji: CATEGORY_EMOJIS.sport },
});

// Category definition for GoalModal (with translation keys and units)
export const getCategoriesForGoals = (t) => ({
  book: { 
    nameKey: 'categories.book', 
    emoji: CATEGORY_EMOJIS.book, 
    unitKey: 'goals.pages' 
  },
  movie: { 
    nameKey: 'categories.movie', 
    emoji: CATEGORY_EMOJIS.movie, 
    unitKey: 'goals.movies' 
  },
  series: { 
    nameKey: 'categories.series', 
    emoji: CATEGORY_EMOJIS.series, 
    unitKey: 'goals.episodes' 
  },
  game: { 
    nameKey: 'categories.game', 
    emoji: CATEGORY_EMOJIS.game, 
    unitKey: 'goals.games' 
  },
  education: { 
    nameKey: 'categories.education', 
    emoji: CATEGORY_EMOJIS.education, 
    unitKey: 'goals.educations' 
  },
  sport: { 
    nameKey: 'categories.sport', 
    emoji: CATEGORY_EMOJIS.sport, 
    unitKey: 'goals.hours' 
  },
});

// Get all category keys
export const getCategoryKeys = () => Object.keys(CATEGORY_EMOJIS);

