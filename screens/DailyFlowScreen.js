import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { 
  addActivityToFirebase, 
  updateActivityInFirebase, 
  deleteActivityFromFirebase,
} from '../services/firebaseService';
import { getCurrentUser } from '../services/authService';
import { ThemeContext } from '../contexts/ThemeContext';
import { dailyFlowStyles } from '../styles/dailyFlowStyles';
import { useGoals } from '../hooks/useGoals';
import { useStreakCalculation } from '../hooks/useStreakCalculation';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { useActivityForm } from '../hooks/useActivityForm';
import { useActivityManagement } from '../hooks/useActivityManagement';
import { removeDuplicates } from '../utils/commonUtils';
import { getCategories } from '../utils/categoryUtils';
import { formatDate, formatLocalDate } from '../utils/dateUtils';
import { 
  getRatingColor, 
  formatSeriesDetail, 
  groupActivitiesByCategory, 
  calculateDailyStats 
} from '../utils/activityUtils';
import ActivityCard from '../components/dailyFlow/ActivityCard';
import DatePickerModal from '../components/dailyFlow/DatePickerModal';
import MonthPickerModal from '../components/dailyFlow/MonthPickerModal';
import YearPickerModal from '../components/dailyFlow/YearPickerModal';
import ActivityFormModal from '../components/dailyFlow/ActivityFormModal';
import QuickAddMenu from '../components/dailyFlow/QuickAddMenu';
import StreakCard from '../components/dailyFlow/StreakCard';
import DailyStatsCard from '../components/dailyFlow/DailyStatsCard';
import TrashIcon from '../components/icons/TrashIcon';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}


