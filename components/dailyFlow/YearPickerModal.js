import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function YearPickerModal({
  visible,
  selectedYear,
  colors,
  generateYearOptions,
  onClose,
  onSelect
}) {
  const { t } = useTranslation();
  const yearScrollRef = useRef(null);

  useEffect(() => {
    if (visible && yearScrollRef.current) {
      const yearIndex = generateYearOptions().findIndex(year => year === selectedYear);
      setTimeout(() => {
        yearScrollRef.current?.scrollTo({
          y: yearIndex * 50,
          animated: true
        });
      }, 100);
    }
  }, [visible, selectedYear, generateYearOptions]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={[styles.pickerOverlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[styles.pickerPanel, { backgroundColor: colors.modalContent }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('datePicker.selectYear')}</Text>
          <ScrollView 
            ref={yearScrollRef}
            style={styles.pickerScrollView}
            onLayout={() => {
              const yearIndex = generateYearOptions().findIndex(year => year === selectedYear);
              setTimeout(() => {
                yearScrollRef.current?.scrollTo({
                  y: yearIndex * 50,
                  animated: true
                });
              }, 100);
            }}
          >
            {generateYearOptions().map((year, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerOption,
                  { backgroundColor: selectedYear === year ? colors.surfaceSecondary : 'transparent' }
                ]}
                onPress={() => onSelect(year)}
              >
                <Text style={[
                  styles.pickerOptionText,
                  { color: selectedYear === year ? colors.primary : colors.text }
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

