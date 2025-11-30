import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatLocalDate } from '../utils/dateUtils';

// Get user ID (using simple ID for now)
const getUserId = () => {
  // Firebase Auth will be used in real application
  const user = auth.currentUser;
  return user ? user.uid : 'user_123'; // Temporary user ID
};

// Activity collection reference
const getActivitiesCollection = () => {
  const userId = getUserId();
  return collection(db, 'users', userId, 'activities');
};

// Add activity
export const addActivityToFirebase = async (activity) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const activitiesRef = getActivitiesCollection();
    const docRef = await addDoc(activitiesRef, {
      ...activity,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Firebase add activity error:', error);
    throw error;
  }
};

// Update activity
export const updateActivityInFirebase = async (activityId, activityData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const activitiesRef = getActivitiesCollection();
    const activityDoc = doc(activitiesRef, activityId);
    
    // Check if document exists
    const docSnapshot = await getDoc(activityDoc);
    
    if (docSnapshot.exists()) {
      // If document exists, update it
      await updateDoc(activityDoc, {
        ...activityData,
        updatedAt: serverTimestamp()
      });
    } else {
      // If document doesn't exist, try to find it by the 'id' field in the data
      // This handles cases where the document ID doesn't match the activity.id
      const querySnapshot = await getDocs(query(
        activitiesRef,
        where('id', '==', activityData.id || activityId)
      ));
      
      if (!querySnapshot.empty) {
        // Found existing document with matching id field, update it
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          ...activityData,
          updatedAt: serverTimestamp()
        });
      } else {
        // No existing document found, this shouldn't happen for goal completion
        // Log warning but don't create duplicate
        console.warn('Activity not found in Firebase for update:', activityId);
        // Don't create new document to avoid duplicates
      }
    }
  } catch (error) {
    console.error('Firebase update activity error:', error);
    // Continue even on error (can continue running locally)
    // throw error; // Temporarily removed error throwing
  }
};

// Delete activity
export const deleteActivityFromFirebase = async (activityId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const activitiesRef = getActivitiesCollection();
    const activityDoc = doc(activitiesRef, activityId);
    
    // Check if document exists
    const docSnapshot = await getDoc(activityDoc);
    
    if (docSnapshot.exists()) {
      // If document exists, delete it
      await deleteDoc(activityDoc);
    } else {
      // If document doesn't exist by ID, try to find it by the 'id' field in the data
      const querySnapshot = await getDocs(query(
        activitiesRef,
        where('id', '==', activityId)
      ));
      
      if (!querySnapshot.empty) {
        // Found existing document with matching id field, delete it
        const existingDoc = querySnapshot.docs[0];
        await deleteDoc(existingDoc.ref);
      } else {
        // Also try to find by firebaseId field (for activities that were synced)
        const querySnapshot2 = await getDocs(query(
          activitiesRef,
          where('firebaseId', '==', activityId)
        ));
        
        if (!querySnapshot2.empty) {
          const existingDoc = querySnapshot2.docs[0];
          await deleteDoc(existingDoc.ref);
        } else {
          console.warn('Activity not found in Firebase for deletion:', activityId);
        }
      }
    }
  } catch (error) {
    console.error('Firebase delete activity error:', error);
    throw error;
  }
};

// Get activities for specific date
export const getActivitiesFromFirebase = async (date) => {
  try {
    const activitiesRef = getActivitiesCollection();
    const dateStr = formatLocalDate(date);
    
    // Get all activities, filter on client-side (doesn't require index)
    const querySnapshot = await getDocs(activitiesRef);
    const activities = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date === dateStr) {
        activities.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Sort on client-side
    return activities.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.timestamp).getTime();
      const bTime = new Date(b.createdAt || b.timestamp).getTime();
      return bTime - aTime; // Most recent first
    });
  } catch (error) {
    console.error('Firebase fetch activity error:', error);
    throw error;
  }
};

