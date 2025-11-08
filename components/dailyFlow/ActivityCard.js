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
  onSwipeDelete
}) {
  const { t } = useTranslation();

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
            backgroundColor: colors.card,
            borderLeftColor: category.color, 
            borderLeftWidth: 4,
            borderRightColor: colors.error,
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
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
        >
          <View style={styles.activityContent}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleContainer}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  {activity.title}
                </Text>
                {activity.isCompleted && (
                  <View style={[styles.completionIcon, { backgroundColor: colors.success }]}>
                    <Text style={styles.completionIconText}>✓</Text>
                  </View>
                )}
              </View>
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

