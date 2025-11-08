import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Keyboard
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { dailyFlowStyles } from '../../styles/dailyFlowStyles';

const styles = dailyFlowStyles;

export default function ActivityFormModal({
  visible,
  modalType,
  formData,
  setFormData,
  seasonEpisodes,
  duration,
  setDuration,
  CATEGORIES,
  colors,
  onClose,
  onSave,
  updateSeasonEpisode,
  addSeasonEpisodeRow,
  removeSeasonEpisodeRow,
  handleCompletionToggle,
  renderStars
}) {
  const { t } = useTranslation();
  const scrollViewRef = useRef(null);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.modalContent }]}>
                <ScrollView 
                  ref={scrollViewRef}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {modalType === 'add' ? t('activity.addActivity') : t('activity.editActivity')}
                  </Text>
                  
                  {/* Aktivite Adı */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('activity.activityTitle')}</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.inputBackground, 
                      borderColor: colors.inputBorder,
                      color: colors.inputText
                    }]}
                    value={formData.title}
                    onChangeText={(text) => setFormData({...formData, title: text})}
                    placeholder={t('activity.activityTitle')}
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="next"
                  />

                  {/* Kategori Seçimi */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('activity.category')}</Text>
                  <View style={styles.categoryGrid}>
                    {Object.entries(CATEGORIES).map(([key, category]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.categoryButton,
                          { 
                            backgroundColor: formData.category === key ? colors.surfaceSecondary : colors.surfaceSecondary,
                            borderColor: formData.category === key ? colors.primary : colors.border,
                          },
                          formData.category === key && { borderColor: colors.primary }
                        ]}
                        onPress={() => {
                          Keyboard.dismiss();
                          setFormData({...formData, category: key});
                        }}
                      >
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                        <Text style={[styles.categoryName, { color: formData.category === key ? colors.primary : colors.text }]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Detay Girişi */}
                  {formData.category && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        {CATEGORIES[formData.category].detailLabel}
                      </Text>
                      {formData.category === 'series' ? (
                        <View style={styles.seriesInputContainer}>
                          <Text style={[styles.helpText, { color: colors.textTertiary }]}>
                            {t('activity.episodeHelp')}
                          </Text>
                          {seasonEpisodes.map((item, index) => (
                            <View key={index} style={styles.seriesInputRow}>
                              <View style={styles.seriesInputHalf}>
                                <Text style={[styles.seriesInputLabel, { color: colors.text }]}>{t('activity.season')}</Text>
                                <TextInput
                                  style={[styles.seriesInput, { 
                                    backgroundColor: colors.inputBackground, 
                                    borderColor: colors.inputBorder,
                                    color: colors.inputText
                                  }]}
                                  placeholder="3"
                                  placeholderTextColor={colors.placeholder}
                                  value={item.season}
                                  onChangeText={(text) => updateSeasonEpisode(index, 'season', text)}
                                  keyboardType="numeric"
                                />
                              </View>
                              <View style={styles.seriesInputHalf}>
                                <Text style={[styles.seriesInputLabel, { color: colors.text }]}>{t('activity.episode')}</Text>
                                <TextInput
                                  style={[styles.seriesInput, { 
                                    backgroundColor: colors.inputBackground, 
                                    borderColor: colors.inputBorder,
                                    color: colors.inputText
                                  }]}
                                  placeholder={t('activity.episodePlaceholder')}
                                  placeholderTextColor={colors.placeholder}
                                  value={item.episode}
                                  onChangeText={(text) => updateSeasonEpisode(index, 'episode', text)}
                                  keyboardType="numeric"
                                />
                              </View>
                              {seasonEpisodes.length > 1 && (
                                <TouchableOpacity
                                  style={[styles.removeRowButton, { backgroundColor: colors.error }]}
                                  onPress={() => removeSeasonEpisodeRow(index)}
                                >
                                  <Text style={styles.removeRowButtonText}>×</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                          <TouchableOpacity
                            style={[styles.addRowButton, { backgroundColor: colors.primary }]}
                            onPress={addSeasonEpisodeRow}
                          >
                            <Text style={styles.addRowButtonText}>+ {t('activity.newSeason')}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : formData.category === 'sport' ? (
                        <View style={styles.seriesInputContainer}>
                          <View style={styles.seriesInputRow}>
                            <View style={styles.seriesInputHalf}>
                              <Text style={[styles.seriesInputLabel, { color: colors.text }]}>{t('activity.hours')}</Text>
                              <TextInput
                                style={[styles.seriesInput, { 
                                  backgroundColor: colors.inputBackground, 
                                  borderColor: colors.inputBorder,
                                  color: colors.inputText
                                }]}
                                placeholder="0"
                                placeholderTextColor={colors.placeholder}
                                value={duration.hours}
                                onChangeText={(text) => {
                                  const numericText = text.replace(/[^0-9]/g, '');
                                  const hours = numericText === '' ? '' : Math.max(0, Math.min(23, parseInt(numericText))).toString();
                                  setDuration(prev => ({ ...prev, hours }));
                                }}
                                keyboardType="numeric"
                                maxLength={2}
                              />
                            </View>
                            <View style={styles.seriesInputHalf}>
                              <Text style={[styles.seriesInputLabel, { color: colors.text }]}>{t('activity.minutes')}</Text>
                              <TextInput
                                style={[styles.seriesInput, { 
                                  backgroundColor: colors.inputBackground, 
                                  borderColor: colors.inputBorder,
                                  color: colors.inputText
                                }]}
                                placeholder="00"
                                placeholderTextColor={colors.placeholder}
                                value={duration.minutes}
                                onChangeText={(text) => {
                                  const numericText = text.replace(/[^0-9]/g, '');
                                  const minutes = numericText === '' ? '' : Math.max(0, Math.min(59, parseInt(numericText))).toString();
                                  setDuration(prev => ({ ...prev, minutes }));
                                }}
                                keyboardType="numeric"
                                maxLength={2}
                              />
                            </View>
                          </View>
                        </View>
                      ) : (
                        <TextInput
                          style={[styles.textInput, { 
                            backgroundColor: colors.inputBackground, 
                            borderColor: colors.inputBorder,
                            color: colors.inputText
                          }]}
                          value={formData.detail}
                          placeholderTextColor={colors.placeholder}
                          onChangeText={(text) => setFormData({...formData, detail: text})}
                          placeholder={CATEGORIES[formData.category].detailPlaceholder}
                          multiline={formData.category !== 'series'}
                          keyboardType={formData.category === 'series' ? 'numeric' : 'default'}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      )}
                    </>
                  )}

                  {/* Aktivite Tamamlandı mı */}
                  {formData.category !== 'sport' && (
                    <View style={styles.completionSection}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={handleCompletionToggle}
                      >
                        <View style={[
                          styles.checkbox,
                          { 
                            borderColor: colors.border,
                            backgroundColor: formData.isCompleted ? colors.primary : 'transparent'
                          },
                          formData.isCompleted && { backgroundColor: colors.primary }
                        ]}>
                          {formData.isCompleted && (
                            <Text style={styles.checkboxText}>✓</Text>
                          )}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t('activity.isCompleted')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Yıldız Değerlendirme */}
                  {formData.isCompleted && (
                    <View style={styles.ratingSection}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>{t('activity.rating')}</Text>
                      <View style={styles.starsContainer}>
                        {renderStars()}
                      </View>
                      {formData.rating > 0 && (
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                          {formData.rating}/10
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>

                {/* Butonlar */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { 
                      backgroundColor: colors.surfaceSecondary, 
                      borderColor: colors.border 
                    }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      onClose();
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      onSave();
                    }}
                  >
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