// Get all activities
export const getAllActivitiesFromFirebase = async () => {
  try {
    const activitiesRef = getActivitiesCollection();
    const q = query(activitiesRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const activities = [];
    
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return activities;
  } catch (error) {
    console.error('Firebase fetch all activities error:', error);
    throw error;
  }
};

// Real-time listening
export const subscribeToActivities = (date, callback) => {
  try {
    const activitiesRef = getActivitiesCollection();
    const dateStr = formatLocalDate(date);
    
    const q = query(
      activitiesRef,
      where('date', '==', dateStr),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(activities);
    });
  } catch (error) {
    console.error('Firebase real-time listener error:', error);
    throw error;
  }
};

// Data synchronization - from AsyncStorage to Firebase
export const syncLocalDataToFirebase = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return; // Don't sync for non-logged-in users
    }

    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Get existing activities from Firebase (for duplicate check)
    let existingActivities = [];
    try {
      existingActivities = await getAllActivitiesFromFirebase();
    } catch (error) {
      console.error('Firebase fetch existing activities error:', error);
    }
    
    // Convert existing activity IDs to set (for quick check)
    const existingIds = new Set();
    existingActivities.forEach(activity => {
      // Check both id and timestamp+title combination
      if (activity.id) existingIds.add(activity.id);
      if (activity.timestamp && activity.title) {
        existingIds.add(`${activity.timestamp}_${activity.title}`);
      }
    });
    
    // Check both non-logged-in user format and logged-in user format
    const activityKeys = allKeys.filter(key => {
      // Non-logged-in user format: activities_YYYY-MM-DD
      // If there's no other _ after activities_ (only date exists)
      if (key.startsWith('activities_')) {
        const afterPrefix = key.substring('activities_'.length);
        // If directly date format after activities_ (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(afterPrefix)) {
          return true;
        }
      }
      // Logged-in user format: activities_${user.uid}_YYYY-MM-DD
      if (key.startsWith(`activities_${user.uid}_`)) {
        return true;
      }
      return false;
    });
    
    let syncedCount = 0;
    let skippedCount = 0;
    
    for (const key of activityKeys) {
      const storedActivities = await AsyncStorage.getItem(key);
      if (storedActivities) {
        const activities = JSON.parse(storedActivities);
        if (!Array.isArray(activities)) continue;
        
        // Add each activity to Firebase (with duplicate check)
        for (const activity of activities) {
          try {
            // Duplicate check: ID or timestamp+title combination
            const activityId = activity.id || `${activity.timestamp}_${activity.title}`;
            if (existingIds.has(activityId)) {
              skippedCount++;
              continue; // Already in Firebase, skip
            }
            
            // Add to Firebase
            const firebaseId = await addActivityToFirebase({
              ...activity,
              date: activity.date || key.replace(/^activities(_\w+)?_/, ''),
              synced: true
            });
            
            if (firebaseId) {
              syncedCount++;
              // Add ID to existingIds (to prevent duplicates within same batch)
              existingIds.add(firebaseId);
              if (activity.timestamp && activity.title) {
                existingIds.add(`${activity.timestamp}_${activity.title}`);
              }
            }
          } catch (error) {
            console.error('Activity sync error:', error);
          }
        }
      }
    }
    
    console.log(`Firebase sync completed: ${syncedCount} activities added, ${skippedCount} activities skipped (duplicate)`);
    
  } catch (error) {
    console.error('Data sync error:', error);
    throw error;
  }
};

// Download data from Firebase to AsyncStorage
export const syncFirebaseToLocal = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const allActivities = await getAllActivitiesFromFirebase();
    
    // Group by date
    const activitiesByDate = {};
    allActivities.forEach(activity => {
      const date = activity.date || formatLocalDate(new Date(activity.timestamp));
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = [];
      }
      activitiesByDate[date].push(activity);
    });
    
    // Save to AsyncStorage for each date
    for (const [date, activities] of Object.entries(activitiesByDate)) {
      await AsyncStorage.setItem(`activities_${date}`, JSON.stringify(activities));
    }
    
  } catch (error) {
    console.error('Firebase download data error:', error);
    throw error;
  }
};
