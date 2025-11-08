import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function StreakCard({ currentStreak, longestStreak, colors }) {
  const { t } = useTranslation();

  if (currentStreak === 0) return null;

  return (
    <View style={styles.statsContainer}>
      <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <Text style={[styles.streakText, { color: colors.text }]}>
          🔥 {t('activity.currentStreak')}: {currentStreak} {currentStreak === 1 ? t('activity.day') : t('activity.days')}
          {longestStreak > currentStreak && (
            <> - {t('activity.bestStreak')}: {longestStreak} {longestStreak === 1 ? t('activity.day') : t('activity.days')}</>
          )}
        </Text>
      </View>
    </View>
  );
}

