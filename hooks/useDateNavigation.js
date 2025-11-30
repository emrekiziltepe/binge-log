import { useState, useRef, useCallback } from 'react';
import { PanResponder, Dimensions } from 'react-native';
import { generateCalendarDays, generateYearOptions, generateMonthOptions } from '../utils/dateNavigationUtils';

/**
 * Custom hook for date navigation functionality
 * Handles date picker, calendar generation, and swipe gestures for date navigation
 */
export const useDateNavigation = (currentDate, onDateChange, t) => {
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Swipe gesture refs
  const isScrolling = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const gestureDirection = useRef(null); // 'horizontal' or 'vertical'
  const hasMoved = useRef(false);

  // Navigation functions
  const navigateDate = useCallback((direction) => {
    onDateChange(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + direction);
      return newDate;
    });
  }, [onDateChange]);

  const openDatePicker = useCallback(() => {
    setShowDatePicker(true);
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
  }, [currentDate]);

  const selectDate = useCallback((date) => {
    onDateChange(date);
    setShowDatePicker(false);
  }, [onDateChange]);

  const handleYearSelect = useCallback((year) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  }, []);

  const handleMonthSelect = useCallback((month) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    onDateChange(today);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setShowDatePicker(false);
  }, [onDateChange]);

  // Calendar generation functions
  const generateCalendarDaysMemo = useCallback(() => {
    return generateCalendarDays(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const generateYearOptionsMemo = useCallback(() => {
    return generateYearOptions();
  }, []);

  const generateMonthOptionsMemo = useCallback(() => {
    return generateMonthOptions(t);
  }, [t]);

  // PanResponder for date navigation swipe
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

  // Scroll handler helpers for use in ScrollView
  const handleScrollBeginDrag = useCallback(() => {
    isScrolling.current = true;
    gestureDirection.current = 'vertical';
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => {
      isScrolling.current = false;
      gestureDirection.current = null;
    }, 200);
  }, []);

  return {
    // Date picker state
    showDatePicker,
    setShowDatePicker,
    selectedYear,
    selectedMonth,
    showYearPicker,
    setShowYearPicker,
    showMonthPicker,
    setShowMonthPicker,
    
    // Navigation functions
    navigateDate,
    openDatePicker,
    selectDate,
    handleYearSelect,
    handleMonthSelect,
    goToToday,
    
    // Calendar generation
    generateCalendarDays: generateCalendarDaysMemo,
    generateYearOptions: generateYearOptionsMemo,
    generateMonthOptions: generateMonthOptionsMemo,
    
    // Swipe gesture
    dateSwipeResponder,
    handleScrollBeginDrag,
    handleScrollEndDrag,
  };
};
