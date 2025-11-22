/**
 * Date utility functions
 * Centralized date formatting and manipulation functions
 */
import i18n from '../i18n';

/**
 * Format date for display with full weekday, year, month, day
 */
export const formatDate = (date, locale = null) => {
  const localeStr = locale || (i18n.language === 'tr' ? 'tr-TR' : 'en-US');
  return date.toLocaleDateString(localeStr, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate week start (Monday start)
 */
export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
};

/**
 * Format week string (e.g., "Jan 1 - Jan 7, 2024")
 */
export const formatWeek = (date) => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return `${weekStart.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/**
 * Format month string (e.g., "January 2024")
 */
export const formatMonth = (date) => {
  return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });
};

/**
 * Format year string (e.g., "2024")
 */
export const formatYear = (date) => {
  return date.getFullYear().toString();
};

/**
 * Get days in month as array with null padding for calendar grid
 */
export const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  return days;
};

/**
 * Get weeks in month (grouped by 7 days)
 */
export const getWeeksInMonth = (date) => {
  const days = getDaysInMonth(date);
  const weeks = [];
  
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);
  }
  
  return weeks;
};

/**
 * Get days in month for calendar display (returns Date objects)
 */
export const getDaysInMonthForCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

/**
 * Get start of day (00:00:00)
 */
export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day (23:59:59)
 */
export const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Format date in local timezone as YYYY-MM-DD string
 * This avoids timezone issues with toISOString()
 */
export const formatLocalDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

