import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  LayoutAnimation,
  UIManager,
  PanResponder,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { 
  getActivitiesFromFirebase, 
  addActivityToFirebase, 
  updateActivityInFirebase, 
  deleteActivityFromFirebase,
  subscribeToActivities,
  syncFirebaseToLocal,
  getAllActivitiesFromFirebase
} from '../services/firebaseService';
import { getCurrentUser } from '../services/authService';
import { ThemeContext } from '../contexts/ThemeContext';
import { dailyFlowStyles } from '../styles/dailyFlowStyles';
import { useGoals } from '../hooks/useGoals';
import { useActivities } from '../hooks/useActivities';
import { removeDuplicates } from '../utils/commonUtils';
import { getCategories } from '../utils/categoryUtils';
import { formatDate, formatLocalDate } from '../utils/dateUtils';
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
  const [activities, setActivities] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalType, setModalType] = useState(null); // 'add' veya 'edit'
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    detail: '',
    season: '',
    episode: '',
    isCompleted: false,
    rating: 0
  });
  
  // Multiple season-episode pairs for series
  const [seasonEpisodes, setSeasonEpisodes] = useState([{ season: '', episode: '' }]);
  
  // Duration for sport (hours and minutes)
  const [duration, setDuration] = useState({ hours: '', minutes: '' });
  
  // Statistics variables
  const [dailyStats, setDailyStats] = useState({
    totalActivities: 0,
    categoryCount: {},
    mostActiveCategory: null
  });
  
  // Streak tracking
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Goals
  const { goals } = useGoals();
  
  // Smart features
  const [recentActivities, setRecentActivities] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [swipedActivityId, setSwipedActivityId] = useState(null);
  const [deletingActivityId, setDeletingActivityId] = useState(null);
  const [swipeAnimations, setSwipeAnimations] = useState({});
  
  // Swipe gesture for date navigation
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isScrolling = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const gestureDirection = useRef(null); // 'horizontal' or 'vertical'
  const hasMoved = useRef(false);
  
  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  
  // Ref for stars section
  const starsRef = useRef(null);
  const scrollViewRef = useRef(null);
  const monthScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  useEffect(() => {
    loadActivities();
    loadRecentActivities();
    calculateStreak();
  }, [currentDate]);

  useEffect(() => {
    calculateDailyStats();
  }, [activities]);

  // Modal state control - synchronize form data in edit mode
  useEffect(() => {
    if (modalType === 'edit' && editingActivity) {
      // Make sure form data is correct
      let season = '';
      let episode = '';
      let detail = editingActivity.detail || '';
      
      // Separate season and episode for series
      if (editingActivity.type === 'series' && editingActivity.detail) {
        const parts = editingActivity.detail.split(',');
        if (parts.length >= 2) {
          season = parts[0].trim();
          // Combine all episodes (comma separated)
          episode = parts.slice(1).join(',').trim();
          detail = ''; // Leave detail empty for series
        }
      }
      
      if (formData.title !== editingActivity.title || 
          formData.category !== editingActivity.type ||
          formData.detail !== detail ||
          formData.season !== season ||
          formData.episode !== episode) {
        setFormData({
          title: editingActivity.title,
          category: editingActivity.type,
          detail: detail,
          season: season,
          episode: episode,
          isCompleted: editingActivity.isCompleted || false,
          rating: editingActivity.rating || 0
        });
      }
    }
  }, [modalType, editingActivity]);

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

  const calculateDailyStats = () => {
    const categoryCount = {};
    let mostActiveCategory = null;
    let maxCount = 0;

    activities.forEach(activity => {
      const category = activity.type;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      if (categoryCount[category] > maxCount) {
        maxCount = categoryCount[category];
        mostActiveCategory = category;
      }
    });

    setDailyStats({
      totalActivities: activities.length,
      categoryCount,
      mostActiveCategory
    });
  };

  // Streak calculation
  const calculateStreak = async () => {
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
      let checkDate = new Date(today);
      checkDate.setHours(0, 0, 0, 0);
      
      // Count if activity exists today
      if (datesWithActivities.has(todayStr)) {
        currentStreakCount = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Count consecutive days backwards
      while (true) {
        const checkDateStr = formatLocalDate(checkDate);
        
        if (!datesWithActivities.has(checkDateStr)) {
          break;
        }
        
        currentStreakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Longest streak hesapla
      const sortedDates = Array.from(datesWithActivities).sort().reverse();
      let longestStreakCount = 0;
      let tempStreak = 0;
      let lastDate = null;

      for (const dateStr of sortedDates) {
        const currentDate = new Date(dateStr);
        if (lastDate === null) {
          tempStreak = 1;
          longestStreakCount = 1;
        } else {
          const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
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
  };

  const loadActivities = async () => {
    try {
      const user = getCurrentUser();
      const dateKey = currentDate.toISOString().split('T')[0];
      
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
        // Also save Firebase data to AsyncStorage (for offline backup)
        await AsyncStorage.setItem(userSpecificKey, JSON.stringify(firebaseActivities));
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
  };

  const saveActivities = async (newActivities) => {
    try {
      const user = getCurrentUser();
      const dateKey = formatLocalDate(currentDate);
      
      // Duplicate check
      const uniqueActivities = removeDuplicates(newActivities);
      
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

  // Date picker functions
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const selectDate = (date) => {
    setCurrentDate(date);
    setShowDatePicker(false);
  };

  const generateCalendarDays = () => {
    const currentMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    // Fix so Monday = 0, Tuesday = 1, ..., Sunday = 6
    const firstDayOfWeek = (currentMonth.getDay() + 6) % 7;
    
    const days = [];
    
    // Previous month's last days
    const prevMonth = new Date(selectedYear, selectedMonth - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i);
      days.push({ date, isCurrentMonth: false, isToday: false });
    }
    
    // This month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const isToday = date.toDateString() === new Date().toDateString();
      days.push({ date, isCurrentMonth: true, isToday });
    }
    
    // Next month's first days (to complete the calendar)
    const remainingDays = 42 - days.length; // 6 weeks x 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(selectedYear, selectedMonth + 1, day);
      days.push({ date, isCurrentMonth: false, isToday: false });
    }
    
    return days;
  };

  const generateYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    // Last 10 years + next 5 years
    for (let i = 10; i >= 0; i--) {
      years.push(currentYear - i);
    }
    for (let i = 1; i <= 5; i++) {
      years.push(currentYear + i);
    }
    
    return years;
  };

  const generateMonthOptions = () => {
    return [
      t('datePicker.months.january'), t('datePicker.months.february'), t('datePicker.months.march'), t('datePicker.months.april'),
      t('datePicker.months.may'), t('datePicker.months.june'),
      t('datePicker.months.july'), t('datePicker.months.august'), t('datePicker.months.september'), t('datePicker.months.october'), t('datePicker.months.november'), t('datePicker.months.december')
    ];
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
  };

  const handleCompletionToggle = () => {
    const newCompleted = !formData.isCompleted;
    setFormData({...formData, isCompleted: newCompleted});
    
    // If completed is checked, scroll to stars section
    if (newCompleted && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };


  // Return color based on rating
  const getRatingColor = (rating) => {
    if (rating === 1) return '#dc2626'; // Dark red (1)
    if (rating === 2) return '#ef4444'; // Light red (2)
    if (rating === 3) return '#ea580c'; // Dark orange (3)
    if (rating === 4) return '#f97316'; // Light orange (4)
    if (rating === 5) return '#d97706'; // Dark yellow (5)
    if (rating === 6) return '#eab308'; // Light yellow (6)
    if (rating === 7) return '#16a34a'; // Dark green (7)
    if (rating === 8) return '#22c55e'; // Light green (8)
    if (rating === 9) return '#15803d'; // Dark green (9)
    return '#166534'; // Darkest green (10)
  };

  // Format series detail
  const formatSeriesDetail = (detail) => {
    if (!detail) return '';
    
    // Multiple season check (semicolon separated)
    if (detail.includes(';')) {
      const seasonEpisodes = detail.split(';').map(se => se.trim());
      const formatted = seasonEpisodes.map(se => {
        const parts = se.split(',').map(part => part.trim());
        const season = parts[0];
        const episodes = parts.slice(1);
        
        if (episodes.length === 0) return `${t('activity.season')} ${season}`;
        return `${t('activity.season')} ${season}, ${t('activity.episode')}: ${episodes.join(',')}`;
      });
      
      return formatted.join('\n');
    }
    
    // Single season format (current logic)
    const parts = detail.split(',').map(part => part.trim());
    const season = parts[0];
    
    if (parts.length === 1) return `${t('activity.season')} ${season}`;
    
    const episodes = parts.slice(1);
    const episodeText = episodes.join(',');
    
    return `${t('activity.season')} ${season}, ${t('activity.episode')}: ${episodeText}`;
  };

  // Group activities by category and separate goals
  const groupActivitiesByCategory = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const regularActivities = [];
    const goalActivities = [];
    
    activities.forEach(activity => {
      const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
      activityDate.setHours(0, 0, 0, 0);
      const isFutureDate = activityDate > today;
      const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
      
      if (isGoal) {
        goalActivities.push(activity);
      } else {
        regularActivities.push(activity);
      }
    });
    
    const grouped = {};
    
    // Group regular activities by category
    regularActivities.forEach(activity => {
      const category = activity.type;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(activity);
    });
    
    // Sort categories alphabetically
    const sortedCategories = Object.keys(grouped).sort();
    const result = {};
    
    sortedCategories.forEach(category => {
      result[category] = grouped[category];
    });
    
    // Add goals section if there are goal activities
    if (goalActivities.length > 0) {
      result['_goals'] = goalActivities;
    }
    
    return result;
  };

  // Toggle category function
  const toggleCategory = (categoryKey) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Star rating functions
  const handleStarPress = (starIndex) => {
    const newRating = starIndex + 1;
    setFormData(prev => ({
      ...prev,
      rating: prev.rating === newRating ? 0 : newRating
    }));
  };

  const renderStars = () => {
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
  };

  // Add season-episode row
  const addSeasonEpisodeRow = () => {
    setSeasonEpisodes(prev => [...prev, { season: '', episode: '' }]);
  };

  // Remove season-episode row
  const removeSeasonEpisodeRow = (index) => {
    if (seasonEpisodes.length > 1) {
      setSeasonEpisodes(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Update season-episode value
  const updateSeasonEpisode = (index, field, value) => {
    setSeasonEpisodes(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };


  const addActivity = useCallback(() => {
    // Update all states at once
    setEditingActivity(null);
    setFormData({ title: '', category: '', detail: '', season: '', episode: '', isCompleted: false, rating: 0 });
    setSeasonEpisodes([{ season: '', episode: '' }]);
    setDuration({ hours: '', minutes: '' });
    setModalType('add');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setDuration({ hours: '', minutes: '' });
    setEditingActivity(null);
    setFormData({ title: '', category: '', detail: '', season: '', episode: '', isCompleted: false, rating: 0 });
    setSeasonEpisodes([{ season: '', episode: '' }]);
  }, []);

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

    // Use current date for the activity
    const activityDate = currentDate;
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
        await updateActivityInFirebase(editingActivity.id, newActivity);
      updatedActivities = activities.map(a => 
        a.id === editingActivity.id ? newActivity : a
      );
    } else {
        // Ekleme modu - Firebase'e ekle
        const firebaseId = await addActivityToFirebase(newActivity);
        newActivity.firebaseId = firebaseId;
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
      await saveActivities(uniqueActivities);
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
              // Firebase'den sil
              await deleteActivityFromFirebase(activity.id);
              
            // Layout animasyonu ile silme efekti
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updatedActivities = activities.filter(a => a.id !== activity.id);
              // Duplicate check
              const uniqueActivities = updatedActivities.filter((activity, index, self) => 
                index === self.findIndex(a => a.id === activity.id)
              );
              setActivities(uniqueActivities);
              saveActivities(uniqueActivities);
              calculateStreak(); // Update streak
            } catch (error) {
              console.error('Firebase delete error:', error);
              Alert.alert(t('errors.error'), t('errors.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleSwipeDelete = (activity) => {
    setDeletingActivityId(activity.id);
    
    // Modern delete animation like iPhone Notes
    const slideAnimation = swipeAnimations[activity.id] || new Animated.Value(0);
    
    Animated.parallel([
      // Quickly swipe card to the left
      Animated.timing(slideAnimation, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }),
      // Opacity'yi azalt
      Animated.timing(slideAnimation, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animasyon bittikten sonra sil
      const updatedActivities = activities.filter(a => a.id !== activity.id);
      // Duplicate check
      const uniqueActivities = removeDuplicates(updatedActivities);
      setActivities(uniqueActivities);
      saveActivities(uniqueActivities);
      setSwipedActivityId(null);
      setDeletingActivityId(null);
      
      // Clear animation value
      const newSwipeAnimations = { ...swipeAnimations };
      delete newSwipeAnimations[activity.id];
      setSwipeAnimations(newSwipeAnimations);
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
        saveActivities(uniqueActivities);
        calculateStreak();
        
        // Reload activities to ensure sync with Firebase
        loadActivities();
        
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


  const navigateDate = useCallback((direction) => {
    // Always navigate day by day (no activity-based navigation)
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + direction);
      return newDate;
    });
  }, []);

  // PanResponder for date navigation swipe - simpler and more reliable
  const screenWidth = Dimensions.get('window').width;
  const dateSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Don't capture if scrolling
        if (isScrolling.current) return false;
        
        const pageY = evt.nativeEvent.pageY;
        const pageX = evt.nativeEvent.pageX;
        
        // Don't capture if touching header area or navigation buttons
        if (pageY < 120 || pageX < 60 || pageX > screenWidth - 60) {
          return false;
        }
        
        // Check if horizontal movement is significant compared to vertical
        const horizontalMovement = Math.abs(gestureState.dx);
        const verticalMovement = Math.abs(gestureState.dy);
        
        // Only capture if horizontal movement is clearly dominant (2x ratio)
        // Lowered threshold to 15 to match minSwipeDistance of 20
        if (horizontalMovement > 15 && horizontalMovement > verticalMovement * 2) {
          gestureDirection.current = 'horizontal';
          return true;
        }
        
        return false;
      },
      onPanResponderGrant: (evt) => {
        touchStartX.current = evt.nativeEvent.pageX;
        touchStartY.current = evt.nativeEvent.pageY;
        hasMoved.current = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Check if user is scrolling vertically
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2) {
          gestureDirection.current = 'vertical';
          isScrolling.current = true;
          return;
        }
        
        hasMoved.current = true;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Reset scrolling flag
        setTimeout(() => {
          isScrolling.current = false;
          gestureDirection.current = null;
        }, 200);
        
        // If it was vertical scrolling, don't navigate
        if (gestureDirection.current === 'vertical' || !hasMoved.current) {
          touchStartX.current = 0;
          touchStartY.current = 0;
          return;
        }
        
        const horizontalMovement = gestureState.dx;
        const verticalMovement = Math.abs(gestureState.dy);
        const minSwipeDistance = 20;
        
        // Only navigate if horizontal swipe is significant
        if (Math.abs(horizontalMovement) > minSwipeDistance && 
            Math.abs(horizontalMovement) > verticalMovement * 1.5) {
                     
          if (horizontalMovement > 0) {
            // Swipe right - go to previous day (yesterday)
            navigateDate(-1);
          } else {
            // Swipe left - go to next day (tomorrow)
            navigateDate(1);
          }
        }
        
        // Reset
        touchStartX.current = 0;
        touchStartY.current = 0;
        hasMoved.current = false;
      },
      onPanResponderTerminate: () => {
        isScrolling.current = false;
        gestureDirection.current = null;
        touchStartX.current = 0;
        touchStartY.current = 0;
        hasMoved.current = false;
      },
    })
  ).current;


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
        onScrollBeginDrag={() => { 
          isScrolling.current = true;
          gestureDirection.current = 'vertical';
        }}
        onScrollEndDrag={() => { 
          setTimeout(() => {
            isScrolling.current = false;
            gestureDirection.current = null;
          }, 200);
        }}
        scrollEventThrottle={16}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('activity.noActivitiesYet')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>{t('activity.addFirstActivity')}</Text>
          </View>
        ) : (
          Object.entries(groupActivitiesByCategory()).map(([categoryKey, categoryActivities]) => {
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
                    swipeAnimations[activity.id] = new Animated.Value(0);
                  }
                  const slideAnimation = swipeAnimations[activity.id];
                  
                  return (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      category={activityCategory}
                      isSwiped={isSwiped}
                      isDeleting={isDeleting}
                      slideAnimation={slideAnimation}
                      colors={colors}
                      formatSeriesDetail={formatSeriesDetail}
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
        onClose={() => setShowQuickAdd(false)}
        onActivityAdded={(uniqueActivities) => {
          setActivities(uniqueActivities);
          saveActivities(uniqueActivities);
                              setShowQuickAdd(false);
        }}
        onSaveRecentActivity={saveRecentActivity}
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
        onGoToToday={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedYear(today.getFullYear());
                  setSelectedMonth(today.getMonth());
                  setShowDatePicker(false);
                }}
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
      />


    </View>
  );
};

const styles = dailyFlowStyles;

export default DailyFlowScreen;
