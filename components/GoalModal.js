import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import goalService from '../services/goalService';
import { getCategoriesForGoals } from '../utils/categoryUtils';

const GoalModal = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useContext(ThemeContext);
  const CATEGORIES = getCategoriesForGoals(t);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [selectedCategory, setSelectedCategory] = useState('book'); // Selected category from dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allGoals, setAllGoals] = useState({ weekly: {}, monthly: {} });
  const [currentGoal, setCurrentGoal] = useState(null);
  
  // Get current date for the selected period
  const getCurrentDate = () => {
    return new Date(); // Always use current date
  };

  useEffect(() => {
    if (visible) {
      loadGoals();
    }
  }, [visible]);

  // Update current goal when period or category changes
  useEffect(() => {
    if (visible) {
      const currentDate = getCurrentDate();
      const dateKey = selectedPeriod === 'weekly' 
        ? goalService.getWeekKey(currentDate)
        : goalService.getMonthKey(currentDate);
      
      const currentPeriodGoals = allGoals[selectedPeriod] || {};
      const dateGoals = currentPeriodGoals[dateKey] || {};
      setCurrentGoal(dateGoals[selectedCategory] ?? null);
    }
  }, [selectedPeriod, selectedCategory, visible, allGoals]);

  const loadGoals = async () => {
    const loadedGoals = await goalService.getGoals();
    setAllGoals(loadedGoals);
    
    // Get current date key
    const currentDate = getCurrentDate();
    const dateKey = selectedPeriod === 'weekly' 
      ? goalService.getWeekKey(currentDate)
      : goalService.getMonthKey(currentDate);
    
    // Get current goal for selected period and date
    const currentPeriodGoals = loadedGoals[selectedPeriod] || {};
    const dateGoals = currentPeriodGoals[dateKey] || {};
    setCurrentGoal(dateGoals[selectedCategory] ?? null);
  };

  const handleSave = async () => {
    try {
      const currentDate = getCurrentDate();
      const value = currentGoal === null || currentGoal === '' ? null : parseFloat(currentGoal);
      
      if (value === null || value === '' || value === undefined) {
        await goalService.deleteCategoryGoal(selectedPeriod, selectedCategory, currentDate);
      } else {
        await goalService.setCategoryGoal(selectedPeriod, selectedCategory, value, currentDate);
      }
      
      // Reload goals to update state
      await loadGoals();
      onClose();
    } catch (error) {
      Alert.alert(t('errors.error'), error.message);
    }
  };

  const updateGoal = (value) => {
    setCurrentGoal(value === '' ? null : (value ? value : null));
  };

  const deleteGoal = async () => {
    try {
      const currentDate = getCurrentDate();
      await goalService.deleteCategoryGoal(selectedPeriod, selectedCategory, currentDate);
      await loadGoals();
    } catch (error) {
      Alert.alert(t('errors.error'), error.message);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={[styles.overlay, { backgroundColor: colors.modalBackground }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={[styles.content, { backgroundColor: colors.modalContent }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{t('hamburgerMenu.goals')}</Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Period Selector */}
            <View style={[styles.periodSelector, { backgroundColor: colors.surfaceSecondary }]}>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'weekly' && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedPeriod('weekly')}
              >
                <Text style={[styles.periodButtonText, { color: selectedPeriod === 'weekly' ? '#fff' : colors.text }]}>
                  {t('goals.weeklyGoal')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'monthly' && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedPeriod('monthly')}
              >
                <Text style={[styles.periodButtonText, { color: selectedPeriod === 'monthly' ? '#fff' : colors.text }]}>
                  {t('goals.monthlyGoal')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Dropdown */}
            <View style={styles.goalSection}>
              <Text style={[styles.goalLabel, { color: colors.text }]}>{t('goals.selectCategory')}</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder 
                }]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={[styles.dropdownButtonText, { color: colors.text }]}>
                  {CATEGORIES[selectedCategory].emoji} {t(CATEGORIES[selectedCategory].nameKey)}
                </Text>
                <Ionicons 
                  name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={[styles.dropdownList, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder 
                }]}>
                  <ScrollView 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    style={styles.dropdownScrollView}
                  >
                  {Object.entries(CATEGORIES).map(([categoryKey, category]) => (
                    <TouchableOpacity
                      key={categoryKey}
                      style={[
                        styles.dropdownItem,
                        selectedCategory === categoryKey && { backgroundColor: colors.surfaceSecondary }
                      ]}
                      onPress={() => {
                        setSelectedCategory(categoryKey);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                        {category.emoji} {t(category.nameKey)}
                      </Text>
                      {selectedCategory === categoryKey && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Selected Category Goal Input */}
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <Text style={[styles.categoryLabel, { color: colors.text }]}>
                  {CATEGORIES[selectedCategory].emoji} {t(CATEGORIES[selectedCategory].nameKey)}
                </Text>
                {currentGoal !== null && currentGoal !== undefined && currentGoal !== '' && (
                  <TouchableOpacity 
                    style={[styles.deleteGoalButton, { backgroundColor: colors.error }]}
                    onPress={deleteGoal}
                  >
                    <Text style={styles.deleteGoalText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.goalInput, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }]}
                placeholder={t('goals.enterValue', { unit: t(CATEGORIES[selectedCategory].unitKey) })}
                placeholderTextColor={colors.placeholder}
                keyboardType={selectedCategory === 'sport' ? 'decimal-pad' : 'numeric'}
                value={currentGoal !== null && currentGoal !== undefined ? currentGoal.toString() : ''}
                onChangeText={(text) => {
                  const numValue = text.replace(/[^0-9.,]/g, '').replace(',', '.');
                  updateGoal(numValue);
                }}
              />
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                {t(CATEGORIES[selectedCategory].unitKey)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveGoalButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveGoalButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalSection: {
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    flex: 1,
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  unitText: {
    fontSize: 12,
    marginLeft: 4,
  },
  deleteGoalButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteGoalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveGoalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalModal;
