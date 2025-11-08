import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllActivitiesFromFirebase } from '../services/firebaseService';
import { getCurrentUser } from '../services/authService';
import { removeDuplicates } from '../utils/commonUtils';

/**
 * Custom hook for loading activities from Firebase or AsyncStorage
 * Handles both logged-in and non-logged-in user scenarios
 */
export const useActivities = (options = {}) => {
  const { autoLoad = true, onFocus = false } = options;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      
      if (!user) {
        // Get data only from AsyncStorage for non-logged-in users
        const allKeys = await AsyncStorage.getAllKeys();
        const activityKeys = allKeys.filter(key => key.startsWith('activities_'));
        
        if (activityKeys.length === 0) {
          setActivities([]);
          return;
        }
        
        const allActivities = [];
        for (const key of activityKeys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const activities = JSON.parse(stored);
            if (Array.isArray(activities)) {
              allActivities.push(...activities);
            }
          }
        }
        
        // Duplicate check
        const uniqueActivities = removeDuplicates(allActivities);
        setActivities(uniqueActivities);
        return;
      }

      // Get data from Firebase for logged-in users
      try {
        const firebaseActivities = await getAllActivitiesFromFirebase();
        if (firebaseActivities.length > 0) {
          // Duplicate check
          const uniqueActivities = removeDuplicates(firebaseActivities);
          setActivities(uniqueActivities);
          return;
        }
      } catch (firebaseError) {
        console.error('Firebase activity loading error:', firebaseError);
      }

      // If cannot get data from Firebase, get from AsyncStorage (user-specific)
      const allKeys = await AsyncStorage.getAllKeys();
      const userSpecificKeys = allKeys.filter(key => 
        key.startsWith(`activities_${user.uid}_`)
      );
      
      if (userSpecificKeys.length === 0) {
        setActivities([]);
        return;
      }
      
      // Get data from all user-specific activity keys
      const allActivities = [];
      for (const key of userSpecificKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const activities = JSON.parse(stored);
          if (Array.isArray(activities)) {
            allActivities.push(...activities);
          }
        }
      }
      
      // Duplicate check
      const uniqueActivities = removeDuplicates(allActivities);
      setActivities(uniqueActivities);
    } catch (error) {
      console.error('Activity loading error:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadActivities();
    }
  }, [autoLoad, loadActivities]);

  return {
    activities,
    setActivities,
    loadActivities,
    loading
  };
};

