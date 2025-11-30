import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllActivitiesFromFirebase } from '../services/firebaseService';
import { getCurrentUser } from '../services/authService';
import { formatLocalDate } from '../utils/dateUtils';

/**
 * Custom hook for calculating activity streaks
 * Handles both logged-in and non-logged-in user scenarios
 */
export const useStreakCalculation = () => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const calculateStreak = useCallback(async () => {
    try {
      const user = getCurrentUser();
      let allActivities = [];
      
      if (!user) {
        // Get all activities from AsyncStorage for non-logged-in users
        const allKeys = await AsyncStorage.getAllKeys();
        const activityKeys = allKeys.filter(key => key.startsWith('activities_'));
        
        for (const key of activityKeys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const activities = JSON.parse(stored);
            if (Array.isArray(activities)) {
              allActivities.push(...activities);
            }
          }
        }
      } else {
        // Get all activities from Firebase for logged-in users
        try {
          allActivities = await getAllActivitiesFromFirebase();
        } catch (error) {
          // If Firebase fails, get from AsyncStorage
          const allKeys = await AsyncStorage.getAllKeys();
          const userSpecificKeys = allKeys.filter(key => 
            key.startsWith(`activities_${user.uid}_`)
          );
          
          for (const key of userSpecificKeys) {
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
              const activities = JSON.parse(stored);
              if (Array.isArray(activities)) {
                allActivities.push(...activities);
              }
            }
          }
        }
      }

      // Filter out goal activities - only include activities where isGoal is false/undefined
      // (completed goals automatically have isGoal: false)
      const filteredActivities = allActivities.filter(activity => {
        return !activity.isGoal;
      });

      // Group by dates (only non-goal activities)
      // Normalize all dates to YYYY-MM-DD format using local timezone
      const datesWithActivities = new Set();
      filteredActivities.forEach(activity => {
        let dateStr;
        if (activity.date) {
          // If date field exists, use it directly (already in YYYY-MM-DD format)
          dateStr = activity.date;
        } else if (activity.timestamp) {
          // Convert timestamp to local date string (YYYY-MM-DD)
          dateStr = formatLocalDate(new Date(activity.timestamp));
        } else {
          // Fallback: use current date
          dateStr = formatLocalDate(new Date());
        }
        datesWithActivities.add(dateStr);
      });

      // Today's date in local timezone (YYYY-MM-DD format)
      const today = new Date();
      const todayStr = formatLocalDate(today);

      // Calculate current streak (backwards from today)
      let currentStreakCount = 0;
      
      // Get sorted dates (most recent first)
      const sortedDates = Array.from(datesWithActivities).sort().reverse();
      
      if (sortedDates.length === 0) {
        setCurrentStreak(0);
        setLongestStreak(0);
        return;
      }

      // Calculate yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatLocalDate(yesterday);
      
      // Determine starting point for streak calculation
      // Streak is active if there's activity today OR yesterday
      let startDateStr = null;
      
      if (datesWithActivities.has(todayStr)) {
        // Today has activity - start from today
        startDateStr = todayStr;
      } else if (datesWithActivities.has(yesterdayStr)) {
        // Today has no activity, but yesterday has - start from yesterday
        startDateStr = yesterdayStr;
      } else {
        // Neither today nor yesterday has activity - streak is broken
        currentStreakCount = 0;
      }
      
      // If streak is still active, count backwards
      if (startDateStr) {
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        let checkDate = new Date(startYear, startMonth - 1, startDay);
        checkDate.setHours(0, 0, 0, 0);
        
        // Count consecutive days backwards
        while (true) {
          const checkDateStr = formatLocalDate(checkDate);
          
          if (!datesWithActivities.has(checkDateStr)) {
            break;
          }
          
          currentStreakCount++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      // Longest streak calculate (sort dates from oldest to newest)
      const sortedDatesOldestFirst = Array.from(datesWithActivities).sort();
      let longestStreakCount = 0;
      let tempStreak = 0;
      let lastDate = null;

      for (const dateStr of sortedDatesOldestFirst) {
        // Parse date correctly (YYYY-MM-DD format with local timezone)
        const [year, month, day] = dateStr.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        currentDate.setHours(0, 0, 0, 0);
        
        if (lastDate === null) {
          tempStreak = 1;
          longestStreakCount = 1;
        } else {
          const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            tempStreak++;
            longestStreakCount = Math.max(longestStreakCount, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
        lastDate = currentDate;
      }

      setCurrentStreak(currentStreakCount);
      setLongestStreak(longestStreakCount);
    } catch (error) {
      console.error('Streak calculation error:', error);
    }
  }, []);

  return {
    currentStreak,
    longestStreak,
    calculateStreak
  };
};
