import { useMemo } from 'react';
import { getWeekStart, formatLocalDate } from '../utils/dateUtils';
import { getCategoriesSimple } from '../utils/categoryUtils';

// Weekly category data
export const useWeeklyCategoryData = (weeklyData, t) => {
  const CATEGORIES = getCategoriesSimple(t);
  
  return useMemo(() => {
    const categoryData = {};
    
    // Get all activities from weeklyData state, exclude goals
    const allWeekActivities = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    Object.values(weeklyData).forEach(dayData => {
      if (dayData.activities) {
        const filteredActivities = dayData.activities.filter(activity => {
          const activityDateObj = activity.date ? new Date(activity.date + 'T00:00:00') : new Date(activity.timestamp);
          activityDateObj.setHours(0, 0, 0, 0);
          const isFutureDate = activityDateObj > today;
          const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
          return !isGoal;
        });
        allWeekActivities.push(...filteredActivities);
      }
    });
    
    allWeekActivities.forEach(activity => {
      const category = activity.type || 'sport';
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          categoryInfo: CATEGORIES[category] || { name: t('categories.sport'), emoji: '🏃' },
          groupedActivities: {},
          uniqueDays: new Set(),
        };
      }
      
      const activityKey = activity.title || activity.name;
      if (!categoryData[category].groupedActivities[activityKey]) {
        categoryData[category].groupedActivities[activityKey] = {
          name: activity.title || activity.name,
          count: 0,
          details: [],
          activities: [],
          isCompleted: false,
        };
      }
      
      categoryData[category].count++;
      categoryData[category].groupedActivities[activityKey].count++;
      categoryData[category].groupedActivities[activityKey].activities.push(activity);
      
      if (activity.detail) {
        categoryData[category].groupedActivities[activityKey].details.push(activity.detail);
      }
      
      if (activity.isCompleted) {
        categoryData[category].groupedActivities[activityKey].isCompleted = true;
      }
      
      // Unique days tracking
      const activityDate = new Date(activity.timestamp).toDateString();
      categoryData[category].uniqueDays.add(activityDate);
    });
    
    return categoryData;
  }, [weeklyData, t]);
};

// Monthly category data
export const useMonthlyCategoryData = (activities, currentMonth, t) => {
  const CATEGORIES = getCategoriesSimple(t);
  
  return useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activityDateObj = activity.date ? new Date(activity.date + 'T00:00:00') : new Date(activity.timestamp);
      activityDateObj.setHours(0, 0, 0, 0);
      const isFutureDate = activityDateObj > today;
      const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
      return activityDate >= monthStart && activityDate <= monthEnd && !isGoal;
    });

    const categoryData = {};
    
    monthActivities.forEach(activity => {
      const category = activity.type || 'sport';
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          categoryInfo: CATEGORIES[category] || { name: t('categories.sport'), emoji: '🏃' },
          groupedActivities: {},
          uniqueDays: new Set(),
        };
      }
      
      const activityKey = activity.title || activity.name;
      if (!categoryData[category].groupedActivities[activityKey]) {
        categoryData[category].groupedActivities[activityKey] = {
          name: activity.title || activity.name,
          count: 0,
          details: [],
          activities: [],
          isCompleted: false,
        };
      }
      
      categoryData[category].count++;
      categoryData[category].groupedActivities[activityKey].count++;
      categoryData[category].groupedActivities[activityKey].activities.push(activity);
      
      if (activity.detail) {
        categoryData[category].groupedActivities[activityKey].details.push(activity.detail);
      }
      
      if (activity.isCompleted) {
        categoryData[category].groupedActivities[activityKey].isCompleted = true;
      }
      
      // Unique days tracking
      const activityDate = new Date(activity.timestamp).toDateString();
      categoryData[category].uniqueDays.add(activityDate);
    });
    
    return categoryData;
  }, [activities, currentMonth, t]);
};

