import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Alert, LayoutAnimation } from 'react-native';
import { useTranslation } from 'react-i18next';
import { removeDuplicates } from '../../utils/commonUtils';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function QuickAddMenu({
  visible,
  recentActivities,
  CATEGORIES,
  activities,
  colors,
  onClose,
  onActivityAdded,
  onSaveRecentActivity
}) {
  const { t } = useTranslation();

  if (!visible || recentActivities.length === 0) return null;

  const handleQuickAdd = (activity) => {
    // Edit details for categories that require details
    if (activity.type === 'series' || activity.type === 'book') {
      const category = CATEGORIES[activity.type];
      const promptTitle = activity.type === 'series' ? `📺 ${t('activity.seriesDetail')}` : `📚 ${t('activity.bookDetail')}`;
      const promptMessage = activity.type === 'series'
        ? t('activity.seriesInputHelp')
        : t('activity.pagesInputHelp');

      Alert.prompt(
        promptTitle,
        promptMessage,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.save'),
            onPress: (input) => {
              if (input && input.trim()) {
                let detail = input.trim();

                // Special validation for series
                if (activity.type === 'series') {
                  const parts = detail.replace(/[^0-9,]/g, '').split(/[, ]+/);
                  const season = parts[0];
                  const episode = parts[1];

                  if (!season || !episode || parseInt(season) <= 0 || parseInt(episode) <= 0) {
                    Alert.alert(
                      t('errors.invalidFormatTitle'),
                      t('errors.invalidFormat'),
                      [{ text: t('common.ok') }]
                    );
                    return;
                  }

                  detail = `${t('activity.season')} ${season}, ${t('activity.episode')} ${episode}`;
                }

                const newActivity = {
                  id: Date.now().toString(),
                  title: activity.title,
                  type: activity.type,
                  detail: detail,
                  timestamp: new Date().toISOString(),
                };

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                const updatedActivities = [...activities, newActivity];
                const uniqueActivities = removeDuplicates(updatedActivities);
                onActivityAdded(uniqueActivities);
                onSaveRecentActivity(newActivity);
                onClose();
              }
            },
          },
        ],
        'plain-text',
        activity.detail || '',
        'default'
      );
    } else {
      // Direct addition for other categories
      const newActivity = {
        id: Date.now().toString(),
        title: activity.title,
        type: activity.type,
        detail: activity.detail,
        timestamp: new Date().toISOString(),
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const updatedActivities = [...activities, newActivity];
      const uniqueActivities = removeDuplicates(updatedActivities);
      onActivityAdded(uniqueActivities);
      onClose();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onClose} testID="quick-add-overlay">
      <View style={[styles.quickAddOverlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[styles.quickAddMenu, { backgroundColor: colors.modalContent }]}>
          <Text style={[styles.quickAddTitle, { color: colors.text }]}>{t('activity.recentActivities')}</Text>
          {recentActivities.slice(0, 3).map((activity, index) => {
            const category = CATEGORIES[activity.type];
            return (
              <TouchableOpacity
                key={index}
                style={[styles.quickAddItem, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => handleQuickAdd(activity)}
                testID={`quick-add-item-${index}`}
              >
                <Text style={styles.quickAddEmoji}>{category.emoji}</Text>
                <View style={styles.quickAddTextContainer}>
                  <Text style={[styles.quickAddText, { color: colors.text }]}>{activity.title}</Text>
                  {activity.detail && (
                    <Text style={[styles.quickAddDetail, { color: colors.textSecondary }]}>{activity.detail}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

