import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function MonthPickerModal({
  visible,
  selectedMonth,
  colors,
  generateMonthOptions,
  onClose,
  onSelect
}) {
  const { t } = useTranslation();
  const monthScrollRef = useRef(null);

  useEffect(() => {
    if (visible && monthScrollRef.current) {
      setTimeout(() => {
        monthScrollRef.current?.scrollTo({
          y: selectedMonth * 50,
          animated: true
        });
      }, 100);
    }
  }, [visible, selectedMonth]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={[styles.pickerOverlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[styles.pickerPanel, { backgroundColor: colors.modalContent }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('datePicker.selectMonth')}</Text>
          <ScrollView 
            ref={monthScrollRef}
            style={styles.pickerScrollView}
            onLayout={() => {
              setTimeout(() => {
                monthScrollRef.current?.scrollTo({
                  y: selectedMonth * 50,
                  animated: true
                });
              }, 100);
            }}
          >
            {generateMonthOptions().map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerOption,
                  { backgroundColor: selectedMonth === index ? colors.surfaceSecondary : 'transparent' }
                ]}
                onPress={() => onSelect(index)}
              >
                <Text style={[
                  styles.pickerOptionText,
                  { color: selectedMonth === index ? colors.primary : colors.text }
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

