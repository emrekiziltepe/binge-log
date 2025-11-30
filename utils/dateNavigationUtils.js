/**
 * Utility functions for date navigation and calendar generation
 */

/**
 * Generate calendar days for a given month and year
 * Returns array of day objects with date, isCurrentMonth, and isToday flags
 */
export const generateCalendarDays = (selectedYear, selectedMonth) => {
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

/**
 * Generate year options for year picker
 * Returns array of years (last 10 years + current year + next 5 years)
 */
export const generateYearOptions = () => {
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

/**
 * Generate month options for month picker
 * Returns array of translated month names
 */
export const generateMonthOptions = (t) => {
  return [
    t('datePicker.months.january'), 
    t('datePicker.months.february'), 
    t('datePicker.months.march'), 
    t('datePicker.months.april'),
    t('datePicker.months.may'), 
    t('datePicker.months.june'),
    t('datePicker.months.july'), 
    t('datePicker.months.august'), 
    t('datePicker.months.september'), 
    t('datePicker.months.october'), 
    t('datePicker.months.november'), 
    t('datePicker.months.december')
  ];
};
