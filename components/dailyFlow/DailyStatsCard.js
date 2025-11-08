import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function DailyStatsCard({ dailyStats, CATEGORIES, colors }) {
  const { t } = useTranslation();

  if (dailyStats.totalActivities === 0) return null;

  return (
    <View style={styles.statsContainer}>
      <View style={[styles.compactStatsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.compactStatsText, { color: colors.text }]}>
          📊 {dailyStats.totalActivities} {t('statistics.activities')}
          {Object.entries(dailyStats.categoryCount).map(([category, count]) => (
            <Text key={category}>
              {' • '}{CATEGORIES[category].emoji} {count}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );
}

