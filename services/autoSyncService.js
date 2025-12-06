import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllActivitiesFromFirebase,
  syncLocalDataToFirebase,
  syncFirebaseToLocal
} from './firebaseService';
import { auth } from '../firebase';
import goalService from './goalService';

class AutoSyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.listeners = [];
    this.offlineQueue = [];
  }

  // Listen to internet status changes
  startListening() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      // Automatically sync when internet comes back
      if (wasOffline && this.isOnline) {
        this.performAutoSync();
      }

      // Notify listeners
      this.notifyListeners();
    });

    // Load queue when app starts
    this.loadOfflineQueue();
  }

  // Register listeners
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress
      });
    });
  }

  // Automatic synchronization
  async performAutoSync() {
    const user = auth.currentUser;
    if (!user || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      // 1. Send local data to Firebase
      await this.syncLocalToFirebase();

      // 2. Get new data from Firebase
      await this.syncFirebaseToLocal();

      // 3. Process offline queue
      await this.processOfflineQueue();

    } catch (error) {
      console.error('Auto sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  // Synchronize local data to Firebase
  async syncLocalToFirebase() {
    try {
      // Sync activities
      await syncLocalDataToFirebase();

      // Sync goals - when getGoals() is called, if logged-in user exists
      // Will automatically get goals from AsyncStorage and save to Firebase
      const user = auth.currentUser;
      if (user) {
        await goalService.getGoals();
      }
    } catch (error) {
      console.error('Local to Firebase sync failed:', error);
      throw error;
    }
  }

  // Synchronize from Firebase to local
  async syncFirebaseToLocal() {
    try {
      // This function is not yet implemented, leaving it empty for now
    } catch (error) {
      console.error('Firebase to Local sync failed:', error);
      throw error;
    }
  }

  // Process offline queue
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Offline operation failed:', operation.type, error);
        // Re-add failed operation to queue
        this.offlineQueue.push(operation);
      }
    }

    // Clear after queue is processed
    await this.saveOfflineQueue();
  }

  // Execute offline operation
  async executeOperation(operation) {
    const { type, data } = operation;

    switch (type) {
      case 'ADD_ACTIVITY':
        // Add activity to Firebase
        break;
      case 'UPDATE_ACTIVITY':
        // Update activity in Firebase
        break;
      case 'DELETE_ACTIVITY':
        // Delete activity from Firebase
        break;
      default:
        console.warn('Unknown operation type:', type);
    }
  }

  // Add offline operation
  addToOfflineQueue(operation) {
    if (!this.isOnline) {
      const queueItem = {
        ...operation,
        timestamp: Date.now()
      };

      this.offlineQueue.push(queueItem);

      // Save queue to AsyncStorage
      this.saveOfflineQueue();
    }
  }

  // Queue'yu AsyncStorage'a kaydet
  async saveOfflineQueue() {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // Clear queue
  async clearOfflineQueue() {
    this.offlineQueue = [];
    await AsyncStorage.removeItem('offline_queue');
  }

  // Load queue from AsyncStorage
  async loadOfflineQueue() {
    try {
      const savedQueue = await AsyncStorage.getItem('offline_queue');
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  // Manual synchronization (may still be needed)
  async manualSync() {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    await this.performAutoSync();
  }

  // Get status information
  getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      offlineQueueLength: this.offlineQueue.length
    };
  }
}

// Singleton instance
const autoSyncService = new AutoSyncService();

export default autoSyncService;
