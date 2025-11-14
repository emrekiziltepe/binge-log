import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated } from 'react-native';
import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function ActivityCard({
  activity,
  category,
  isSwiped,
  isDeleting,
  panResponder,
  slideAnimation,
  colors,
  formatSeriesDetail,
  getRatingColor,
  onEdit,
  onSwipeDelete,
  onLongPress
}) {
  const { t } = useTranslation();

  // Check if activity is a goal (future-dated)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activityDate = activity.date ? new Date(activity.date + 'T00:00:00') : new Date();
  activityDate.setHours(0, 0, 0, 0);
  const isFutureDate = activityDate > today;
  const isGoal = activity.isGoal || (isFutureDate && !activity.isCompleted);
  
  // Goal colors - theme aware
  const goalBackgroundColor = colors.background === '#0f172a' // Dark theme check
    ? '#475569' // Dark theme: noticeably lighter than card background (#1e293b -> #475569)
    : '#FFF9E6'; // Light theme: very light pastel yellow
  const goalBorderColor = colors.background === '#0f172a' // Dark theme check
    ? '#94a3b8' // Dark theme: more visible, lighter border
    : '#FFE082'; // Light theme: pastel yellow border

  return (
    <View style={styles.activityCardContainer}>
      <Animated.View 
        style={[
          styles.deleteButtonContainer,
          {
            transform: [{ translateX: slideAnimation }],
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onSwipeDelete(activity)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Aktivite Kartı */}
      <Animated.View
        style={[
          styles.activityCard,
          { 
            backgroundColor: isGoal ? goalBackgroundColor : colors.card,
            borderLeftColor: category.color, 
            borderLeftWidth: 4,
            borderRightColor: isGoal ? goalBorderColor : colors.error,
            borderRightWidth: 3,
          },
          activity.isCompleted && { backgroundColor: colors.successLight },
          isDeleting && styles.activityCardDeleting,
          {
            transform: [{ translateX: slideAnimation }],
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable 
          style={({ pressed }) => [
            styles.activityCardPressable,
            pressed && styles.activityCardPressed
          ]}
          onPress={onEdit}
          onLongPress={isGoal && onLongPress ? () => onLongPress(activity) : undefined}
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
        >
          <View style={styles.activityContent}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {isGoal && (
                    <Text style={{ marginRight: 8, fontSize: 18 }}>🎯</Text>
                  )}
                  <Text style={[styles.activityTitle, { color: colors.text, flex: 1 }]}>
                    {activity.title}
                  </Text>
                </View>
                {activity.isCompleted && (
                  <View style={[styles.completionIcon, { backgroundColor: colors.success }]}>
                    <Text style={styles.completionIconText}>✓</Text>
                  </View>
                )}
              </View>
              {isGoal && (
                <Text style={[styles.activityDetail, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
                  {t('activity.isGoal')} • {activityDate.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              )}
            </View>
            {activity.detail && (
              <Text style={[styles.activityDetail, { color: colors.textSecondary }]}>
                {activity.type === 'series' 
                  ? formatSeriesDetail(activity.detail) 
                  : activity.type === 'sport'
                  ? activity.detail
                  : `${category.detailLabel}: ${activity.detail}`}
              </Text>
            )}
            {activity.isCompleted && activity.rating > 0 && (
              <View style={styles.activityRating}>
                <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>{t('activity.rating')}: </Text>
                <View style={[
                  styles.ratingBadgeCompleted, 
                  { 
                    backgroundColor: getRatingColor(activity.rating),
                    shadowColor: getRatingColor(activity.rating)
                  }
                ]}>
                  <Text style={styles.ratingBadgeTextCompleted}>{activity.rating}/10</Text>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