// Yearly category data
export const useYearlyCategoryData = (activities, currentYear, t) => {
  const CATEGORIES = getCategoriesSimple(t);
  
  return useMemo(() => {
    const yearStart = new Date(currentYear.getFullYear(), 0, 1);
    const yearEnd = new Date(currentYear.getFullYear(), 11, 31, 23, 59, 59);

    const yearActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activityDateObj = activity.date ? new Date(activity.date + 'T00:00:00') : new Date(activity.timestamp);
      activityDateObj.setHours(0, 0, 0, 0);
      const isFutureDate = activityDateObj > today;
      const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
      return activityDate >= yearStart && activityDate <= yearEnd && !isGoal;
    });

    const categoryData = {};
    
    yearActivities.forEach(activity => {
      const category = activity.type || 'sport';
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          categoryInfo: CATEGORIES[category] || { name: t('categories.sport'), emoji: '🏃' },
          groupedActivities: {},
          uniqueDays: new Set(),
          monthlyBreakdown: {},
        };
      }
      
      const activityKey = activity.title || activity.name;
      if (!categoryData[category].groupedActivities[activityKey]) {
        categoryData[category].groupedActivities[activityKey] = {
          name: activity.title || activity.name,
          count: 0,
          details: [],
          activities: [],
          isCompleted: false,
        };
      }
      
      categoryData[category].count++;
      categoryData[category].groupedActivities[activityKey].count++;
      categoryData[category].groupedActivities[activityKey].activities.push(activity);
      
      if (activity.detail) {
        categoryData[category].groupedActivities[activityKey].details.push(activity.detail);
      }
      
      if (activity.isCompleted) {
        categoryData[category].groupedActivities[activityKey].isCompleted = true;
      }
      
      // Unique days tracking
      const activityDate = new Date(activity.timestamp).toDateString();
      categoryData[category].uniqueDays.add(activityDate);
      
      // Monthly breakdown
      const activityMonth = new Date(activity.timestamp).getMonth();
      if (!categoryData[category].monthlyBreakdown[activityMonth]) {
        categoryData[category].monthlyBreakdown[activityMonth] = 0;
      }
      categoryData[category].monthlyBreakdown[activityMonth]++;
    });
    
    return categoryData;
  }, [activities, currentYear, t]);
};

// Monthly daily data
export const useMonthlyDailyData = (activities, currentMonth) => {
  return useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activityDateObj = activity.date ? new Date(activity.date + 'T00:00:00') : new Date(activity.timestamp);
      activityDateObj.setHours(0, 0, 0, 0);
      const isFutureDate = activityDateObj > today;
      const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
      return activityDate >= monthStart && activityDate <= monthEnd && !isGoal;
    });

    const daysData = {};
    
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = formatLocalDate(date);
      
      const dayActivities = monthActivities.filter(activity => {
        const activityDate = formatLocalDate(new Date(activity.timestamp));
        return activityDate === dateKey;
      });
      
      if (dayActivities.length > 0) {
        daysData[dateKey] = {
          date: date,
          activities: dayActivities,
          count: dayActivities.length,
        };
      }
    }
    
    return daysData;
  }, [activities, currentMonth]);
};

// Goal progress calculation
export const useGoalProgress = (category, period, goals, categoryData) => {
  return useMemo(() => {
    const goal = goals[period]?.[category];
    if (!goal) return null;

    const categoryInfo = categoryData[category];
    
    if (!categoryInfo) {
      return { current: 0, goal, progress: 0, completed: false };
    }

    let current = 0;
    
    if (category === 'book') {
      // Total pages
      Object.values(categoryInfo.groupedActivities || {}).forEach(activityGroup => {
        activityGroup.details.forEach(detail => {
          const pages = parseInt(detail) || 0;
          current += pages;
        });
      });
    } else if (category === 'series') {
      // Total episodes
      Object.values(categoryInfo.groupedActivities || {}).forEach(activityGroup => {
        activityGroup.details.forEach(detail => {
          if (detail) {
            const parts = detail.split(';');
            parts.forEach(part => {
              const episodeParts = part.split(',').slice(1);
              episodeParts.forEach(ep => {
                const episodes = ep.trim().split(',').length;
                current += episodes;
              });
            });
          }
        });
      });
    } else if (category === 'sport') {
      // Total hours
      Object.values(categoryInfo.groupedActivities || {}).forEach(activityGroup => {
        activityGroup.details.forEach(detail => {
          if (detail) {
            const detailLower = detail.toLowerCase().trim();
            const hoursMatch = detailLower.match(/(\d+\.?\d*)\s*(saat|hour|hours|s|h)/);
            const minutesMatch = detailLower.match(/(\d+\.?\d*)\s*(dakika|minute|minutes|d|min|m)/);
            
            if (hoursMatch || minutesMatch) {
              const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
              const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0;
              current += hours + (minutes / 60);
            } else if (detail.includes(':')) {
              const parts = detail.split(':');
              if (parts.length === 2) {
                const hours = parseFloat(parts[0]) || 0;
                const minutes = parseFloat(parts[1]) || 0;
                current += hours + (minutes / 60);
              }
            } else {
              const num = parseFloat(detail);
              if (!isNaN(num)) {
                current += num / 60; // Assume minutes if just a number
              }
            }
          }
        });
      });
    } else {
      // Count for movie, game, education
      current = categoryInfo.count || 0;
    }

    const progress = Math.min(100, (current / goal) * 100);
    const completed = current >= goal;
    
    return { current, goal, progress, completed };
  }, [category, period, goals, categoryData]);
};

// Helper: Weekly days list
export const useWeekDays = (currentWeek) => {
  return useMemo(() => {
    const weekDays = [];
    const weekStart = getWeekStart(currentWeek);
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  }, [currentWeek]);
};

// Helper: Get categories (simple format for ReportsScreen)
export const useCategories = (t) => {
  return useMemo(() => getCategoriesSimple(t), [t]);
};

