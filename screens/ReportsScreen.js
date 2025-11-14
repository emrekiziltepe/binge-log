import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { ThemeContext } from '../contexts/ThemeContext';
import SimpleBarChart from '../components/SimpleBarChart';
import { useGoals } from '../hooks/useGoals';
import { useActivities } from '../hooks/useActivities';
import { formatActivityDetail } from '../utils/reportsUtils';
import {
  getWeekStart,
  formatWeek,
  formatMonth,
  formatYear,
  getDaysInMonth,
  getWeeksInMonth
} from '../utils/dateUtils';
import { removeDuplicates } from '../utils/commonUtils';
import { reportsStyles } from '../styles/reportsStyles';
import {
  useWeeklyCategoryData,
  useMonthlyCategoryData,
  useYearlyCategoryData,
  useMonthlyDailyData,
  useWeekDays,
  useCategories,
} from '../hooks/useReportsData';
import YearlySummary from '../components/reports/YearlySummary';
import GoalProgress from '../components/reports/GoalProgress';
import CategoryCards from '../components/reports/CategoryCards';

export default function ReportsScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useContext(ThemeContext);
  const CATEGORIES = useCategories(t);
  const [activeTab, setActiveTab] = useState('category'); // 'category' veya 'daily'
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly', 'monthly', veya 'yearly'
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date());
  const { activities, loadActivities } = useActivities({ autoLoad: false });
  const [expandedDay, setExpandedDay] = useState(null);
  const [goalProgressExpanded, setGoalProgressExpanded] = useState(true);
  const { goals, loadGoals } = useGoals();
  


  // Load weekly data function - memoized with useCallback
  const loadWeeklyData = useCallback(async () => {
    try {
      const weekStart = getWeekStart(currentWeek);
      const weekData = {};
      
      // Load activity data for each day from current activities state
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dateKey = day.toISOString().split('T')[0];
        
        // Filter activities for this specific date, exclude goals
        const dayActivities = activities.filter(activity => {
          const activityDate = activity.date || new Date(activity.timestamp).toISOString().split('T')[0];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const activityDateObj = activity.date ? new Date(activity.date + 'T00:00:00') : new Date(activity.timestamp);
          activityDateObj.setHours(0, 0, 0, 0);
          const isFutureDate = activityDateObj > today;
          const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
          return activityDate === dateKey && !isGoal;
        });
        
        weekData[dateKey] = {
          count: dayActivities.length,
          activities: dayActivities
        };
      }
      
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  }, [activities, currentWeek]);

  // useFocusEffect - runs only when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadActivities();
      loadGoals(); // Reload goals as well
    }, [loadActivities, loadGoals]) // loadActivities ve loadGoals useCallback ile memoize edildi
  );

  // Load weekly data when activities, currentWeek, or viewMode changes
  useEffect(() => {
    if (viewMode === 'weekly') {
      loadWeeklyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, currentWeek, viewMode]); // loadWeeklyData removed from dependencies

  // Load monthly data when activities change - unnecessary useEffect removed
  // Monthly data is already calculated by useMonthlyDailyData hook

  // Use hooks for data calculation
  const weeklyCategoryData = useWeeklyCategoryData(weeklyData, t);
  const monthlyCategoryData = useMonthlyCategoryData(activities, currentMonth, t);
  const yearlyCategoryData = useYearlyCategoryData(activities, currentYear, t);
  const monthlyDailyData = useMonthlyDailyData(activities, currentMonth);
  const weekDays = useWeekDays(currentWeek);

  // Calculate goal progress for a category
  const calculateGoalProgress = useCallback((category, period) => {
    const goal = goals[period]?.[category];
    // Check if goal is not null, undefined or 0 (0 can be a valid value)
    if (goal === null || goal === undefined) return null;

    const categoryData = period === 'weekly' ? weeklyCategoryData : monthlyCategoryData;
    const categoryInfo = categoryData[category];
    
    if (!categoryInfo) {
      return { current: 0, goal, progress: 0, completed: false };
    }

    let current = 0;
    
    if (category === 'book') {
      // Total pages
      Object.values(categoryInfo.groupedActivities || {}).forEach(activityGroup => {
        activityGroup.details.forEach(detail => {
          const pages = parseInt(detail) || 0;
          current += pages;
        });
      });
    } else if (category === 'series') {
      // Total episodes
      Object.values(categoryInfo.groupedActivities || {}).forEach(activityGroup => {
        activityGroup.details.forEach(detail => {
          if (detail) {
            const parts = detail.split(';');
            parts.forEach(part => {
              const episodeParts = part.split(',').slice(1);
              episodeParts.forEach(ep => {
                const episodes = ep.trim().split(',').length;
                current += episodes;
              });
            });
          }
        });
      });
    } else if (category === 'sport') {
      // Total hours
      Object.values(categoryInfo.groupedActivities || {}).forEach(activityGroup => {
        activityGroup.details.forEach(detail => {
          if (detail) {
            const detailLower = detail.toLowerCase().trim();
            const hoursMatch = detailLower.match(/(\d+\.?\d*)\s*(saat|hour|hours|s|h)/);
            const minutesMatch = detailLower.match(/(\d+\.?\d*)\s*(dakika|minute|minutes|d|min|m)/);
            
            if (hoursMatch || minutesMatch) {
              const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
              const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0;
              current += hours + (minutes / 60);
            } else if (detail.includes(':')) {
              const parts = detail.split(':');
              if (parts.length === 2) {
                const hours = parseFloat(parts[0]) || 0;
                const minutes = parseFloat(parts[1]) || 0;
                current += hours + (minutes / 60);
              }
            } else {
              const num = parseFloat(detail);
              if (!isNaN(num)) {
                current += num / 60; // Assume minutes if just a number
              }
            }
          }
        });
      });
    } else {
      // Count for movie, game, education
      current = categoryInfo.count || 0;
    }

    const progress = Math.min(100, (current / goal) * 100);
    const completed = current >= goal;
    
    return { current, goal, progress, completed };
  }, [goals, weeklyCategoryData, monthlyCategoryData]);

  // Week navigation
  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  // Month navigation
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Year navigation
  const navigateYear = (direction) => {
    const newYear = new Date(currentYear);
    newYear.setFullYear(newYear.getFullYear() + direction);
    setCurrentYear(newYear);
  };

  // Get weeks for days

  // Get activity count
  const getActivityCountForDay = (day) => {
    if (!day) return 0;
    if (viewMode === 'weekly') {
      const dateKey = day.toISOString().split('T')[0];
      return weeklyData[dateKey]?.count || 0;
    } else {
      // Use day number for monthly view
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return monthlyDailyData[dateKey]?.count || 0;
    }
  };

  const getCategoryCountsForDay = (day) => {
    if (!day) return [];
    
    let dayData;
    
    if (viewMode === 'weekly') {
      const dateKey = day.toISOString().split('T')[0];
      dayData = weeklyData[dateKey];
    } else {
      // Use day number for monthly view
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dayData = monthlyDailyData[dateKey];
    }
    
    if (!dayData || !dayData.activities) {
      return [];
    }
    
    const categoryCounts = {};
    dayData.activities.forEach(activity => {
      const category = activity.type || 'other';
      if (!categoryCounts[category]) {
        categoryCounts[category] = {
          emoji: CATEGORIES[category]?.emoji || '📝',
          count: 0
        };
      }
      categoryCounts[category].count++;
    });
    
    return Object.values(categoryCounts);
  };

  const categoryData = viewMode === 'weekly' ? weeklyCategoryData : 
                      viewMode === 'monthly' ? monthlyCategoryData : 
                      yearlyCategoryData;
  const dailyData = viewMode === 'weekly' ? weeklyData : 
                   viewMode === 'monthly' ? monthlyDailyData : 
                   {};
  
  // Weekly data

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.viewModeSelector, { backgroundColor: colors.surfaceSecondary }]}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'weekly' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[styles.viewModeText, { color: viewMode === 'weekly' ? '#fff' : colors.textSecondary }]}>
              {t('statistics.weekly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'monthly' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('monthly')}
          >
            <Text style={[styles.viewModeText, { color: viewMode === 'monthly' ? '#fff' : colors.textSecondary }]}>
              {t('statistics.monthly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'yearly' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('yearly')}
          >
            <Text style={[styles.viewModeText, { color: viewMode === 'yearly' ? '#fff' : colors.textSecondary }]}>
              {t('statistics.yearly')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarih Navigasyonu */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (viewMode === 'weekly') navigateWeek(-1);
              else if (viewMode === 'monthly') navigateMonth(-1);
              else if (viewMode === 'yearly') navigateYear(-1);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateButton}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {viewMode === 'weekly' ? formatWeek(currentWeek) : 
               viewMode === 'monthly' ? formatMonth(currentMonth) : 
               formatYear(currentYear)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (viewMode === 'weekly') navigateWeek(1);
              else if (viewMode === 'monthly') navigateMonth(1);
              else if (viewMode === 'yearly') navigateYear(1);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation - Only for weekly and monthly */}
      {viewMode !== 'yearly' && (
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: activeTab === 'category' ? colors.primary : 'transparent' }]}
            onPress={() => setActiveTab('category')}
          >
              <Text style={[styles.tabText, { color: activeTab === 'category' ? '#fff' : colors.textSecondary }]}>
                {t('statistics.category')}
              </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: activeTab === 'daily' ? colors.primary : 'transparent' }]}
            onPress={() => setActiveTab('daily')}
          >
              <Text style={[styles.tabText, { color: activeTab === 'daily' ? '#fff' : colors.textSecondary }]}>
                {t('statistics.daily')}
              </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {viewMode === 'yearly' ? (
          <YearlySummary 
            categoryData={categoryData}
            activities={activities}
            currentYear={currentYear}
            colors={colors}
          />
        ) : activeTab === 'category' ? (
          <>
            {/* Goal Progress Section */}
            <GoalProgress
              viewMode={viewMode}
              goals={goals}
              calculateGoalProgress={calculateGoalProgress}
              CATEGORIES={CATEGORIES}
              goalProgressExpanded={goalProgressExpanded}
              setGoalProgressExpanded={setGoalProgressExpanded}
              colors={colors}
            />
            
            {/* Trend Chart - Only for weekly and monthly */}
            {viewMode !== 'yearly' && Object.entries(categoryData).length > 0 && (() => {
              // Activity counts for 7 days in weekly view
              if (viewMode === 'weekly') {
                const weekStart = getWeekStart(currentWeek);
                const chartData = [];
                const chartLabels = [];
                
                for (let i = 0; i < 7; i++) {
                  const day = new Date(weekStart);
                  day.setDate(weekStart.getDate() + i);
                  const dateKey = day.toISOString().split('T')[0];
                  const dayActivities = weeklyData[dateKey]?.activities || [];
                  
                  chartData.push({ value: dayActivities.length });
                  chartLabels.push(day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' }));
                }
                
                return (
                  <View style={{ marginBottom: 16 }}>
                    <SimpleBarChart 
                      data={chartData}
                      labels={chartLabels}
                      maxValue={Math.max(...chartData.map(d => d.value), 1)}
                      height={120}
                    />
                  </View>
                );
              } else {
                // Activity counts for weeks in monthly view
                const weeks = getWeeksInMonth(currentMonth);
                const chartData = [];
                const chartLabels = [];
                
                weeks.forEach((week, weekIndex) => {
                  const weekActivities = [];
                  week.forEach(day => {
                    if (day) {
                      // day is a number (1-31), not a Date object
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      const date = new Date(year, month, day);
                      const dateKey = date.toISOString().split('T')[0];
                      const dayActivities = dailyData[dateKey]?.activities || [];
                      weekActivities.push(...dayActivities);
                    }
                  });
                  
                  chartData.push({ value: weekActivities.length });
                  chartLabels.push(t('statistics.weekNumber', { number: weekIndex + 1 }));
                });
                
                return (
                  <View style={{ marginBottom: 16 }}>
                    <SimpleBarChart 
                      data={chartData}
                      labels={chartLabels}
                      maxValue={Math.max(...chartData.map(d => d.value), 1)}
                      height={120}
                    />
                  </View>
                );
              }
            })()}
            
            {/* Category Cards */}
            <CategoryCards
              categoryData={categoryData}
              viewMode={viewMode}
              colors={colors}
              navigation={navigation}
            />
          </>
        ) : activeTab === 'daily' ? (
          // Weekly/Monthly Daily Tab
          viewMode === 'weekly' ? (
            // Weekly daily view - Show only days with activities
            weekDays.filter(day => getActivityCountForDay(day) > 0).length > 0 ? (
              weekDays
                .filter(day => getActivityCountForDay(day) > 0)
                .map((day, index) => {
                  const dateKey = day.toISOString().split('T')[0];
                  const dayActivities = weeklyData[dateKey]?.activities || [];
                  const isExpanded = expandedDay && 
                    typeof expandedDay.toDateString === 'function' && 
                    expandedDay.toDateString() === day.toDateString();
                  
                  return (
                    <View key={index}>
                      <TouchableOpacity 
                        style={[styles.dayCard, { backgroundColor: colors.card }]}
                        onPress={() => setExpandedDay(isExpanded ? null : day)}
                      >
                        <View style={styles.dayHeader}>
                          <Text style={[styles.dayName, { color: colors.text }]}>
                            {day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long' })}
                          </Text>
                          <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                            {day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                        
                        <View style={styles.activityCountContainer}>
                          <Text style={[styles.activityCountText, { color: colors.textSecondary }]}>
                            {getActivityCountForDay(day)} {t('statistics.activities')}
                          </Text>
                          <View style={[styles.dailyProgressBar, { backgroundColor: colors.surfaceSecondary }]}>
                            <View 
                              style={[
                                styles.dailyProgressFill, 
                                { 
                                  width: `${Math.min((getActivityCountForDay(day) / 10) * 100, 100)}%`,
                                  backgroundColor: colors.primary
                                }
                              ]} 
                            />
                          </View>
                        </View>
                                
                        {/* Kategori Sayıları */}
                        <View style={styles.dayCategoryIcons}>
                          {getCategoryCountsForDay(day).map(({ emoji, count }, catIndex) => (
                            <View key={catIndex} style={[styles.dayCategoryIcon, { backgroundColor: colors.surfaceSecondary }]}>
                              <Text style={styles.dayCategoryEmoji}>{emoji}</Text>
                              <Text style={[styles.dayCategoryCount, { color: colors.textSecondary }]}>{count}</Text>
                            </View>
                          ))}
                        </View>
                      </TouchableOpacity>
                      
                      {/* Genişletilmiş Gün Detayları */}
                      {isExpanded && (
                        <View style={[styles.expandedDayDetails, { backgroundColor: colors.surfaceSecondary }]}>
                          {dayActivities
                            .filter(activity => activity != null)
                            .map((activity, actIndex) => {
                              const emoji = CATEGORIES[activity.type || 'sport']?.emoji || '🏃';
                              const title = activity.title || activity.name || t('activity.activity');
                              const detailText = activity.detail ? formatActivityDetail(activity, t) : '';
                              const ratingText = activity.rating && activity.rating > 0 ? `${activity.rating}/10 ⭐` : '';
                              
                              return (
                                 <View 
                                   key={actIndex} 
                                   style={[
                                     styles.dayActivityItem,
                                     { backgroundColor: colors.surface },
                                     activity.isCompleted && { backgroundColor: colors.successLight }
                                   ]}
                                 >
                                   <View style={styles.dayActivityContent}>
                                     <Text style={styles.dayActivityEmoji}>{emoji}</Text>
                                     <Text style={[styles.dayActivityTitle, { color: colors.text }]}>{title}</Text>
                                   </View>
                                   {activity.isCompleted && (
                                     <View style={[styles.dayActivityCompletedContainer, { backgroundColor: colors.success }]}>
                                       <Text style={styles.dayActivityCompleted}>✓</Text>
                                     </View>
                                   )}
                                   {detailText !== '' && (
                                     <Text style={[styles.dayActivityDetail, { color: colors.textSecondary }]}>{detailText}</Text>
                                   )}
                                   {ratingText !== '' && (
                                     <Text style={[styles.dayActivityRating, { color: colors.warning }]}>{ratingText}</Text>
                                   )}
                                 </View>
                              );
                            })
                          }
                        </View>
                      )}
                    </View>
                  );
                })
            ) : (
              // Message for days without activities
              <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
                <Text style={styles.emptyStateEmoji}>📅</Text>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  {t('statistics.thisWeek')} {t('statistics.noActivitiesThisPeriod')}
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                  {t('statistics.addActivityToSeeStats')}
                </Text>
                <TouchableOpacity 
                  style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('Daily')}
                >
                  <Text style={styles.emptyStateButtonText}>{t('dailyFlow.goToDailyFlow')}</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            // Monthly daily view
            getWeeksInMonth(currentMonth).filter(week => 
              week.some(day => day && getActivityCountForDay(day) > 0)
            ).length > 0 ? (
              getWeeksInMonth(currentMonth).map((week, weekIndex) => {
                const activeDaysInWeek = week.filter(day => day && getActivityCountForDay(day) > 0);
                
                if (activeDaysInWeek.length === 0) {
                  return null;
                }
                
                const weekTotalActivities = activeDaysInWeek.reduce((sum, day) => sum + getActivityCountForDay(day), 0);
                
                return (
                  <View key={weekIndex}>
                    <TouchableOpacity 
                      style={[styles.dayCard, { backgroundColor: colors.card }]}
                      onPress={() => setExpandedDay(expandedDay === `week-${weekIndex}` ? null : `week-${weekIndex}`)}
                    >
                      <View style={styles.dayHeader}>
                        <Text style={[styles.dayName, { color: colors.text }]}>
                          {t('statistics.weekNumber', { number: weekIndex + 1 })}
                        </Text>
                        <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                          {weekTotalActivities} {t('statistics.activities')}
                        </Text>
                      </View>
                      
                      <View style={styles.activityCountContainer}>
                        <Text style={[styles.activityCountText, { color: colors.textSecondary }]}>
                          {activeDaysInWeek.length} {t('statistics.activeDays')}
                        </Text>
                        <View style={[styles.dailyProgressBar, { backgroundColor: colors.surfaceSecondary }]}>
                          <View 
                            style={[
                              styles.dailyProgressFill, 
                              { 
                                width: `${Math.min((weekTotalActivities / 50) * 100, 100)}%`,
                                backgroundColor: colors.primary
                              }
                            ]} 
                          />
                        </View>
                      </View>
                      
                      {/* Hafta içindeki kategori sayıları */}
                      <View style={styles.dayCategoryIcons}>
                        {(() => {
                          const weekCategoryCounts = {};
                          activeDaysInWeek.forEach(day => {
                            getCategoryCountsForDay(day).forEach(({ emoji, count }) => {
                              if (!weekCategoryCounts[emoji]) {
                                weekCategoryCounts[emoji] = 0;
                              }
                              weekCategoryCounts[emoji] += count;
                            });
                          });
                          
                          return Object.entries(weekCategoryCounts).map(([emoji, count], catIndex) => (
                            <View key={catIndex} style={[styles.dayCategoryIcon, { backgroundColor: colors.surfaceSecondary }]}>
                              <Text style={styles.dayCategoryEmoji}>{emoji}</Text>
                              <Text style={[styles.dayCategoryCount, { color: colors.textSecondary }]}>{count}</Text>
                            </View>
                          ));
                        })()}
                      </View>
                    </TouchableOpacity>
                    
                    {expandedDay === `week-${weekIndex}` && (
                      <View style={[styles.expandedDayDetails, { backgroundColor: colors.surfaceSecondary }]}>
                        {(() => {
                          const weekActivities = [];
                          activeDaysInWeek.forEach(day => {
                            const year = currentMonth.getFullYear();
                            const month = currentMonth.getMonth();
                            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayActivities = dailyData[dateKey]?.activities || [];
                            weekActivities.push(...dayActivities.filter(activity => activity != null));
                          });
                          
                          const groupedActivities = {};
                          weekActivities.forEach(activity => {
                            const activityKey = activity.title || activity.name;
                            if (!groupedActivities[activityKey]) {
                              groupedActivities[activityKey] = {
                                name: activity.title || activity.name,
                                count: 0,
                                details: [],
                                activities: [],
                                isCompleted: false
                              };
                            }
                            groupedActivities[activityKey].count++;
                            groupedActivities[activityKey].activities.push(activity);
                            if (activity.detail) {
                              groupedActivities[activityKey].details.push(activity.detail);
                            }
                            if (activity.isCompleted) {
                              groupedActivities[activityKey].isCompleted = true;
                            }
                          });

                          return Object.entries(groupedActivities).map(([activityKey, activityGroup], index) => {
                            let detailText = '';
                            const category = activityGroup.activities[0]?.type || 'other';
                            
                            if (category === 'series') {
                              const seasonEpisodes = {};
                              activityGroup.details.forEach(detail => {
                                if (detail) {
                                  const parts = detail.split(';');
                                  parts.forEach(part => {
                                    const [season, ...episodeParts] = part.split(',');
                                    const episodes = episodeParts.join(',');
                                    if (!seasonEpisodes[season]) {
                                      seasonEpisodes[season] = new Set();
                                    }
                                    episodes.split(',').forEach(ep => {
                                      seasonEpisodes[season].add(ep.trim());
                                    });
                                  });
                                }
                              });
                              
                              const seasonDetails = Object.entries(seasonEpisodes).map(([season, episodes]) => {
                                const episodeList = Array.from(episodes)
                                  .map(ep => parseInt(ep))
                                  .filter(ep => !isNaN(ep))
                                  .sort((a, b) => a - b);
                                
                                if (episodeList.length === 0) {
                                  return `${t('activity.season')} ${season || t('activity.unknown')}`;
                                }
                                
                                const ranges = [];
                                let start = episodeList[0];
                                let end = episodeList[0];
                                
                                for (let i = 1; i < episodeList.length; i++) {
                                  if (episodeList[i] === end + 1) {
                                    end = episodeList[i];
                                  } else {
                                    if (start === end) {
                                      ranges.push(start.toString());
                                    } else {
                                      ranges.push(`${start}-${end}`);
                                    }
                                    start = episodeList[i];
                                    end = episodeList[i];
                                  }
                                }
                                
                                if (start === end) {
                                  ranges.push(start.toString());
                                } else {
                                  ranges.push(`${start}-${end}`);
                                }
                                
                                return `${t('activity.season')} ${season || t('activity.unknown')}, ${t('activity.episode')}: ${ranges.length > 0 ? ranges.join(', ') : t('activity.noEpisodes')}`;
                              });
                              
                              detailText = `${seasonDetails.length > 0 ? seasonDetails.join(' | ') : t('activity.noDetails')}`;
                              
                            } else if (category === 'book') {
                              const totalPages = activityGroup.details.reduce((sum, detail) => {
                                const pages = parseInt(detail) || 0;
                                return sum + pages;
                              }, 0);
                              
                              detailText = `${t('activity.pagesCount', { pages: totalPages })}`;
                            } else if (category === 'sport') {
                              // Calculate total duration for sport
                              let totalMinutes = 0;
                              activityGroup.details.forEach(detail => {
                                if (detail) {
                                  // Format: "X hours Y minutes" or "X:Y" or just numbers
                                  const detailLower = detail.toLowerCase().trim();
                                  
                                  // "X hours Y minutes" format
                                  const hoursMatch = detailLower.match(/(\d+)\s*(saat|hour|hours|s|h)/);
                                  const minutesMatch = detailLower.match(/(\d+)\s*(dakika|minute|minutes|d|min|m)/);
                                  
                                  if (hoursMatch || minutesMatch) {
                                    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
                                    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
                                    totalMinutes += hours * 60 + minutes;
                                  } else if (detail.includes(':')) {
                                    // "X:Y" format (e.g. "1:30")
                                    const parts = detail.split(':');
                                    if (parts.length === 2) {
                                      const hours = parseInt(parts[0]) || 0;
                                      const minutes = parseInt(parts[1]) || 0;
                                      totalMinutes += hours * 60 + minutes;
                                    }
                                  } else {
                                    // If only number exists, accept as minutes
                                    const num = parseInt(detail);
                                    if (!isNaN(num)) {
                                      totalMinutes += num;
                                    }
                                  }
                                }
                              });
                              
                              const totalHours = Math.floor(totalMinutes / 60);
                              const remainingMinutes = totalMinutes % 60;
                              
                              if (totalMinutes > 0) {
                                if (totalHours > 0 && remainingMinutes > 0) {
                                  detailText = `${totalHours} ${t('activity.hours').toLowerCase()} ${remainingMinutes} ${t('activity.minutes').toLowerCase()}`;
                                } else if (totalHours > 0) {
                                  detailText = `${totalHours} ${t('activity.hours').toLowerCase()}`;
                                } else {
                                  detailText = `${remainingMinutes} ${t('activity.minutes').toLowerCase()}`;
                                }
                              }
                            }
                            
                            const ratingText = activityGroup.activities.some(activity => activity.rating && activity.rating > 0) 
                              ? activityGroup.activities.find(activity => activity.rating && activity.rating > 0)?.rating + '/10 ⭐'
                              : '';
                            
                            return (
                              <View key={index} style={[
                                styles.dayActivityItem,
                                { 
                                  backgroundColor: activityGroup.isCompleted ? colors.successLight : colors.surface,
                                  borderColor: colors.border
                                }
                              ]}>
                                <View style={styles.dayActivityContent}>
                                  <Text style={styles.dayActivityEmoji}>
                                    {CATEGORIES[category]?.emoji || '🏃'}
                                  </Text>
                                  <Text style={[styles.dayActivityTitle, { color: colors.text }]}>{activityGroup.name || t('activity.activity')}</Text>
                                </View>
                                {activityGroup.isCompleted && (
                                  <View style={[styles.dayActivityCompletedContainer, { backgroundColor: colors.success }]}>
                                    <Text style={styles.dayActivityCompleted}>✓</Text>
                                  </View>
                                )}
                                {detailText !== '' && (
                                  <Text style={[styles.dayActivityDetail, { color: colors.textSecondary }]}>{detailText}</Text>
                                )}
                                {ratingText !== '' && (
                                  <Text style={[styles.dayActivityRating, { color: colors.textSecondary }]}>{ratingText}</Text>
                                )}
                              </View>
                            );
                          });
                        })()}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
                <Text style={styles.emptyStateEmoji}>📅</Text>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  {t('statistics.thisMonth')} {t('statistics.noActivitiesThisPeriod')}
                </Text>
                <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
                  {t('statistics.addActivityToSeeStats')}
                </Text>
                <TouchableOpacity 
                  style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('Daily')}
                >
                  <Text style={styles.emptyStateButtonText}>
                    {t('dailyFlow.goToDailyFlow')}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = reportsStyles;
