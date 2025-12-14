import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { reportsStyles } from '../../styles/reportsStyles';

const styles = reportsStyles;

export default function GoalProgress({ 
  viewMode,
  goals,
  calculateGoalProgress,
  CATEGORIES,
  goalProgressExpanded,
  setGoalProgressExpanded,
  colors
}) {
  const { t } = useTranslation();

  if (viewMode === 'yearly') return null;
  
  // Check if there are any goals for this view mode
  const periodGoals = goals[viewMode] || {};
  // Check if there are any date entries with goals
  const hasGoals = Object.values(periodGoals).some(dateGoals => 
    dateGoals && typeof dateGoals === 'object' && 
    Object.values(dateGoals).some(goal => 
      goal !== null && goal !== undefined && goal !== '' && goal !== 0
    )
  );
  
  if (!hasGoals) {
    return null;
  }

  return (
    <View style={[styles.goalProgressContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={[styles.goalProgressHeader, { marginBottom: goalProgressExpanded ? 12 : 0 }]}
        onPress={() => setGoalProgressExpanded(!goalProgressExpanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.goalProgressTitle, { color: colors.text }]}>
          🎯 {viewMode === 'weekly' ? t('goals.weeklyGoal') : t('goals.monthlyGoal')}
        </Text>
        <Ionicons 
          name={goalProgressExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {goalProgressExpanded && (
        <>
          {Object.entries(CATEGORIES).map(([categoryKey, categoryInfo]) => {
            const progress = calculateGoalProgress(categoryKey, viewMode);
            if (!progress) return null;
            
            const unitKey = categoryKey === 'book' ? 'goals.pages' : 
                          categoryKey === 'series' ? 'goals.episodes' :
                          categoryKey === 'sport' ? 'goals.hours' :
                          categoryKey === 'movie' ? 'goals.movies' :
                          categoryKey === 'game' ? 'goals.games' :
                          'goals.educations';
            
            return (
              <View key={categoryKey} style={styles.goalProgressItem}>
                <View style={styles.goalProgressItemHeader}>
                  <Text style={[styles.goalProgressLabel, { color: colors.text }]}>
                    {categoryInfo.emoji} {categoryInfo.name}: {progress.current.toFixed(categoryKey === 'sport' ? 1 : 0)}/{progress.goal.toFixed(categoryKey === 'sport' ? 1 : 0)} {t(unitKey)}
                  </Text>
                  {progress.completed && (
                    <Text style={[styles.goalCompletedBadge, { color: colors.success }]}>
                      ✓ {t('goals.completed')}
                    </Text>
                  )}
                </View>
                <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceSecondary }]}>
                  <View style={[styles.progressBar, { 
                    width: `${progress.progress}%`, 
                    backgroundColor: progress.completed ? colors.success : colors.primary 
                  }]} />
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

