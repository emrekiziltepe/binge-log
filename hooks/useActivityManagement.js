import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, LayoutAnimation } from 'react-native';
import { 
  getActivitiesFromFirebase, 
  addActivityToFirebase, 
  updateActivityInFirebase, 
  deleteActivityFromFirebase,
} from '../services/firebaseService';
import { getCurrentUser } from '../services/authService';
import { formatLocalDate } from '../utils/dateUtils';
import { removeDuplicates } from '../utils/commonUtils';

/**
 * Custom hook for managing activities for a specific date
 * Handles loading, saving, CRUD operations, and Firebase sync
 */
export const useActivityManagement = (currentDate) => {
  const [activities, setActivities] = useState([]);

  const loadActivities = useCallback(async () => {
    try {
      const user = getCurrentUser();
      const dateKey = formatLocalDate(currentDate);
      
      if (!user) {
        // Only fetch from AsyncStorage for non-logged-in users
        const storedActivities = await AsyncStorage.getItem(`activities_${dateKey}`);
        let parsedActivities = [];
        if (storedActivities) {
          parsedActivities = JSON.parse(storedActivities);
        }
        
        // Filter activities: only show goals if their date matches currentDate
        const filteredActivities = parsedActivities.filter(activity => {
          const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
          activityDate.setHours(0, 0, 0, 0);
          const currentDateOnly = new Date(currentDate);
          currentDateOnly.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isFutureDate = activityDate > today;
          const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
          
          // If it's a goal, only show it if the activity date matches current date
          if (isGoal) {
            return activityDate.getTime() === currentDateOnly.getTime();
          }
          // If it's not a goal, show it if it matches current date
          return activity.date === dateKey;
        });
        
        const uniqueActivities = removeDuplicates(filteredActivities);
        setActivities(uniqueActivities);
        return;
      }

      const userSpecificKey = `activities_${user.uid}_${dateKey}`;
      
      // Fetch from Firebase for logged-in users
      try {
        const firebaseActivities = await getActivitiesFromFirebase(currentDate);
        
        // Filter activities: only show goals if their date matches currentDate
        const filteredActivities = firebaseActivities.filter(activity => {
          const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
          activityDate.setHours(0, 0, 0, 0);
          const currentDateOnly = new Date(currentDate);
          currentDateOnly.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isFutureDate = activityDate > today;
          const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
          
          // If it's a goal, only show it if the activity date matches current date
          if (isGoal) {
            return activityDate.getTime() === currentDateOnly.getTime();
          }
          // If it's not a goal, show it if it matches current date
          return activity.date === dateKey;
        });
        
        const uniqueActivities = removeDuplicates(filteredActivities);
        setActivities(uniqueActivities);
        // Also save Firebase data to AsyncStorage (for offline backup) - only save filtered activities for this date
        await AsyncStorage.setItem(userSpecificKey, JSON.stringify(filteredActivities));
      } catch (firebaseError) {
        // Only fetch from AsyncStorage if Firebase fails
        const storedActivities = await AsyncStorage.getItem(userSpecificKey);
        let parsedActivities = [];
        if (storedActivities) {
          parsedActivities = JSON.parse(storedActivities);
        }
        
        // Filter activities: only show goals if their date matches currentDate
        const filteredActivities = parsedActivities.filter(activity => {
          const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
          activityDate.setHours(0, 0, 0, 0);
          const currentDateOnly = new Date(currentDate);
          currentDateOnly.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isFutureDate = activityDate > today;
          const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
          
          // If it's a goal, only show it if the activity date matches current date
          if (isGoal) {
            return activityDate.getTime() === currentDateOnly.getTime();
          }
          // If it's not a goal, show it if it matches current date
          return activity.date === dateKey;
        });
        
        const uniqueActivities = removeDuplicates(filteredActivities);
        setActivities(uniqueActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  }, [currentDate]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const saveActivities = useCallback(async (newActivities, targetDate = null) => {
    try {
      const user = getCurrentUser();
      // Use targetDate if provided (for editing activities on different dates), otherwise use currentDate
      const dateToSave = targetDate || currentDate;
      const dateKey = formatLocalDate(dateToSave);
      
      // Filter activities to only include those for the target date
      const activitiesForDate = newActivities.filter(activity => {
        const activityDate = activity.date || formatLocalDate(new Date(activity.timestamp));
        return activityDate === dateKey;
      });
      
      // Duplicate check
      const uniqueActivities = removeDuplicates(activitiesForDate);
      
      if (!user) {
        // Old format for non-logged-in users
        await AsyncStorage.setItem(`activities_${dateKey}`, JSON.stringify(uniqueActivities));
      } else {
        // User-specific format for logged-in users
        const userSpecificKey = `activities_${user.uid}_${dateKey}`;
        await AsyncStorage.setItem(userSpecificKey, JSON.stringify(uniqueActivities));
      }
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }, [currentDate]);

  return {
    activities,
    setActivities,
    loadActivities,
    saveActivities,
  };
};
