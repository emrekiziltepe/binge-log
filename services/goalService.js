import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './authService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getWeekStart, formatLocalDate } from '../utils/dateUtils';

class GoalService {
  constructor() {
    this.listeners = [];
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(goals) {
    this.listeners.forEach(callback => callback(goals));
  }

  async getGoalKey() {
    const user = getCurrentUser();
    if (user) {
      return `goals_${user.uid}`;
    }
    return 'goals';
  }

  getDefaultGoals() {
    return {
      weekly: {},  // { "2024-01-01": { book: 5, movie: 3, ... }, ... }
      monthly: {}  // { "2024-01": { book: 20, movie: 12, ... }, ... }
    };
  }

  // Get week key from date (week start date as YYYY-MM-DD)
  getWeekKey(date) {
    const weekStart = getWeekStart(date);
    return formatLocalDate(weekStart);
  }

  // Get month key from date (YYYY-MM)
  getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Migrate old goals format to new date-based format
  migrateOldGoals(oldGoals) {
    if (!oldGoals || typeof oldGoals !== 'object') {
      return this.getDefaultGoals();
    }

    // Check if already in new format (has date keys like "2024-01-01" or "2024-01")
    const hasNewFormat = oldGoals.weekly && Object.keys(oldGoals.weekly).some(key => {
      // Check if key looks like a date (YYYY-MM-DD for weekly or YYYY-MM for monthly)
      return /^\d{4}-\d{2}(-\d{2})?$/.test(key);
    });
    if (hasNewFormat) {
      return oldGoals;
    }

    // Migrate old format to new format
    const newGoals = {
      weekly: {},
      monthly: {}
    };

    // If old format exists, copy to current week/month
    const now = new Date();
    const currentWeekKey = this.getWeekKey(now);
    const currentMonthKey = this.getMonthKey(now);

    if (oldGoals.weekly && typeof oldGoals.weekly === 'object') {
      // Check if it's old format (has category keys directly)
      if (oldGoals.weekly.book !== undefined || oldGoals.weekly.movie !== undefined) {
        newGoals.weekly[currentWeekKey] = { ...oldGoals.weekly };
      } else {
        // Already in new format
        newGoals.weekly = oldGoals.weekly;
      }
    }

    if (oldGoals.monthly && typeof oldGoals.monthly === 'object') {
      // Check if it's old format (has category keys directly)
      if (oldGoals.monthly.book !== undefined || oldGoals.monthly.movie !== undefined) {
        newGoals.monthly[currentMonthKey] = { ...oldGoals.monthly };
      } else {
        // Already in new format
        newGoals.monthly = oldGoals.monthly;
      }
    }

    return newGoals;
  }

  async getGoalsFromFirebase() {
    try {
      const user = getCurrentUser();
      if (!user) {
        return null;
      }

      const goalsRef = doc(db, 'users', user.uid, 'goals', 'userGoals');
      const goalsDoc = await getDoc(goalsRef);
      
      if (goalsDoc.exists()) {
        return goalsDoc.data();
      }
      return null;
    } catch (error) {
      // Silently fail if permissions error - will use AsyncStorage instead
      // Only log non-permission errors to reduce console noise
      if (error.code && error.code !== 'permission-denied' && error.code !== 'permissions-denied') {
        console.error('Firebase fetch goals error:', error);
      }
      return null;
    }
  }

  async saveGoalsToFirebase(goals) {
    try {
      const user = getCurrentUser();
      if (!user) {
        return false;
      }

      const goalsRef = doc(db, 'users', user.uid, 'goals', 'userGoals');
      await setDoc(goalsRef, goals, { merge: true });
      return true;
    } catch (error) {
      console.error('Firebase save goals error:', error);
      return false;
    }
  }

  async getGoals() {
    try {
      const user = getCurrentUser();
      const key = await this.getGoalKey();
      
      // Try Firebase first for logged-in users
      if (user) {
        try {
          const firebaseGoals = await this.getGoalsFromFirebase();
          if (firebaseGoals) {
            // Migrate if needed
            const migratedGoals = this.migrateOldGoals(firebaseGoals);
            // If obtained from Firebase, also save to AsyncStorage (for cache)
            await AsyncStorage.setItem(key, JSON.stringify(migratedGoals));
            return migratedGoals;
          }
        } catch (firebaseError) {
          console.error('Firebase goal loading error:', firebaseError);
        }
      }

      // If cannot get from Firebase or not logged in, get from AsyncStorage
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const goals = JSON.parse(stored);
        // Migrate if needed
        const migratedGoals = this.migrateOldGoals(goals);
        // Also save to Firebase for logged-in user (for sync)
        if (user) {
          this.saveGoalsToFirebase(migratedGoals).catch(err => {
            console.error('Firebase goal sync error:', err);
          });
        }
        // Save migrated goals back to AsyncStorage
        if (migratedGoals !== goals) {
          await AsyncStorage.setItem(key, JSON.stringify(migratedGoals));
        }
        return migratedGoals;
      }

      // Return default goals if not found anywhere
      return this.getDefaultGoals();
    } catch (error) {
      console.error('Fetch goals error:', error);
      return this.getDefaultGoals();
    }
  }

