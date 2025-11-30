/**
 * Utility functions for activity-related operations
 */

/**
 * Return color based on rating (1-10 scale)
 */
export const getRatingColor = (rating) => {
  if (rating === 1) return '#dc2626'; // Dark red (1)
  if (rating === 2) return '#ef4444'; // Light red (2)
  if (rating === 3) return '#ea580c'; // Dark orange (3)
  if (rating === 4) return '#f97316'; // Light orange (4)
  if (rating === 5) return '#d97706'; // Dark yellow (5)
  if (rating === 6) return '#eab308'; // Light yellow (6)
  if (rating === 7) return '#16a34a'; // Dark green (7)
  if (rating === 8) return '#22c55e'; // Light green (8)
  if (rating === 9) return '#15803d'; // Dark green (9)
  return '#166534'; // Darkest green (10)
};

/**
 * Format series detail string
 * Handles multiple season-episode pairs separated by semicolons
 */
export const formatSeriesDetail = (detail, t) => {
  if (!detail) return '';
  
  // Multiple season check (semicolon separated)
  if (detail.includes(';')) {
    const seasonEpisodes = detail.split(';').map(se => se.trim());
    const formatted = seasonEpisodes.map(se => {
      const parts = se.split(',').map(part => part.trim());
      const season = parts[0];
      const episodes = parts.slice(1);
      
      if (episodes.length === 0) return `${t('activity.season')} ${season}`;
      return `${t('activity.season')} ${season}, ${t('activity.episode')}: ${episodes.join(',')}`;
    });
    
    return formatted.join('\n');
  }
  
  // Single season format (current logic)
  const parts = detail.split(',').map(part => part.trim());
  const season = parts[0];
  
  if (parts.length === 1) return `${t('activity.season')} ${season}`;
  
  const episodes = parts.slice(1);
  const episodeText = episodes.join(',');
  
  return `${t('activity.season')} ${season}, ${t('activity.episode')}: ${episodeText}`;
};

/**
 * Group activities by category and separate goals
 */
export const groupActivitiesByCategory = (activities, today = new Date()) => {
  today.setHours(0, 0, 0, 0);
  
  const regularActivities = [];
  const goalActivities = [];
  
  activities.forEach(activity => {
    const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
    activityDate.setHours(0, 0, 0, 0);
    const isFutureDate = activityDate > today;
    const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
    
    if (isGoal) {
      goalActivities.push(activity);
    } else {
      regularActivities.push(activity);
    }
  });
  
  const grouped = {};
  
  // Group regular activities by category
  regularActivities.forEach(activity => {
    const category = activity.type;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(activity);
  });
  
  // Sort categories alphabetically
  const sortedCategories = Object.keys(grouped).sort();
  const result = {};
  
  sortedCategories.forEach(category => {
    result[category] = grouped[category];
  });
  
  // Add goals section if there are goal activities
  if (goalActivities.length > 0) {
    result['_goals'] = goalActivities;
  }
  
  return result;
};

/**
 * Calculate daily statistics from activities
 */
export const calculateDailyStats = (activities) => {
  const categoryCount = {};
  let mostActiveCategory = null;
  let maxCount = 0;

  activities.forEach(activity => {
    const category = activity.type;
    categoryCount[category] = (categoryCount[category] || 0) + 1;
    
    if (categoryCount[category] > maxCount) {
      maxCount = categoryCount[category];
      mostActiveCategory = category;
    }
  });

  return {
    totalActivities: activities.length,
    categoryCount,
    mostActiveCategory
  };
};
