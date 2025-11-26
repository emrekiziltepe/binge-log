import React from 'react';
import { View, Text } from 'react-native';
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
        const topActivity = getTopActivityForCategory(category, data);
        
        if (category === 'book') {
          // Count completed books
          let completedBooks = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            if (activityGroup.activities && activityGroup.activities.some(a => a.isCompleted)) {
              completedBooks++;
            }
          });
          let totalPages = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            activityGroup.details.forEach(detail => {
              const pages = parseInt(detail) || 0;
              totalPages += pages;
            });
          });
          mainValue = completedBooks.toString();
          mainLabel = t('statistics.booksCompleted', { count: completedBooks });
          wrappedMessage = totalPages > 0 ? `${totalPages} ${t('goals.pages')}` : '';
        } else if (category === 'series') {
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
          mainValue = totalEpisodes.toString();
          mainLabel = t('statistics.seriesEpisodes', { count: totalEpisodes });
          wrappedMessage = '';
        } else if (category === 'movie') {
          mainValue = data.count.toString();
          mainLabel = t('statistics.moviesWatched', { count: data.count });
          wrappedMessage = '';
        } else if (category === 'game') {
          let completedGames = 0;
          Object.values(data.groupedActivities || {}).forEach(activityGroup => {
            if (activityGroup.activities && activityGroup.activities.some(a => a.isCompleted)) {
              completedGames++;
            }
          });
          mainValue = data.count.toString();
          mainLabel = t('statistics.gamesPlayed', { count: data.count });
          wrappedMessage = completedGames > 0 ? `${completedGames} ${t('statistics.totalCompleted').toLowerCase()}` : '';
        } else if (category === 'education') {
          mainValue = data.count.toString();
          mainLabel = t('statistics.coursesLearned', { count: data.count });
          wrappedMessage = '';
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
          mainLabel = t('statistics.hoursTrained', { count: totalHours.toFixed(1) });
          wrappedMessage = '';
        }

        return (
          <View key={category} style={[styles.wrappedCard, { backgroundColor: cardColor, opacity: 0.9 }]}>
            <Text style={styles.wrappedCardEmoji}>{data.categoryInfo?.emoji || '🏃'}</Text>
            <Text style={styles.wrappedCardNumber}>{mainValue}</Text>
            <Text style={styles.wrappedCardLabel}>{mainLabel}</Text>
            {wrappedMessage && (
              <Text style={styles.wrappedCardSubtext}>{wrappedMessage}</Text>
            )}
            {topActivity && (
              <Text style={styles.wrappedCardTopActivity}>
                {t('statistics.topActivity')}: {topActivity}
              </Text>
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