  async setCategoryGoal(period, category, value, date = new Date()) {
    try {
      const key = await this.getGoalKey();
      // Get current goals first
      let goals = await this.getGoals();
      
      // Migrate if needed
      goals = this.migrateOldGoals(goals);
      
      // Create if period doesn't exist
      if (!goals[period]) {
        goals[period] = {};
      }
      
      // Get date key
      const dateKey = period === 'weekly' ? this.getWeekKey(date) : this.getMonthKey(date);
      
      // Create date entry if doesn't exist
      if (!goals[period][dateKey]) {
        goals[period][dateKey] = {
          book: null,
          movie: null,
          series: null,
          game: null,
          education: null,
          sport: null,
        };
      }
      
      // Set new value
      goals[period][dateKey][category] = value === null || value === '' || value === undefined ? null : parseFloat(value);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(goals));
      
      // Also save to Firebase for logged-in users
      const user = getCurrentUser();
      if (user) {
        try {
          await this.saveGoalsToFirebase(goals);
        } catch (firebaseError) {
          console.error('Firebase goal save error:', firebaseError);
          // Continue even if Firebase error
        }
      }
      
      // Notify listeners
      this.notifyListeners(goals);
      return goals;
    } catch (error) {
      console.error('Save goals error:', error);
      throw error;
    }
  }

  async deleteCategoryGoal(period, category, date = new Date()) {
    try {
      const key = await this.getGoalKey();
      let goals = await this.getGoals();
      
      // Migrate if needed
      goals = this.migrateOldGoals(goals);
      
      // Get date key
      const dateKey = period === 'weekly' ? this.getWeekKey(date) : this.getMonthKey(date);
      
      if (goals[period] && goals[period][dateKey] && goals[period][dateKey][category] !== undefined) {
        goals[period][dateKey][category] = null;
        
        // Remove date entry if all goals are null
        const hasAnyGoal = Object.values(goals[period][dateKey]).some(v => v !== null && v !== undefined);
        if (!hasAnyGoal) {
          delete goals[period][dateKey];
        }
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(key, JSON.stringify(goals));
        
        // Also save to Firebase for logged-in users
        const user = getCurrentUser();
        if (user) {
          await this.saveGoalsToFirebase(goals);
        }
        
        this.notifyListeners(goals);
      }
      return goals;
    } catch (error) {
      console.error('Delete goals error:', error);
      throw error;
    }
  }

  // Get goal for a specific period and date
  getCategoryGoal(goals, period, category, date) {
    if (!goals || !goals[period]) return null;
    
    const dateKey = period === 'weekly' ? this.getWeekKey(date) : this.getMonthKey(date);
    return goals[period][dateKey]?.[category] ?? null;
  }
}

export default new GoalService();

