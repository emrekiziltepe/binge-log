import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { reportsStyles } from '../../styles/reportsStyles';

const styles = reportsStyles;

export default function CategoryCards({ 
  categoryData, 
  viewMode, 
  colors, 
  navigation 
}) {
  const { t } = useTranslation();

  if (Object.entries(categoryData).length === 0) {
    return (
      <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
        <Text style={styles.emptyStateEmoji}>📊</Text>
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
          {viewMode === 'weekly' ? t('statistics.thisWeek') : 
           viewMode === 'monthly' ? t('statistics.thisMonth') : 
           t('statistics.thisYear')} {t('statistics.noActivitiesThisPeriod')}
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
    );
  }

  return (
    <>
      {Object.entries(categoryData)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([category, data]) => (
          <View key={category} style={[styles.categoryCard, { backgroundColor: colors.card }]}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryEmoji}>{data.categoryInfo?.emoji || '🏃'}</Text>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {data.categoryInfo?.name || t('categories.sport')}
              </Text>
            </View>
          
            <View style={styles.categoryDetails}>
              {Object.entries(data.groupedActivities).map(([activityKey, activityGroup], index) => {
                const isCompleted = activityGroup && activityGroup.activities && 
                  activityGroup.activities.some(activity => activity.isCompleted);
                
                let detailText = '';
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
                  
                  detailText = `${activityGroup.name || t('activity.activity')}: ${seasonDetails.length > 0 ? seasonDetails.join(' | ') : t('activity.noDetails')}`;
                  
                } else if (category === 'book') {
                  const totalPages = activityGroup.details.reduce((sum, detail) => {
                    const pages = parseInt(detail) || 0;
                    return sum + pages;
                  }, 0);
                  
                  detailText = `${activityGroup.name || t('activity.activity')}: ${t('activity.totalPages', { pages: totalPages })}`;
                } else if (category === 'sport') {
                  // Calculate total duration for sport
                  let totalMinutes = 0;
                  activityGroup.details.forEach(detail => {
                    if (detail) {
                      const detailLower = detail.toLowerCase().trim();
                      
                      const hoursMatch = detailLower.match(/(\d+)\s*(saat|hour|hours|s|h)/);
                      const minutesMatch = detailLower.match(/(\d+)\s*(dakika|minute|minutes|d|min|m)/);
                      
                      if (hoursMatch || minutesMatch) {
                        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
                        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
                        totalMinutes += hours * 60 + minutes;
                      } else if (detail.includes(':')) {
                        const parts = detail.split(':');
                        if (parts.length === 2) {
                          const hours = parseInt(parts[0]) || 0;
                          const minutes = parseInt(parts[1]) || 0;
                          totalMinutes += hours * 60 + minutes;
                        }
                      } else {
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
                    let durationText = '';
                    if (totalHours > 0 && remainingMinutes > 0) {
                      durationText = `${totalHours} ${t('activity.hours').toLowerCase()} ${remainingMinutes} ${t('activity.minutes').toLowerCase()}`;
                    } else if (totalHours > 0) {
                      durationText = `${totalHours} ${t('activity.hours').toLowerCase()}`;
                    } else {
                      durationText = `${remainingMinutes} ${t('activity.minutes').toLowerCase()}`;
                    }
                    detailText = `${activityGroup.name || t('activity.activity')}: ${durationText}`;
                  } else {
                    detailText = `${activityGroup.name || t('activity.activity')} (${activityGroup.count} ${t('statistics.days')})`;
                  }
                } else {
                  detailText = `${activityGroup.name || t('activity.activity')} (${activityGroup.count} ${t('statistics.days')})`;
                }
                
                return (
                  <View key={index} style={[
                    styles.categoryDetailRow,
                    { backgroundColor: isCompleted ? colors.successLight : colors.surfaceSecondary }
                  ]}>
                    <Text style={[styles.categoryDetailText, { color: colors.textSecondary }]}>
                      {detailText}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
    </>
  );
}

