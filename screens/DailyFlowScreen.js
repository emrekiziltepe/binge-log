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





  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Tarih Navigasyonu */}
      <View style={[styles.dateHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openDatePicker} style={styles.dateButton}>
        <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(currentDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: colors.text }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Streak Kartı */}
      <StreakCard 
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        colors={colors}
      />

      {/* Kompakt Günlük Özet */}
      <DailyStatsCard
        dailyStats={dailyStats}
        CATEGORIES={CATEGORIES}
        colors={colors}
      />

      {/* Aktivite Listesi */}
      <View 
        style={styles.activitiesContainer}
        {...dateSwipeResponder.panHandlers}
      >
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContentContainer}
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
          Object.entries(groupedActivities).map(([categoryKey, categoryActivities]) => {
            const isGoalsSection = categoryKey === '_goals';
            const category = isGoalsSection ? null : CATEGORIES[categoryKey];
            
            return (
              <View key={categoryKey} style={styles.categoryGroup}>
                {/* Kategori Başlığı */}
                <TouchableOpacity 
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(categoryKey)}
                >
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryLeftGroup}>
                      <Text style={styles.categoryTitle}>
                        {isGoalsSection ? `🎯 ${t('activity.isGoal')}` : category.name}
                      </Text>
                      <Text style={styles.categoryCount}>{categoryActivities.length}</Text>
                      <Text style={styles.categoryArrow}>
                        {collapsedCategories[categoryKey] ? '+' : '−'}
              </Text>
            </View>
                    <View style={styles.categoryHorizontalLine} />
                  </View>
                </TouchableOpacity>
                
                {/* Kategori Aktivite Listesi */}
                {!collapsedCategories[categoryKey] && categoryActivities.map((activity) => {
                  // For goals, get category from activity
                  const activityCategory = isGoalsSection ? CATEGORIES[activity.type] : category;
                  const isSwiped = swipedActivityId === activity.id;
                  const isDeleting = deletingActivityId === activity.id;
                  // Initialize animation for this activity
                  if (!swipeAnimations[activity.id]) {
                    setSwipeAnimations(prev => ({
                      ...prev,
                      [activity.id]: new Animated.Value(0)
                    }));
                  }
                  // Get animation value - use existing or create new one
                  let slideAnimation = swipeAnimations[activity.id];
                  if (!slideAnimation) {
                    slideAnimation = new Animated.Value(0);
                    // Initialize in state for next render
                    setSwipeAnimations(prev => ({
                      ...prev,
                      [activity.id]: slideAnimation
                    }));
                  }
                  
                  return (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      category={activityCategory}
                      isSwiped={isSwiped}
                      isDeleting={isDeleting}
                      slideAnimation={slideAnimation}
                      colors={colors}
                      formatSeriesDetail={formatSeriesDetailMemo}
                      getRatingColor={getRatingColor}
                      onEdit={() => {
                            if (isSwiped) {
                              Animated.spring(slideAnimation, {
                                toValue: 0,
                                useNativeDriver: true,
                                tension: 100,
                                friction: 8,
                              }).start();
                              setSwipedActivityId(null);
                            } else {
                              editActivity(activity);
                            }
                          }}
                      onSwipeDelete={() => handleSwipeDelete(activity)}
                      onLongPress={handleGoalComplete}
                      onToggleSwipe={() => {
                        if (isSwiped) {
                          // Close swipe
                          Animated.spring(slideAnimation, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 100,
                            friction: 8,
                          }).start();
                          setSwipedActivityId(null);
                        } else {
                          // Open swipe - narrower delete button (70px)
                          Animated.spring(slideAnimation, {
                            toValue: -70,
                            useNativeDriver: true,
                            tension: 100,
                            friction: 8,
                          }).start();
                          setSwipedActivityId(activity.id);
                        }
                      }}
                    />
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
      </View>

      {/* Ekleme Butonları */}
      <View style={styles.addButtonsContainer}>
        {/* Hızlı Ekleme Butonu */}
        {recentActivities.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.quickAddButton, 
              { 
                backgroundColor: colors.warning,
                borderColor: colors.surface,
                shadowColor: colors.warning
              }
            ]} 
            onPress={() => setShowQuickAdd(!showQuickAdd)}
          >
            <Text style={styles.quickAddButtonText}>⚡</Text>
          </TouchableOpacity>
        )}
        
        {/* Ana Ekleme Butonu */}
        <Pressable 
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed
          ]} 
          onPress={addActivity}
        >
        <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {/* Hızlı Ekleme Menüsü */}
      <QuickAddMenu
        visible={showQuickAdd}
        recentActivities={recentActivities}
        CATEGORIES={CATEGORIES}
        activities={activities}
        colors={colors}
        currentDate={currentDate}
        onClose={() => setShowQuickAdd(false)}
        onActivityAdded={handleQuickAddActivity}
        onSaveRecentActivity={saveRecentActivity}
        onOpenAddModal={openAddModalWithActivity}
      />

      {/* Tarih Seçici Modal */}
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
