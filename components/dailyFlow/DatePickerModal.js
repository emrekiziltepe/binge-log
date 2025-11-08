import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function DatePickerModal({
  visible,
  currentDate,
  selectedYear,
  selectedMonth,
  colors,
  generateCalendarDays,
  generateMonthOptions,
  onClose,
  onDateSelect,
  onShowMonthPicker,
  onShowYearPicker,
  onGoToToday
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={[styles.datePickerOverlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[styles.datePickerPanel, { backgroundColor: colors.modalContent }]}>
          {/* Kapatma Butonu */}
          <TouchableOpacity 
            style={[styles.datePickerCloseX, { backgroundColor: colors.surfaceSecondary }]}
            onPress={onClose}
          >
            <Text style={[styles.datePickerCloseXText, { color: colors.textSecondary }]}>×</Text>
          </TouchableOpacity>
          
          {/* Ay ve Yıl Başlığı */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              style={[styles.calendarHeaderButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onShowMonthPicker}
            >
              <Text style={[styles.calendarHeaderText, { color: colors.text }]}>
                {generateMonthOptions()[selectedMonth]}
              </Text>
              <Text style={[styles.calendarHeaderArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.calendarHeaderButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onShowYearPicker}
            >
              <Text style={[styles.calendarHeaderText, { color: colors.text }]}>
                {selectedYear}
              </Text>
              <Text style={[styles.calendarHeaderArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>
          
          {/* Hafta günleri başlığı */}
          <View style={styles.calendarWeekHeader}>
            {[
              t('datePicker.weekDays.monday'),
              t('datePicker.weekDays.tuesday'),
              t('datePicker.weekDays.wednesday'),
              t('datePicker.weekDays.thursday'),
              t('datePicker.weekDays.friday'),
              t('datePicker.weekDays.saturday'),
              t('datePicker.weekDays.sunday')
            ].map((day, index) => (
              <Text key={index} style={[styles.calendarWeekDayText, { color: colors.textSecondary }]}>{day}</Text>
            ))}
          </View>
          
          {/* Takvim grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((dayData, index) => {
              const isSelected = dayData.date.toDateString() === currentDate.toDateString();
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    { 
                      backgroundColor: isSelected ? colors.primary : (dayData.isToday ? colors.surfaceSecondary : 'transparent')
                    },
                    !dayData.isCurrentMonth && { opacity: 0.3 }
                  ]}
                  onPress={() => onDateSelect(dayData.date)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    { 
                      color: isSelected ? '#fff' : (dayData.isToday ? colors.primary : colors.text),
                      opacity: !dayData.isCurrentMonth ? 0.3 : 1
                    }
                  ]}>
                    {dayData.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Bugüne Git Butonu */}
          <TouchableOpacity 
            style={styles.goToTodayButton}
            onPress={onGoToToday}
          >
            <Text style={styles.goToTodayText}>📅 {t('datePicker.goToToday')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

