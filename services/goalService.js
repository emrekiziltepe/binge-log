import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './authService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
      weekly: {
        book: null,      // page count
        movie: null,     // movie count
        series: null,    // episode count
        game: null,      // game count
        education: null, // education count
        sport: null,     // hours/minutes
      },
      monthly: {
        book: null,
        movie: null,
        series: null,
        game: null,
        education: null,
        sport: null,
      }
    };
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
            // If obtained from Firebase, also save to AsyncStorage (for cache)
            await AsyncStorage.setItem(key, JSON.stringify(firebaseGoals));
            return firebaseGoals;
          }
        } catch (firebaseError) {
          console.error('Firebase goal loading error:', firebaseError);
        }
      }

      // If cannot get from Firebase or not logged in, get from AsyncStorage
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const goals = JSON.parse(stored);
        // Also save to Firebase for logged-in user (for sync)
        if (user) {
          this.saveGoalsToFirebase(goals).catch(err => {
            console.error('Firebase goal sync error:', err);
          });
        }
        return goals;
      }

      // Return default goals if not found anywhere
      return this.getDefaultGoals();
    } catch (error) {
      console.error('Fetch goals error:', error);
      return this.getDefaultGoals();
    }
  }

  async setCategoryGoal(period, category, value) {
    try {
      const key = await this.getGoalKey();
      // Get current goals first
      let goals = await this.getGoals();
      
      // Create if period doesn't exist
      if (!goals[period]) {
        goals[period] = {
          book: null,
          movie: null,
          series: null,
          game: null,
          education: null,
          sport: null,
        };
      }
      
      // Set new value
      goals[period][category] = value === null || value === '' || value === undefined ? null : parseFloat(value);
      
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

  async deleteCategoryGoal(period, category) {
    try {
      const key = await this.getGoalKey();
      const goals = await this.getGoals();
      if (goals[period] && goals[period][category]) {
        goals[period][category] = null;
        
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
}

export default new GoalService();

