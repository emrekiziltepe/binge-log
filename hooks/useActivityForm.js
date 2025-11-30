import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Custom hook for managing activity form state and validation
 * Handles form data, series/episode management, duration, and validation
 */
export const useActivityForm = (editingActivity, modalType, scrollViewRef) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    detail: '',
    season: '',
    episode: '',
    isCompleted: false,
    rating: 0
  });
  
  // Multiple season-episode pairs for series
  const [seasonEpisodes, setSeasonEpisodes] = useState([{ season: '', episode: '' }]);
  
  // Duration for sport (hours and minutes)
  const [duration, setDuration] = useState({ hours: '', minutes: '' });
  
  // Quick add mode flag (hides category selection and disables title editing)
  const [isQuickAdd, setIsQuickAdd] = useState(false);

  // Modal state control - synchronize form data in edit mode
  useEffect(() => {
    if (modalType === 'edit' && editingActivity) {
      // Make sure form data is correct
      let season = '';
      let episode = '';
      let detail = editingActivity.detail || '';
      
      // Separate season and episode for series
      if (editingActivity.type === 'series' && editingActivity.detail) {
        const parts = editingActivity.detail.split(',');
        if (parts.length >= 2) {
          season = parts[0].trim();
          // Combine all episodes (comma separated)
          episode = parts.slice(1).join(',').trim();
          detail = ''; // Leave detail empty for series
        }
      }
      
      if (formData.title !== editingActivity.title || 
          formData.category !== editingActivity.type ||
          formData.detail !== detail ||
          formData.season !== season ||
          formData.episode !== episode) {
        setFormData({
          title: editingActivity.title,
          category: editingActivity.type,
          detail: detail,
          season: season,
          episode: episode,
          isCompleted: editingActivity.isCompleted || false,
          rating: editingActivity.rating || 0
        });
      }
    }
  }, [modalType, editingActivity]);

  const handleCompletionToggle = useCallback(() => {
    const newCompleted = !formData.isCompleted;
    setFormData(prev => ({ ...prev, isCompleted: newCompleted }));
    
    // If completed is checked, scroll to stars section
    if (newCompleted && scrollViewRef?.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [formData.isCompleted, scrollViewRef]);

  // Star rating functions
  const handleStarPress = useCallback((starIndex) => {
    const newRating = starIndex + 1;
    setFormData(prev => ({
      ...prev,
      rating: prev.rating === newRating ? 0 : newRating
    }));
  }, []);

  // Season-episode management
  const addSeasonEpisodeRow = useCallback(() => {
    setSeasonEpisodes(prev => [...prev, { season: '', episode: '' }]);
  }, []);

  const removeSeasonEpisodeRow = useCallback((index) => {
    if (seasonEpisodes.length > 1) {
      setSeasonEpisodes(prev => prev.filter((_, i) => i !== index));
    }
  }, [seasonEpisodes.length]);

  const updateSeasonEpisode = useCallback((index, field, value) => {
    setSeasonEpisodes(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({ title: '', category: '', detail: '', season: '', episode: '', isCompleted: false, rating: 0 });
    setSeasonEpisodes([{ season: '', episode: '' }]);
    setDuration({ hours: '', minutes: '' });
    setIsQuickAdd(false);
  }, []);

  // Validate form data
  const validateForm = useCallback((t) => {
    if (!formData.title.trim()) {
      Alert.alert(t('errors.error'), t('errors.titleRequired'));
      return false;
    }
    if (!formData.category) {
      Alert.alert(t('errors.error'), t('errors.categoryRequired'));
      return false;
    }

    // Special validation for series
    if (formData.category === 'series') {
      // Check all season-episode pairs
      for (let i = 0; i < seasonEpisodes.length; i++) {
        const { season, episode } = seasonEpisodes[i];
        
        if (!season.trim() || !episode.trim()) {
          Alert.alert(t('errors.error'), t('errors.seasonEpisodeRequired', { row: i + 1 }));
          return false;
        }
        
        const seasonNum = parseInt(season);
        if (seasonNum <= 0) {
          Alert.alert(t('errors.error'), t('errors.seasonMustBePositive', { row: i + 1 }));
          return false;
        }
        
        // Split episodes by comma and check
        const episodes = episode.split(',').map(ep => ep.trim()).filter(ep => ep);
        if (episodes.length === 0) {
          Alert.alert(t('errors.error'), t('errors.episodeRequired', { row: i + 1 }));
          return false;
        }
        
        // Check that each episode is a valid number
        for (const ep of episodes) {
          const episodeNum = parseInt(ep);
          if (isNaN(episodeNum) || episodeNum <= 0) {
            Alert.alert(t('errors.error'), t('errors.invalidEpisode', { row: i + 1, episode: ep }));
            return false;
          }
        }
      }
    }

    return true;
  }, [formData, seasonEpisodes]);

  // Format form data for saving
  const formatFormDataForSave = useCallback((t) => {
    let detail = formData.detail.trim();
    
    // Format duration for sports
    if (formData.category === 'sport') {
      const hours = duration.hours.trim();
      const minutes = duration.minutes.trim();
      
      if (hours || minutes) {
        const hoursText = hours ? `${hours} ${t('activity.hours').toLowerCase()}` : '';
        const minutesText = minutes ? `${minutes} ${t('activity.minutes').toLowerCase()}` : '';
        detail = [hoursText, minutesText].filter(text => text).join(' ') || '';
      }
    }
    
    // Format series detail
    if (formData.category === 'series') {
      // Combine all season-episode pairs
      const seasonEpisodeStrings = seasonEpisodes.map(({ season, episode }) => {
        const episodes = episode.split(',').map(ep => ep.trim()).filter(ep => ep);
        return `${season},${episodes.join(',')}`;
      });
      
      detail = seasonEpisodeStrings.join(';');
    }

    return {
      title: formData.title.trim(),
      category: formData.category,
      detail,
      isCompleted: formData.isCompleted,
      rating: formData.rating
    };
  }, [formData, seasonEpisodes, duration]);

  return {
    formData,
    setFormData,
    seasonEpisodes,
    setSeasonEpisodes,
    duration,
    setDuration,
    isQuickAdd,
    setIsQuickAdd,
    handleCompletionToggle,
    handleStarPress,
    addSeasonEpisodeRow,
    removeSeasonEpisodeRow,
    updateSeasonEpisode,
    resetForm,
    validateForm,
    formatFormDataForSave,
  };
};
