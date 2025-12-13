import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SimpleBarChart from '../SimpleBarChart';
import { reportsStyles } from '../../styles/reportsStyles';
import { formatLocalDate } from '../../utils/dateUtils';

const styles = reportsStyles;

export default function YearlySummary({ 
  categoryData, 
  activities, 
  currentYear, 
  colors 
}) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState(null);

  if (Object.entries(categoryData).length === 0) {
    return (
      <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
        <Text style={styles.emptyStateEmoji}>📊</Text>
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
          {t('statistics.thisYear')} {t('statistics.noActivitiesThisPeriod')}
        </Text>
        <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
          {t('statistics.addActivityToSeeStats')}
        </Text>
      </View>
    );
  }

  const totalActivities = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    const yearStart = new Date(currentYear.getFullYear(), 0, 1);
    const yearEnd = new Date(currentYear.getFullYear(), 11, 31, 23, 59, 59);
    return activityDate >= yearStart && activityDate <= yearEnd;
  }).length;

  const allDays = new Set();
  activities.forEach(a => {
    const activityDate = new Date(a.timestamp);
    const yearStart = new Date(currentYear.getFullYear(), 0, 1);
    const yearEnd = new Date(currentYear.getFullYear(), 11, 31, 23, 59, 59);
    if (activityDate >= yearStart && activityDate <= yearEnd) {
      allDays.add(a.date || formatLocalDate(new Date(a.timestamp)));
    }
  });

  // Find top category
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b.count - a.count);
  const topCategory = sortedCategories[0];

  // Find most active month
  const monthCounts = {};
  activities.forEach(a => {
    const activityDate = new Date(a.timestamp);
    const yearStart = new Date(currentYear.getFullYear(), 0, 1);
    const yearEnd = new Date(currentYear.getFullYear(), 11, 31, 23, 59, 59);
    if (activityDate >= yearStart && activityDate <= yearEnd) {
      const month = activityDate.getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
  });
  const mostActiveMonth = Object.entries(monthCounts).sort(([, a], [, b]) => b - a)[0];
  const mostActiveMonthName = mostActiveMonth ? t(`datePicker.months.${['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][parseInt(mostActiveMonth[0])]}`) : null;

  // Find top activity for each category
  const getTopActivityForCategory = (category, data) => {
    if (!data.groupedActivities) return null;
    const sorted = Object.entries(data.groupedActivities)
      .sort(([, a], [, b]) => b.count - a.count);
    return sorted[0] ? sorted[0][1].name : null;
  };

  const categoryColors = {
    book: '#8B4513',
    series: '#FF6B6B',
    movie: '#4ECDC4',
    game: '#45B7D1',
    education: '#96CEB4',
    sport: '#FF9500'
  };

  return (
    <>
      {/* Header Card - Year Title */}
      <View style={[styles.wrappedHeaderCard, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.wrappedHeaderTitle, { color: colors.primary }]}>
          {t('statistics.yourYearIn', { year: currentYear.getFullYear() })}
        </Text>
      </View>

      {/* Total Activities Card */}
      <View style={[styles.wrappedCard, { backgroundColor: '#FF6B6B', opacity: 0.9 }]}>
        <Text style={styles.wrappedCardEmoji}>✨</Text>
        <Text style={styles.wrappedCardNumber}>{totalActivities}</Text>
        <Text style={styles.wrappedCardLabel}>{t('statistics.totalActivities')}</Text>
      </View>

      {/* Total Days Card */}
      <View style={[styles.wrappedCard, { backgroundColor: '#4ECDC4', opacity: 0.9 }]}>
        <Text style={styles.wrappedCardEmoji}>📅</Text>
        <Text style={styles.wrappedCardNumber}>{allDays.size}</Text>
        <Text style={styles.wrappedCardLabel}>{t('statistics.totalDays')} {t('statistics.activeDays').toLowerCase()}</Text>
      </View>

      {/* Top Category Card */}
      {topCategory && (
        <View style={[styles.wrappedCard, { backgroundColor: '#45B7D1', opacity: 0.9 }]}>
          <Text style={styles.wrappedCardEmoji}>{topCategory[1].categoryInfo?.emoji || '🏆'}</Text>
          <Text style={styles.wrappedCardLabel}>{t('statistics.topCategory')}</Text>
          <Text style={styles.wrappedCardNumber}>{topCategory[1].categoryInfo?.name || t('categories.sport')}</Text>
          <Text style={styles.wrappedCardSubtext}>{topCategory[1].count} {t('statistics.activities')}</Text>
        </View>
      )}

      {/* Most Active Month Card */}
      {mostActiveMonthName && (
        <View style={[styles.wrappedCard, { backgroundColor: '#96CEB4', opacity: 0.9 }]}>
          <Text style={styles.wrappedCardEmoji}>🔥</Text>
          <Text style={styles.wrappedCardLabel}>{t('statistics.mostActiveMonth')}</Text>
          <Text style={styles.wrappedCardNumber}>{mostActiveMonthName}</Text>
          <Text style={styles.wrappedCardSubtext}>{mostActiveMonth[1]} {t('statistics.activities')}</Text>
        </View>
      )}

      {/* Category Specific Cards */}
      {sortedCategories.map(([category, data]) => {
        const cardColor = categoryColors[category] || '#6366f1';
        
        let mainValue = '';
        let mainLabel = '';
        let wrappedMessage = '';
        let wrappedMessageTop = '';
        let wrappedMessageBottom = '';
        const topActivity = getTopActivityForCategory(category, data);
        
        if (category === 'book') {
          // Count completed books
          let completedBooks = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            if (activityGroup.activities && activityGroup.activities.some(a => a.isCompleted)) {
              completedBooks++;
            }
          });
          // Count total unique books read (regardless of completion)
          const totalBooksRead = Object.keys(data.groupedActivities || {}).length;
          let totalPages = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            activityGroup.details.forEach(detail => {
              const pages = parseInt(detail) || 0;
              totalPages += pages;
            });
          });
          mainValue = totalBooksRead.toString();
          mainLabel = t('statistics.booksReadLabel');
          wrappedMessageTop = totalPages > 0 ? t('statistics.totalPagesRead', { count: totalPages }) : '';
          wrappedMessageBottom = completedBooks > 0 ? t('statistics.booksCompleted', { count: completedBooks }) : '';
        } else if (category === 'series') {
          // Count unique series (different series watched)
          const uniqueSeriesCount = Object.keys(data.groupedActivities || {}).length;
          
          // Count completed series
          let completedSeries = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            if (activityGroup.activities && activityGroup.activities.some(a => a.isCompleted)) {
              completedSeries++;
            }
          });
          
          // Calculate total episodes watched
          let totalEpisodes = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            activityGroup.details.forEach(detail => {
              if (detail) {
                const parts = detail.split(';');
                parts.forEach(part => {
                  const episodeParts = part.split(',').slice(1);
                  episodeParts.forEach(ep => {
                    const episodes = ep.trim().split(',').length;
                    totalEpisodes += episodes;
                  });
                });
              }
            });
          });
          
          mainValue = uniqueSeriesCount.toString();
          mainLabel = t('statistics.seriesWatchedLabel');
          wrappedMessage = t('statistics.seriesEpisodes', { count: totalEpisodes });
          wrappedMessageBottom = completedSeries > 0 ? t('statistics.seriesCompleted', { count: completedSeries }) : '';
        } else if (category === 'movie') {
          mainValue = data.count.toString();
          mainLabel = t('statistics.moviesWatchedLabel');
          wrappedMessage = '';
        } else if (category === 'game') {
          // Count unique games (different games played)
          const uniqueGamesCount = Object.keys(data.groupedActivities || {}).length;
          let completedGames = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            if (activityGroup.activities && activityGroup.activities.some(a => a.isCompleted)) {
              completedGames++;
            }
          });
          mainValue = uniqueGamesCount.toString();
          mainLabel = t('statistics.gamesPlayedLabel');
        } else if (category === 'education') {
          mainValue = data.count.toString();
          mainLabel = t('statistics.coursesLearnedLabel');
        } else if (category === 'sport') {
          let totalHours = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            activityGroup.details.forEach(detail => {
              if (detail) {
                const detailLower = detail.toLowerCase().trim();
                if (detailLower.includes('saat') || detailLower.includes('hour')) {
                  const match = detail.match(/(\d+\.?\d*)/);
                  if (match) totalHours += parseFloat(match[1]);
                } else if (detailLower.includes(':')) {
                  const parts = detail.split(':');
                  if (parts.length === 2) {
                    totalHours += parseFloat(parts[0]) + (parseFloat(parts[1]) / 60);
                  }
                }
              }
            });
          });
          mainValue = totalHours.toFixed(1);
          mainLabel = t('statistics.hoursTrainedLabel');
          wrappedMessage = '';
        }

        const isExpanded = expandedCategory === category;
        const groupedActivitiesList = Object.entries(data.groupedActivities || {})
          .sort(([, a], [, b]) => b.count - a.count);

        return (
          <View key={category} style={[styles.wrappedCard, { backgroundColor: cardColor, opacity: 0.9 }]}>
            <Text style={styles.wrappedCardEmoji}>{data.categoryInfo?.emoji || '🏃'}</Text>
            <TouchableOpacity
              style={styles.wrappedCardNumberTouchable}
              onPress={() => setExpandedCategory(isExpanded ? null : category)}
              activeOpacity={0.7}
            >
              <View style={styles.wrappedCardNumberContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.wrappedCardNumber}>{mainValue}</Text>
                  {mainLabel && (
                    <Text style={[styles.wrappedCardLabel, { marginLeft: 8 }]}>{mainLabel}</Text>
                  )}
                </View>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="rgba(255, 255, 255, 0.9)" 
                  style={styles.wrappedCardChevron}
                />
              </View>
            </TouchableOpacity>
            {category === 'book' ? (
              <>
                {wrappedMessageTop && (
                  <Text style={styles.wrappedCardSubtext}>{wrappedMessageTop}</Text>
                )}
                {wrappedMessageBottom && (
                  <Text style={styles.wrappedCardSubtext}>{wrappedMessageBottom}</Text>
                )}
              </>
            ) : (
              <>
                {wrappedMessage && (
                  <Text style={styles.wrappedCardSubtext}>{wrappedMessage}</Text>
                )}
                {wrappedMessageBottom && (
                  <Text style={styles.wrappedCardSubtext}>{wrappedMessageBottom}</Text>
                )}
              </>
            )}
            {topActivity && !isExpanded && (
              <Text style={styles.wrappedCardTopActivity}>
                {t('statistics.topActivity')}: {topActivity}
              </Text>
            )}
            
            {/* Expanded Details */}
            {isExpanded && (
              <View style={styles.wrappedCardDetails}>
                {groupedActivitiesList.map(([activityKey, activityGroup], index) => {
                  const isLast = index === groupedActivitiesList.length - 1;
                  let detailText = '';
                  
                  if (category === 'book') {
                    const totalPages = activityGroup.details.reduce((sum, detail) => {
                      return sum + (parseInt(detail) || 0);
                    }, 0);
                    const isCompleted = activityGroup.activities.some(a => a.isCompleted);
                    detailText = totalPages > 0 
                      ? `${totalPages} ${t('goals.pages')}${isCompleted ? ` • ✓` : ''}`
                      : (isCompleted ? '• ✓' : '');
                  } else if (category === 'series') {
                    let totalEpisodes = 0;
                    activityGroup.details.forEach(detail => {
                      if (detail) {
                        const parts = detail.split(';');
                        parts.forEach(part => {
                          const episodeParts = part.split(',').slice(1);
                          episodeParts.forEach(ep => {
                            const episodes = ep.trim().split(',').length;
                            totalEpisodes += episodes;
                          });
                        });
                      }
                    });
                    detailText = totalEpisodes > 0 ? `${totalEpisodes} ${t('statistics.activities')}` : '';
                  } else if (category === 'movie') {
                    detailText = `${activityGroup.count} ${t('statistics.activities')}`;
                  } else if (category === 'game') {
                    const isCompleted = activityGroup.activities.some(a => a.isCompleted);
                    detailText = `${activityGroup.count} ${t('statistics.activities')}${isCompleted ? ` • ✓` : ''}`;
                  } else if (category === 'education') {
                    detailText = `${activityGroup.count} ${t('statistics.activities')}`;
                  } else if (category === 'sport') {
                    let totalHours = 0;
                    activityGroup.details.forEach(detail => {
                      if (detail) {
                        const detailLower = detail.toLowerCase().trim();
                        if (detailLower.includes('saat') || detailLower.includes('hour')) {
                          const match = detail.match(/(\d+\.?\d*)/);
                          if (match) totalHours += parseFloat(match[1]);
                        } else if (detailLower.includes(':')) {
                          const parts = detail.split(':');
                          if (parts.length === 2) {
                            totalHours += parseFloat(parts[0]) + (parseFloat(parts[1]) / 60);
                          }
                        }
                      }
                    });
                    detailText = totalHours > 0 ? `${totalHours.toFixed(1)} ${t('goals.hours')}` : '';
                  }

                  return (
                    <View key={activityKey} style={[styles.wrappedCardDetailItem, isLast && styles.wrappedCardDetailItemLast]}>
                      <Text style={styles.wrappedCardDetailTitle} numberOfLines={1}>
                        {activityGroup.name || activityKey}
                      </Text>
                      {detailText ? (
                        <Text style={styles.wrappedCardDetailValue}>{detailText}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
            
            {/* Monthly Breakdown Chart */}
            {data.monthlyBreakdown && Object.keys(data.monthlyBreakdown).length > 0 && (
              <View style={styles.wrappedChartContainer}>
                <SimpleBarChart
                  data={Array.from({ length: 12 }, (_, i) => ({
                    value: data.monthlyBreakdown[i] || 0
                  }))}
                  labels={[
                    t('datePicker.months.january').substring(0, 3),
                    t('datePicker.months.february').substring(0, 3),
                    t('datePicker.months.march').substring(0, 3),
                    t('datePicker.months.april').substring(0, 3),
                    t('datePicker.months.may').substring(0, 3),
                    t('datePicker.months.june').substring(0, 3),
                    t('datePicker.months.july').substring(0, 3),
                    t('datePicker.months.august').substring(0, 3),
                    t('datePicker.months.september').substring(0, 3),
                    t('datePicker.months.october').substring(0, 3),
                    t('datePicker.months.november').substring(0, 3),
                    t('datePicker.months.december').substring(0, 3),
                  ]}
                  maxValue={Math.max(...Object.values(data.monthlyBreakdown), 1)}
                  height={80}
                />
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

