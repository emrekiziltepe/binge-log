import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Alert, LayoutAnimation } from 'react-native';
import { useTranslation } from 'react-i18next';
import { removeDuplicates } from '../../utils/commonUtils';
import { formatLocalDate } from '../../utils/dateUtils';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function QuickAddMenu({
  visible,
  recentActivities,
  CATEGORIES,
  activities,
  colors,
  currentDate,
  onClose,
  onActivityAdded,
  onSaveRecentActivity,
  onOpenAddModal
}) {
  const { t } = useTranslation();

  if (!visible || recentActivities.length === 0) return null;

  const handleQuickAdd = (activity) => {
    // Open normal add modal for all activities (allows full editing)
    onClose();
    if (onOpenAddModal) {
      onOpenAddModal(activity);
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