const DailyFlowScreen = () => {
  const { t } = useTranslation();
  const { colors } = useContext(ThemeContext);
  const CATEGORIES = getCategories(t);
  
  // Core state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalType, setModalType] = useState(null); // 'add' or 'edit'
  const [editingActivity, setEditingActivity] = useState(null);
  
  // Custom hooks
  const { activities, setActivities, loadActivities, saveActivities } = useActivityManagement(currentDate);
  const { currentStreak, longestStreak, calculateStreak } = useStreakCalculation();
  
  const scrollViewRef = useRef(null);
  const dateScrollRef = useRef(null);
  
  // Date navigation hook
  const dateNavigation = useDateNavigation(currentDate, setCurrentDate, t);
  const {
    showDatePicker,
    setShowDatePicker,
    selectedYear,
    selectedMonth,
    showYearPicker,
    setShowYearPicker,
    showMonthPicker,
    setShowMonthPicker,
    navigateDate,
    openDatePicker,
    selectDate,
    handleYearSelect,
    handleMonthSelect,
    goToToday,
    generateCalendarDays,
    generateYearOptions,
    generateMonthOptions,
    dateSwipeResponder,
    handleScrollBeginDrag,
    handleScrollEndDrag,
  } = dateNavigation;
  
  // Activity form hook
  const activityForm = useActivityForm(editingActivity, modalType, scrollViewRef);
  const {
    formData,
    setFormData,
    seasonEpisodes,
    setSeasonEpisodes,
    duration,
    setDuration,
    isQuickAdd,
    setIsQuickAdd,
    handleCompletionToggle,
    handleStarPress,
    addSeasonEpisodeRow,
    removeSeasonEpisodeRow,
    updateSeasonEpisode,
    resetForm,
    validateForm,
    formatFormDataForSave,
  } = activityForm;
  
  // Goals
  const { goals } = useGoals();
  
  // UI state
  const [recentActivities, setRecentActivities] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [swipedActivityId, setSwipedActivityId] = useState(null);
  const [deletingActivityId, setDeletingActivityId] = useState(null);
  const [swipeAnimations, setSwipeAnimations] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});
  
  // Calculate daily stats from activities
  const dailyStats = useMemo(() => calculateDailyStats(activities), [activities]);

  // Effects
  useEffect(() => {
    loadRecentActivities();
    calculateStreak();
  }, [currentDate, calculateStreak]);


  const loadRecentActivities = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        // Old format for non-logged-in users
      const stored = await AsyncStorage.getItem('recentActivities');
        if (stored) {
          setRecentActivities(JSON.parse(stored));
        }
        return;
      }
      
      const userSpecificKey = `recentActivities_${user.uid}`;
      const stored = await AsyncStorage.getItem(userSpecificKey);
      if (stored) {
        setRecentActivities(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };


  const saveRecentActivity = async (activity) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        // Old format for non-logged-in users
      const newRecent = [activity, ...recentActivities.filter(a => a.title !== activity.title)].slice(0, 5);
      setRecentActivities(newRecent);
      await AsyncStorage.setItem('recentActivities', JSON.stringify(newRecent));
        return;
      }
      
      const newRecent = [activity, ...recentActivities.filter(a => a.title !== activity.title)].slice(0, 5);
      setRecentActivities(newRecent);
      const userSpecificKey = `recentActivities_${user.uid}`;
      await AsyncStorage.setItem(userSpecificKey, JSON.stringify(newRecent));
    } catch (error) {
      console.error('Error saving recent activity:', error);
    }
  };

  // Use utility functions for formatting
  const formatSeriesDetailMemo = useCallback((detail) => formatSeriesDetail(detail, t), [t]);
  
  // Group activities using utility function
  const groupedActivities = useMemo(() => groupActivitiesByCategory(activities), [activities]);

  // Toggle category function
  const toggleCategory = (categoryKey) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Render stars function (still needed for UI)
  const renderStars = useCallback(() => {
    const stars = [];
    for (let i = 0; i < 10; i++) {
      const isFilled = formData.rating >= i + 1;
      
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.starButton}
          onPress={() => handleStarPress(i)}
        >
          <Text style={[
            styles.star,
            isFilled && styles.starFilled
          ]}>
            {isFilled ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  }, [formData.rating, handleStarPress]);


  const addActivity = useCallback(() => {
    // Update all states at once
    setEditingActivity(null);
    resetForm();
    setModalType('add');
  }, [resetForm]);

  // Open add modal with pre-filled data from QuickAddMenu
  const openAddModalWithActivity = useCallback((activity) => {
    setEditingActivity(null);
    setIsQuickAdd(true); // Enable quick add mode
    
    // Parse existing detail if available
    let seasonEpisodesArray = [{ season: '', episode: '' }];
    let detailValue = '';
    
    if (activity.type === 'series' && activity.detail) {
      // Parse existing season-episode data
      if (activity.detail.includes(';')) {
        const seasonEpisodes = activity.detail.split(';').map(se => se.trim());
        seasonEpisodesArray = seasonEpisodes.map(se => {
          const parts = se.split(',');
          if (parts.length >= 2) {
            return {
              season: parts[0].trim(),
              episode: parts.slice(1).join(',').trim()
            };
          }
          return { season: '', episode: '' };
        });
      } else {
        const parts = activity.detail.split(',');
        if (parts.length >= 2) {
          seasonEpisodesArray = [{
            season: parts[0].trim(),
            episode: parts.slice(1).join(',').trim()
          }];
        }
      }
    } else {
      detailValue = activity.detail || '';
    }
    
    setFormData({
      title: activity.title,
      category: activity.type,
      detail: detailValue,
      season: '',
      episode: '',
      isCompleted: false,
      rating: 0
    });
    setSeasonEpisodes(seasonEpisodesArray);
    setDuration({ hours: '', minutes: '' });
    setModalType('add');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setEditingActivity(null);
    resetForm();
  }, [resetForm]);

  // Handle quick add activity (from QuickAddMenu)
  const handleQuickAddActivity = async (newActivity) => {
    try {
      // Determine if it's a goal
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activityDate = newActivity.date ? new Date(newActivity.date + 'T00:00:00') : currentDate;
      const activityDateOnly = new Date(activityDate);
      activityDateOnly.setHours(0, 0, 0, 0);
      const isFutureDate = activityDateOnly > today;
      const isGoal = isFutureDate && !newActivity.isCompleted;

      // Update activity with goal status
      const activityToSave = {
        ...newActivity,
        isGoal: isGoal,
        isCompleted: newActivity.isCompleted || false,
        rating: newActivity.rating || 0,
      };

      // Add to Firebase if user is logged in
      const user = getCurrentUser();
      if (user) {
        try {
          const firebaseId = await addActivityToFirebase(activityToSave);
          if (firebaseId) {
            activityToSave.firebaseId = firebaseId;
          }
        } catch (firebaseError) {
          console.error('Firebase add failed, saving to AsyncStorage only:', firebaseError);
        }
      }

      // Check for duplicates before adding (by title, type, date, and detail)
      const isDuplicate = activities.some(a => 
        a.title === activityToSave.title &&
        a.type === activityToSave.type &&
        a.date === activityToSave.date &&
        a.detail === activityToSave.detail
      );
      
      if (isDuplicate) {
        Alert.alert(t('errors.error'), t('errors.duplicateActivity') || 'This activity already exists for this date.');
        return;
      }
      
      // Update activities state
      const updatedActivities = [...activities, activityToSave];
      const uniqueActivities = removeDuplicates(updatedActivities);

      // Configure layout animation
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (layoutError) {
        console.warn('LayoutAnimation error:', layoutError);
      }

      setActivities(uniqueActivities);
      
      // Save to AsyncStorage
      await saveActivities(uniqueActivities, activityDate);
      
      // Don't reload from Firebase here - it can cause duplicates if delete wasn't complete
      // The activity is already added to state and saved to AsyncStorage
      // Firebase sync will happen automatically on next app load or manual sync
      
      // Calculate streak
      calculateStreak().catch(err => console.error('Streak calculation error:', err));
      
      // Save to recent activities
      saveRecentActivity(activityToSave);
    } catch (error) {
      console.error('Quick add activity error:', error);
      Alert.alert(t('errors.error'), t('errors.saveError'));
    }
  };

  const saveActivity = async () => {
    if (!formData.title.trim()) {
      Alert.alert(t('errors.error'), t('errors.titleRequired'));
      return;
    }
    if (!formData.category) {
      Alert.alert(t('errors.error'), t('errors.categoryRequired'));
      return;
    }

    let detail = formData.detail.trim();
    
    // Format duration for sports
    if (formData.category === 'sport') {
      const hours = duration.hours.trim();
      const minutes = duration.minutes.trim();
      
      if (hours || minutes) {
        const hoursText = hours ? `${hours} ${t('activity.hours').toLowerCase()}` : '';
        const minutesText = minutes ? `${minutes} ${t('activity.minutes').toLowerCase()}` : '';
        detail = [hoursText, minutesText].filter(text => text).join(' ') || '';
      }
    }
    
    // Special validation for series
    if (formData.category === 'series') {
      // Check all season-episode pairs
      for (let i = 0; i < seasonEpisodes.length; i++) {
        const { season, episode } = seasonEpisodes[i];
        
        if (!season.trim() || !episode.trim()) {
          Alert.alert(t('errors.error'), t('errors.seasonEpisodeRequired', { row: i + 1 }));
          return;
        }
        
        const seasonNum = parseInt(season);
        if (seasonNum <= 0) {
          Alert.alert(t('errors.error'), t('errors.seasonMustBePositive', { row: i + 1 }));
          return;
        }
        
        // Split episodes by comma and check
        const episodes = episode.split(',').map(ep => ep.trim()).filter(ep => ep);
        if (episodes.length === 0) {
          Alert.alert(t('errors.error'), t('errors.episodeRequired', { row: i + 1 }));
          return;
        }
        
        // Check that each episode is a valid number
        for (const ep of episodes) {
          const episodeNum = parseInt(ep);
          if (isNaN(episodeNum) || episodeNum <= 0) {
            Alert.alert(t('errors.error'), t('errors.invalidEpisode', { row: i + 1, episode: ep }));
            return;
          }
        }
      }
      
      // Combine all season-episode pairs
      const seasonEpisodeStrings = seasonEpisodes.map(({ season, episode }) => {
        const episodes = episode.split(',').map(ep => ep.trim()).filter(ep => ep);
        return `${season},${episodes.join(',')}`;
      });
      
      detail = seasonEpisodeStrings.join(';');
    }

    // Use original date if editing, otherwise use current date
    let activityDate;
    if (editingActivity && editingActivity.date) {
      // Preserve original date when editing
      // If date is a string (YYYY-MM-DD), convert to Date object
      if (typeof editingActivity.date === 'string') {
        const [year, month, day] = editingActivity.date.split('-').map(Number);
        activityDate = new Date(year, month - 1, day);
      } else {
        activityDate = new Date(editingActivity.date);
      }
    } else {
      // New activity - use current date
      activityDate = currentDate;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDateOnly = new Date(activityDate);
    activityDateOnly.setHours(0, 0, 0, 0);
    const isFutureDate = activityDateOnly > today;
    
    // If activity is completed or date is today/past, it's not a goal
    const isGoal = isFutureDate && !formData.isCompleted;

    const newActivity = {
      id: editingActivity ? editingActivity.id : Date.now().toString(),
      title: formData.title.trim(),
      type: formData.category,
      detail: detail,
      isCompleted: formData.isCompleted,
      rating: formData.rating,
      timestamp: editingActivity ? editingActivity.timestamp : new Date().toISOString(),
      date: formatLocalDate(activityDate),
      isGoal: isGoal
    };

    try {
    let updatedActivities;
    if (editingActivity) {
        // Edit mode - update to Firebase
        // Use firebaseId if available, otherwise use id (for backward compatibility)
        const firebaseDocId = editingActivity.firebaseId || editingActivity.id;
        await updateActivityInFirebase(firebaseDocId, newActivity);
      updatedActivities = activities.map(a => 
        a.id === editingActivity.id ? newActivity : a
      );
    } else {
        // Ekleme modu - Firebase'e ekle (eğer kullanıcı giriş yapmışsa)
        const user = getCurrentUser();
        
        if (user) {
          try {
        const firebaseId = await addActivityToFirebase(newActivity);
            if (firebaseId) {
        newActivity.firebaseId = firebaseId;
            }
          } catch (firebaseError) {
            // Firebase'e ekleme başarısız oldu
            console.error('Firebase add failed, saving to AsyncStorage only:', firebaseError);
            // Aktiviteyi AsyncStorage'a kaydedeceğiz, daha sonra sync edilebilir
            Alert.alert(
              t('errors.warning') || 'Warning',
              'Activity saved locally but could not be saved to Firebase. It will be synced when connection is restored.'
            );
          }
        }
      updatedActivities = [...activities, newActivity];
      saveRecentActivity(newActivity);
    }
    
      // Duplicate check
      const uniqueActivities = removeDuplicates(updatedActivities);
      
      // Configure layout animation before state update
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (layoutError) {
        // Ignore layout animation errors
        console.warn('LayoutAnimation error:', layoutError);
      }
      
      setActivities(uniqueActivities);
      // Save activities for the activity's date (important when editing activities from different dates)
      const activityDateForSave = editingActivity && editingActivity.date 
        ? (typeof editingActivity.date === 'string' 
            ? new Date(editingActivity.date + 'T00:00:00')
            : new Date(editingActivity.date))
        : activityDate;
      await saveActivities(uniqueActivities, activityDateForSave);
      
      // Don't reload from Firebase here - it can cause duplicates
      // The activity is already added to state and saved to AsyncStorage
      // Firebase sync will happen automatically on next app load or manual sync
      
      // Calculate streak asynchronously without blocking
      calculateStreak().catch(err => console.error('Streak calculation error:', err));
    closeModal();
    } catch (error) {
      console.error('Firebase save error:', error);
      Alert.alert(t('errors.error'), t('errors.saveError'));
      // Don't close modal on error so user can retry
    }
  };

  const editActivity = useCallback((activity) => {
    // Update all states at once
    setEditingActivity(activity);
    
    let season = '';
    let episode = '';
    let detail = activity.detail || '';
    let seasonEpisodesArray = [{ season: '', episode: '' }];
    let durationValue = { hours: '', minutes: '' };
    
    // Parse duration for sports
    if (activity.type === 'sport' && activity.detail) {
      const detailText = activity.detail.toLowerCase();
      // Parse "1 hour 30 minutes" or similar format
      const hoursMatch = detailText.match(/(\d+)\s*(saat|hour|hours|s)/);
      const minutesMatch = detailText.match(/(\d+)\s*(dakika|minute|minutes|d|min)/);
      
      if (hoursMatch) {
        durationValue.hours = hoursMatch[1];
      }
      if (minutesMatch) {
        durationValue.minutes = minutesMatch[1];
      }
      
      detail = '';
    }
    
    // Split season and episode for series
    if (activity.type === 'series' && activity.detail) {
      // Multiple season check
      if (activity.detail.includes(';')) {
        // Multiple season format: "3,10;4,1"
        const seasonEpisodes = activity.detail.split(';').map(se => se.trim());
        seasonEpisodesArray = seasonEpisodes.map(se => {
          const parts = se.split(',');
          if (parts.length >= 2) {
            return {
              season: parts[0].trim(),
              episode: parts.slice(1).join(',').trim()
            };
          }
          return { season: '', episode: '' };
        });
        detail = '';
      } else {
        // Single season format (current logic)
        const parts = activity.detail.split(',');
        if (parts.length >= 2) {
          season = parts[0].trim();
          episode = parts.slice(1).join(',').trim();
          seasonEpisodesArray = [{ season, episode }];
          detail = '';
        }
      }
    }
    
    setFormData({
      title: activity.title,
      category: activity.type,
      detail: detail,
      season: season,
      episode: episode,
      isCompleted: activity.isCompleted || false,
      rating: activity.rating || 0
    });
    setSeasonEpisodes(seasonEpisodesArray);
    setDuration(durationValue);
    setModalType('edit');
  }, []);

  const deleteActivity = (activity) => {
    Alert.alert(
      t('activity.deleteActivity'),
      t('activity.deleteConfirm', { title: activity.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Immediately close swipe state and reset animation if this activity is swiped
              if (swipedActivityId === activity.id) {
                setSwipedActivityId(null);
                // Reset animation immediately
                const slideAnimation = swipeAnimations[activity.id];
                if (slideAnimation) {
                  slideAnimation.setValue(0);
                }
              }
              
              // Delete from Firebase if user is logged in
              const user = getCurrentUser();
              if (user) {
                // Try to delete using firebaseId first, then fall back to id
                const firebaseDocId = activity.firebaseId || activity.id;
                try {
                  await deleteActivityFromFirebase(firebaseDocId);
                  console.log('Activity deleted from Firebase:', firebaseDocId);
                } catch (firebaseError) {
                  console.error('Firebase delete error:', firebaseError);
                  // Continue with local delete even if Firebase fails
                  // The activity will be removed from local state and AsyncStorage
                }
              }
              
            // Layout animasyonu ile silme efekti
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              // Filter by both id and firebaseId to ensure complete removal
              const updatedActivities = activities.filter(a => {
                // Remove if id matches
                if (a.id === activity.id) return false;
                // Remove if firebaseId matches (if both have firebaseId)
                if (activity.firebaseId && a.firebaseId && a.firebaseId === activity.firebaseId) return false;
                return true;
              });
              // Duplicate check
              const uniqueActivities = removeDuplicates(updatedActivities);
              setActivities(uniqueActivities);
              
              // Save activities for the activity's date
              const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : currentDate;
              await saveActivities(uniqueActivities, activityDate);
              
              // Don't reload from Firebase - it can bring back deleted activities
              // The activity is already removed from state and AsyncStorage
              
              // Clear animation value for deleted activity
              setSwipeAnimations(prev => {
                const newSwipeAnimations = { ...prev };
                delete newSwipeAnimations[activity.id];
                return newSwipeAnimations;
              });
              
              calculateStreak(); // Update streak
            } catch (error) {
              console.error('Delete activity error:', error);
              Alert.alert(t('errors.error'), t('errors.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleSwipeDelete = async (activity) => {
    // Set deleting state FIRST to immediately hide delete button
    setDeletingActivityId(activity.id);
    
    // Immediately close swipe state and reset animation if this activity is swiped
    if (swipedActivityId === activity.id) {
      setSwipedActivityId(null);
    }
    
    // Reset animation immediately to hide delete button
    const existingAnimation = swipeAnimations[activity.id];
    if (existingAnimation) {
      existingAnimation.setValue(0);
    }
    
    // Get or create animation for this activity
    let slideAnimation = existingAnimation || swipeAnimations[activity.id];
    if (!slideAnimation) {
      slideAnimation = new Animated.Value(0);
      setSwipeAnimations(prev => ({
        ...prev,
        [activity.id]: slideAnimation
      }));
    }
    
    Animated.parallel([
      // Quickly swipe card to the left
      Animated.timing(slideAnimation, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      try {
        // Delete from Firebase if user is logged in
        const user = getCurrentUser();
        if (user) {
          // Try to delete using firebaseId first, then fall back to id
          const firebaseDocId = activity.firebaseId || activity.id;
          try {
            await deleteActivityFromFirebase(firebaseDocId);
            console.log('Activity deleted from Firebase:', firebaseDocId);
          } catch (firebaseError) {
            console.error('Firebase delete error:', firebaseError);
            // Continue with local delete even if Firebase fails
            // The activity will be removed from local state and AsyncStorage
          }
        }
        
        // Animasyon bittikten sonra sil - filter by both id and firebaseId
        const updatedActivities = activities.filter(a => {
          // Remove if id matches
          if (a.id === activity.id) return false;
          // Remove if firebaseId matches (if both have firebaseId)
          if (activity.firebaseId && a.firebaseId && a.firebaseId === activity.firebaseId) return false;
          return true;
        });
        // Duplicate check
      const uniqueActivities = removeDuplicates(updatedActivities);
      setActivities(uniqueActivities);
        
        // Save activities for the activity's date
        const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : currentDate;
        await saveActivities(uniqueActivities, activityDate);
        
        // Don't reload from Firebase - it can bring back deleted activities
        // The activity is already removed from state and AsyncStorage
        
        // Calculate streak
        calculateStreak().catch(err => console.error('Streak calculation error:', err));
        
        // Clear animation value and reset swipe state using functional update
        setSwipeAnimations(prev => {
          const newSwipeAnimations = { ...prev };
      delete newSwipeAnimations[activity.id];
          return newSwipeAnimations;
        });
        
        // Reset swipe state if the deleted activity was the swiped one
        setSwipedActivityId(prev => prev === activity.id ? null : prev);
        setDeletingActivityId(null);
      } catch (error) {
        console.error('Delete activity error:', error);
        setSwipedActivityId(null);
        setDeletingActivityId(null);
      }
    });
  };

  const createSwipePanResponder = (activity) => {
    const slideAnimation = swipeAnimations[activity.id] || new Animated.Value(0);
    
    return PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only for horizontal movement
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        // Save animation value
        if (!swipeAnimations[activity.id]) {
          setSwipeAnimations(prev => ({
            ...prev,
            [activity.id]: slideAnimation
          }));
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only swipe left (negative dx)
        if (gestureState.dx < 0) {
          slideAnimation.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Show delete button if swiped enough
        if (gestureState.dx < -50) {
          Animated.spring(slideAnimation, {
            toValue: -80,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
          setSwipedActivityId(activity.id);
        } else {
          // Swipe back
          Animated.spring(slideAnimation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
          setSwipedActivityId(null);
        }
      },
    });
  };

  const showActivityDetails = (activity) => {
    const category = CATEGORIES[activity.type];
    const detailText = activity.detail ? `\n\n${category.detailLabel}: ${activity.detail}` : '';
    Alert.alert(
      t('activity.activityDetails'),
      t('activity.activityDetailsText', { 
        title: activity.title, 
        category: category.name, 
        emoji: category.emoji,
        detail: activity.detail ? `\n\n${category.detailLabel}: ${activity.detail}` : '',
        timestamp: new Date(activity.timestamp).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US')
      }),
      [
        { text: t('common.ok'), style: 'default' },
        { text: t('common.edit'), onPress: () => editActivity(activity) },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteActivity(activity) },
      ]
    );
  };

  // Handle goal completion (long press on goal activity)
  const handleGoalComplete = async (activity) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
    activityDate.setHours(0, 0, 0, 0);
    
    // Check if activity date is today or in the past
    if (activityDate <= today) {
      try {
        // Update activity: move to today and remove goal status
        // Note: isCompleted should NOT be set to true here - it means activity is fully completed (e.g., book finished)
        const todayDateString = formatLocalDate(today);
        const updatedActivity = {
          ...activity,
          date: todayDateString,
          isGoal: false,
          // Keep original isCompleted value - don't change it
          timestamp: new Date().toISOString()
        };

        // Use activity.id as Firebase document ID
        // When activities are loaded from Firebase, id is set to the Firebase doc ID
        // If activity has firebaseId, use that instead (for backward compatibility)
        const firebaseDocId = activity.firebaseId || activity.id;
        
        // Update in Firebase - updateActivityInFirebase will handle document existence check
        // But we need to ensure we're using the correct Firebase document ID
        await updateActivityInFirebase(firebaseDocId, {
          ...updatedActivity,
          id: activity.id // Keep the original id field
        });

        // Update local state - remove old activity and add updated one
        // Filter out the old activity (by ID) and add the updated one
        const filteredActivities = activities.filter(a => a.id !== activity.id);
        const updatedActivities = [...filteredActivities, updatedActivity];
        
        const uniqueActivities = removeDuplicates(updatedActivities);
        
        // Configure layout animation before state update
        try {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (layoutError) {
          // Ignore layout animation errors
          console.warn('LayoutAnimation error:', layoutError);
        }
        
        setActivities(uniqueActivities);
        await saveActivities(uniqueActivities, todayDateString);
        calculateStreak();
        
        // Don't reload from Firebase - it can bring back old data
        // The activity is already updated in state and AsyncStorage
        
        Alert.alert(
          t('activity.completedGoal'),
          t('activity.goalCompletedMessage', { title: activity.title })
        );
      } catch (error) {
        console.error('Error completing goal:', error);
        Alert.alert(t('errors.error'), t('errors.saveError'));
      }
    } else {
      Alert.alert(
        t('activity.isGoal'),
        t('activity.goalNotYetDue', { date: activityDate.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US') })
      );
    }
  };





  // Generate week days for horizontal scroll
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return date.getDate() === currentDate.getDate() &&
           date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  // Auto-scroll to selected date - center it on screen
  useEffect(() => {
    const selectedIndex = weekDays.findIndex(day => isSelected(day));
    if (selectedIndex !== -1 && dateScrollRef.current) {
      const screenWidth = Dimensions.get('window').width;
      const cardWidth = 64; // Card width
      const cardMargin = 10; // Margin right of each card
      const totalCardWidth = cardWidth + cardMargin;
      const paddingStart = 16; // ContentContainer paddingHorizontal (left)
      
      // Calculate the position of the card's left edge
      const cardLeftPosition = paddingStart + (selectedIndex * totalCardWidth);
      
      // Calculate scroll position to center the card
      // We want: cardCenter = screenWidth / 2
      // cardCenter = scrollPosition + (screenWidth / 2)
      // So: scrollPosition = cardLeftPosition + (cardWidth / 2) - (screenWidth / 2)
      const scrollPosition = cardLeftPosition + (cardWidth / 2) - (screenWidth / 2);
      
      setTimeout(() => {
        dateScrollRef.current?.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true
        });
      }, 100);
    }
  }, [currentDate, weekDays]);

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Horizontal Date Picker - Below Navigation Header */}
      <View style={[styles.dateScrollContainer, { backgroundColor: colors.surface + 'CC', borderBottomColor: colors.border }]}>
        <ScrollView 
          ref={dateScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalDateScroll}
          contentContainerStyle={styles.horizontalDateContent}
        >
          {weekDays.map((day, index) => {
            const isCurrentDay = isToday(day);
            const isSelectedDay = isSelected(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  isCurrentDay && styles.dateCardToday,
                  isSelectedDay && styles.dateCardSelected,
                  { 
                    backgroundColor: isCurrentDay ? '#2bee6c' : 
                                   isSelectedDay ? colors.primary : 
                                   colors.card
                  }
                ]}
                onPress={() => {
                  if (isSelectedDay) {
                    // If already selected, open date picker modal
                    openDatePicker();
                  } else {
                    // Otherwise, switch to that date
                    setCurrentDate(new Date(day));
                  }
                }}
              >
                <Text style={[
                  styles.dateCardDay,
                  { color: isCurrentDay ? '#000' : colors.text }
                ]}>
                  {isCurrentDay ? t('common.today') || 'Bugün' : dayNames[day.getDay()]}
                </Text>
                <Text style={[
                  styles.dateCardDate,
                  { color: isCurrentDay ? '#000' : colors.text }
                ]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Streak Card - Compact Single Line */}
      {currentStreak > 0 && (
        <View style={[styles.modernStreakContainer, { backgroundColor: colors.surface + 'CC' }]}>
          <View style={[styles.modernStreakCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={styles.modernStreakEmoji}>🔥</Text>
            <Text style={[styles.modernStreakText, { color: colors.text }]}>
              {t('activity.currentStreak')}: <Text style={styles.modernStreakValue}>{currentStreak}</Text> {currentStreak === 1 ? t('activity.day') : t('activity.days')}
              {longestStreak > currentStreak && (
                <> • {t('activity.bestStreak')}: <Text style={styles.modernStreakValue}>{longestStreak}</Text></>
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Modern Activity List - with swipe to change date */}
      <View 
        style={styles.modernActivityListWrapper}
        {...dateSwipeResponder.panHandlers}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.modernActivityList}
          contentContainerStyle={styles.modernActivityListContent}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          scrollEventThrottle={16}
        >
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('activity.noActivitiesYet')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>{t('activity.addFirstActivity')}</Text>
          </View>
        ) : (
          <View style={styles.modernActivitiesWrapper}>{activities.map((activity) => {
            const activityCategory = CATEGORIES[activity.type];
            const isSwiped = swipedActivityId === activity.id;
            const isDeleting = deletingActivityId === activity.id;
            
            // Check if activity is a goal (future-dated)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
            activityDate.setHours(0, 0, 0, 0);
            const isFutureDate = activityDate > today;
            const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
            
            // Initialize animation
            if (!swipeAnimations[activity.id]) {
              setSwipeAnimations(prev => ({
                ...prev,
                [activity.id]: new Animated.Value(0)
              }));
            }
            
            let slideAnimation = swipeAnimations[activity.id] || new Animated.Value(0);
            
            return (
              <View key={activity.id} style={styles.modernActivityCardWrapper}>
                {/* Delete button - shows when swiped */}
                {!isDeleting && isSwiped && (
                  <Animated.View 
                    style={[
                      styles.modernDeleteContainer,
                      {
                        transform: [
                          {
                            translateX: slideAnimation.interpolate({
                              inputRange: [-70, 0],
                              outputRange: [0, 70],
                              extrapolate: 'clamp',
                            })
                          }
                        ],
                        opacity: slideAnimation.interpolate({
                          inputRange: [-70, -35, 0],
                          outputRange: [1, 0.5, 0],
                          extrapolate: 'clamp',
                        }),
                      }
                    ]}
                  >
                    <TouchableOpacity 
                      style={styles.modernDeleteTouchable}
                      onPress={() => handleSwipeDelete(activity)}
                    >
                      <TrashIcon size={28} color="#ef4444" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                
                {/* Modern Activity Card */}
                <Animated.View
                  style={[
                    styles.modernActivityCard,
                    { 
                      backgroundColor: activity.isCompleted ? colors.successLight : colors.card,
                      borderColor: activity.isCompleted ? colors.success : '#2bee6c80',
                      transform: [{ translateX: slideAnimation }],
                    },
                    isDeleting && { opacity: 0 }
                  ]}
                >
                  {/* Chevron indicator - moves with card */}
                  {!isDeleting && (
                    <View style={styles.modernChevronIndicatorFixed}>
                      <TouchableOpacity 
                        style={styles.modernChevronButton}
                        onPress={() => {
                          if (isSwiped) {
                            Animated.spring(slideAnimation, {
                              toValue: 0,
                              useNativeDriver: true,
                              tension: 100,
                              friction: 8,
                            }).start();
                            setSwipedActivityId(null);
                          } else {
                            Animated.spring(slideAnimation, {
                              toValue: -70,
                              useNativeDriver: true,
                              tension: 100,
                              friction: 8,
                            }).start();
                            setSwipedActivityId(activity.id);
                          }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 15, right: 5 }}
                      >
                        <View style={styles.chevronContainer}>
                          <View style={[styles.chevronLine, styles.chevronTop, { borderColor: isSwiped ? '#dc2626' : '#ef4444' }]} />
                          <View style={[styles.chevronLine, styles.chevronBottom, { borderColor: isSwiped ? '#dc2626' : '#ef4444' }]} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <Pressable 
                    style={styles.modernActivityContent}
                    onPress={() => editActivity(activity)}
                    onLongPress={isGoal ? () => handleGoalComplete(activity) : undefined}
                  >
                    <View style={styles.modernActivityIcon}>
                      <Text style={styles.modernActivityEmoji}>
                        {isGoal ? '🎯' : activityCategory.emoji}
                      </Text>
                    </View>
                    
                    <View style={styles.modernActivityInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          {isGoal && (
                            <Text style={{ marginRight: 8, fontSize: 18 }}>{activityCategory.emoji}</Text>
                          )}
                          {activity.isCompleted && (
                            <View style={[styles.completionIcon, { backgroundColor: colors.success, marginRight: 8 }]}>
                              <Text style={styles.completionIconText}>✓</Text>
                            </View>
                          )}
                          <Text style={[styles.modernActivityTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                            {activity.title}
                          </Text>
                        </View>
                        
                        {activity.isCompleted && activity.rating > 0 && (
                          <View style={[styles.modernRatingBadgeSmall, { backgroundColor: getRatingColor(activity.rating) + '30', marginRight: 35 }]}>
                            <Text style={styles.modernRatingIconSmall}>⭐</Text>
                            <Text style={[styles.modernRatingTextSmall, { color: colors.text }]}>
                              {activity.rating}
                            </Text>
                          </View>
                        )}
                      </View>
                      {activity.detail && (
                        <Text style={[styles.modernActivityDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                          {activity.type === 'series' 
                            ? formatSeriesDetailMemo(activity.detail)
                            : activity.type === 'book'
                            ? `${activityCategory.detailLabel}: ${activity.detail}`
                            : activity.type === 'sport'
                            ? activity.detail
                            : `${activityCategory.detailLabel}: ${activity.detail}`}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              </View>
            );
          })}</View>
        )}
        </ScrollView>
      </View>

      {/* Floating Action Button Group */}
      <View style={styles.fabContainer}>
        {showQuickAdd && recentActivities.length > 0 && (
          <Animated.View style={[
            styles.quickActivitiesCard,
            { backgroundColor: '#283944' }
          ]}>
            <Text style={styles.quickActivitiesTitle}>{t('activity.recent') || 'Son Aktiviteler'}</Text>
            {recentActivities.slice(0, 3).map((recent, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActivityItem}
                onPress={() => openAddModalWithActivity(recent)}
              >
                <View style={styles.quickActivityIcon}>
                  <Text style={styles.quickActivityEmoji}>{CATEGORIES[recent.type]?.emoji}</Text>
                </View>
                <View style={styles.quickActivityInfo}>
                  <Text style={styles.quickActivityTitle} numberOfLines={1}>{recent.title}</Text>
                  {recent.detail && (
                    <Text style={styles.quickActivitySubtitle} numberOfLines={1}>
                      {recent.type === 'series' ? formatSeriesDetailMemo(recent.detail) : recent.detail}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
        
        <View style={styles.fabButtons}>
          {recentActivities.length > 0 && (
            <TouchableOpacity 
              style={[styles.fabButtonSmall, { backgroundColor: '#3c3c3c' }]}
              onPress={() => setShowQuickAdd(!showQuickAdd)}
            >
              <Ionicons name="flash" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.fabButtonLarge, { backgroundColor: '#4831d4' }]}
            onPress={addActivity}
          >
            <Ionicons name="add" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals - Keep functional */}

      
      {/* Date and Activity Form Modals */}
      <DatePickerModal
        visible={showDatePicker}
        currentDate={currentDate}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        colors={colors}
        generateCalendarDays={generateCalendarDays}
        generateMonthOptions={generateMonthOptions}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={selectDate}
        onShowMonthPicker={() => setShowMonthPicker(true)}
        onShowYearPicker={() => setShowYearPicker(true)}
        onGoToToday={goToToday}
      />

      {/* Ay Seçici Modal */}
      <MonthPickerModal
        visible={showMonthPicker}
        selectedMonth={selectedMonth}
        colors={colors}
        generateMonthOptions={generateMonthOptions}
        onClose={() => setShowMonthPicker(false)}
        onSelect={handleMonthSelect}
      />

      {/* Yıl Seçici Modal */}
      <YearPickerModal
        visible={showYearPicker}
        selectedYear={selectedYear}
        colors={colors}
        generateYearOptions={generateYearOptions}
        onClose={() => setShowYearPicker(false)}
        onSelect={handleYearSelect}
      />

      {/* Aktivite Ekleme Modal */}
      <ActivityFormModal
        visible={modalType !== null}
        modalType={modalType}
        formData={formData}
        setFormData={setFormData}
        seasonEpisodes={seasonEpisodes}
        duration={duration}
        setDuration={setDuration}
        CATEGORIES={CATEGORIES}
        colors={colors}
        onClose={closeModal}
        onSave={saveActivity}
        updateSeasonEpisode={updateSeasonEpisode}
        addSeasonEpisodeRow={addSeasonEpisodeRow}
        removeSeasonEpisodeRow={removeSeasonEpisodeRow}
        handleCompletionToggle={handleCompletionToggle}
        renderStars={renderStars}
        isQuickAdd={isQuickAdd}
      />


    </View>
  );
};

const styles = dailyFlowStyles;

export default DailyFlowScreen;
