import { useState, useEffect, useCallback } from 'react';
import goalService from '../services/goalService';
import { getCategoryKeys } from '../utils/categoryUtils';

// Initial goals state structure
const createInitialGoalsState = () => {
  const categories = getCategoryKeys();
  const emptyGoals = {};
  categories.forEach(category => {
    emptyGoals[category] = null;
  });
  
  return {
    weekly: { ...emptyGoals },
    monthly: { ...emptyGoals }
  };
};

/**
 * Custom hook for managing goals state
 * Provides goals loading, state management, and goal service listener integration
 */
export const useGoals = () => {
  const [goals, setGoals] = useState(createInitialGoalsState);
  const [loading, setLoading] = useState(true);

  // Load goals from service - memoized with useCallback
  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const loadedGoals = await goalService.getGoals();
      setGoals(loadedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and set up listener
  useEffect(() => {
    loadGoals();
    
    const unsubscribe = goalService.addListener((updatedGoals) => {
      setGoals(updatedGoals);
    });

    return unsubscribe;
  }, []);

  return {
    goals,
    loading,
    loadGoals,
    setGoals
  };
};

