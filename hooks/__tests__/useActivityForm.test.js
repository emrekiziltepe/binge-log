import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useActivityForm } from '../useActivityForm';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock timers
jest.useFakeTimers();

describe('useActivityForm', () => {
  const mockScrollViewRef = {
    current: {
      scrollToEnd: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial form state', () => {
    const { result } = renderHook(() => useActivityForm(null, null, null));

    expect(result.current.formData).toEqual({
      title: '',
      category: '',
      detail: '',
      season: '',
      episode: '',
      isCompleted: false,
      rating: 0,
    });
    expect(result.current.seasonEpisodes).toEqual([{ season: '', episode: '' }]);
    expect(result.current.duration).toEqual({ hours: '', minutes: '' });
    expect(result.current.isQuickAdd).toBe(false);
  });

  it('initializes form data when editing activity', () => {
    const editingActivity = {
      id: '1',
      title: 'Test Movie',
      type: 'movie',
      detail: 'Detail text',
      isCompleted: false,
      rating: 5,
    };

    const { result } = renderHook(() => useActivityForm(editingActivity, 'edit', null));

    expect(result.current.formData.title).toBe('Test Movie');
    expect(result.current.formData.category).toBe('movie');
    expect(result.current.formData.detail).toBe('Detail text');
  });

  it('parses series detail correctly when editing', () => {
    const editingActivity = {
      id: '1',
      title: 'Test Series',
      type: 'series',
      detail: '3,10,11',
      isCompleted: false,
      rating: 0,
    };

    const { result } = renderHook(() => useActivityForm(editingActivity, 'edit', null));

    act(() => {
      // Wait for useEffect to run
    });

    expect(result.current.formData.season).toBe('3');
    expect(result.current.formData.episode).toBe('10,11');
    expect(result.current.formData.detail).toBe('');
  });

  it('handles multiple season-episode pairs for series', () => {
    const editingActivity = {
      id: '1',
      title: 'Test Series',
      type: 'series',
      detail: '3,10;4,1',
      isCompleted: false,
      rating: 0,
    };

    const { result } = renderHook(() => useActivityForm(editingActivity, 'edit', null));

    act(() => {
      // Wait for useEffect
    });

    expect(result.current.seasonEpisodes.length).toBeGreaterThanOrEqual(1);
  });

  describe('handleCompletionToggle', () => {
    it('toggles isCompleted state', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      expect(result.current.formData.isCompleted).toBe(false);

      act(() => {
        result.current.handleCompletionToggle();
      });

      expect(result.current.formData.isCompleted).toBe(true);
    });

    it('scrolls to end when completion is checked', () => {
      const { result } = renderHook(() => 
        useActivityForm(null, null, mockScrollViewRef)
      );

      act(() => {
        result.current.handleCompletionToggle();
        jest.advanceTimersByTime(300);
      });

      expect(mockScrollViewRef.current.scrollToEnd).toHaveBeenCalled();
    });
  });

  describe('handleStarPress', () => {
    it('sets rating when star is pressed', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.handleStarPress(4); // Star index 4 = rating 5
      });

      expect(result.current.formData.rating).toBe(5);
    });

    it('toggles rating off if same star is pressed again', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.handleStarPress(4); // Rating 5
      });

      expect(result.current.formData.rating).toBe(5);

      act(() => {
        result.current.handleStarPress(4); // Rating 5 again
      });

      expect(result.current.formData.rating).toBe(0);
    });
  });

  describe('season-episode management', () => {
    it('adds season-episode row', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.addSeasonEpisodeRow();
      });

      expect(result.current.seasonEpisodes.length).toBe(2);
    });

    it('removes season-episode row', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.addSeasonEpisodeRow();
        result.current.addSeasonEpisodeRow();
      });

      expect(result.current.seasonEpisodes.length).toBe(3);

      act(() => {
        result.current.removeSeasonEpisodeRow(0);
      });

      expect(result.current.seasonEpisodes.length).toBe(2);
    });

    it('does not remove last season-episode row', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      expect(result.current.seasonEpisodes.length).toBe(1);

      act(() => {
        result.current.removeSeasonEpisodeRow(0);
      });

      expect(result.current.seasonEpisodes.length).toBe(1);
    });

    it('updates season-episode value', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.updateSeasonEpisode(0, 'season', '3');
      });

      expect(result.current.seasonEpisodes[0].season).toBe('3');
    });
  });

  describe('resetForm', () => {
    it('resets form to initial state', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData({
          title: 'Test',
          category: 'movie',
          detail: 'Detail',
          season: '',
          episode: '',
          isCompleted: true,
          rating: 5,
        });
        result.current.setIsQuickAdd(true);
        result.current.addSeasonEpisodeRow();
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.title).toBe('');
      expect(result.current.formData.rating).toBe(0);
      expect(result.current.seasonEpisodes.length).toBe(1);
      expect(result.current.isQuickAdd).toBe(false);
    });
  });

  describe('validateForm', () => {
    const mockT = (key, params) => {
      const translations = {
        'errors.error': 'Error',
        'errors.titleRequired': 'Title is required',
        'errors.categoryRequired': 'Category is required',
        'errors.seasonEpisodeRequired': 'Season and episode required for row {row}',
        'errors.seasonMustBePositive': 'Season must be positive for row {row}',
        'errors.episodeRequired': 'Episode required for row {row}',
        'errors.invalidEpisode': 'Invalid episode {episode} for row {row}',
      };
      let translation = translations[key] || key;
      if (params) {
        Object.keys(params).forEach(param => {
          translation = translation.replace(`{${param}}`, params[param]);
        });
      }
      return translation;
    };

    it('returns false if title is empty', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        const isValid = result.current.validateForm(mockT);
        expect(isValid).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Title is required');
    });

    it('returns false if category is empty', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData({
          title: 'Test',
          category: '',
          detail: '',
          season: '',
          episode: '',
          isCompleted: false,
          rating: 0,
        });
      });

      act(() => {
        const isValid = result.current.validateForm(mockT);
        expect(isValid).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Category is required');
    });

    it('validates series season-episode pairs', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData(prev => ({
          ...prev,
          title: 'Test',
          category: 'series',
        }));
        const isValid = result.current.validateForm(mockT);
        expect(isValid).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('returns true for valid form', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData({
          title: 'Test',
          category: 'movie',
          detail: '',
          season: '',
          episode: '',
          isCompleted: false,
          rating: 0,
        });
      });

      act(() => {
        const isValid = result.current.validateForm(mockT);
        expect(isValid).toBe(true);
      });

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('validates season is positive', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData({
          title: 'Test',
          category: 'series',
          detail: '',
          season: '',
          episode: '',
          isCompleted: false,
          rating: 0,
        });
        result.current.updateSeasonEpisode(0, 'season', '0');
        result.current.updateSeasonEpisode(0, 'episode', '1');
      });

      act(() => {
        const isValid = result.current.validateForm(mockT);
        expect(isValid).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('formatFormDataForSave', () => {
    const mockT = (key) => {
      const translations = {
        'activity.hours': 'Hours',
        'activity.minutes': 'Minutes',
      };
      return translations[key] || key;
    };

    it('formats basic activity data', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData(prev => ({
          ...prev,
          title: 'Test Movie',
          category: 'movie',
          detail: 'Detail',
          isCompleted: true,
          rating: 5,
        }));
      });

      act(() => {
        const formatted = result.current.formatFormDataForSave(mockT);
        expect(formatted.title).toBe('Test Movie');
        expect(formatted.category).toBe('movie');
        expect(formatted.detail).toBe('Detail');
        expect(formatted.isCompleted).toBe(true);
        expect(formatted.rating).toBe(5);
      });
    });

    it('formats sport duration correctly', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData(prev => ({
          ...prev,
          title: 'Running',
          category: 'sport',
        }));
        result.current.setDuration({ hours: '1', minutes: '30' });
      });

      act(() => {
        const formatted = result.current.formatFormDataForSave(mockT);
        expect(formatted.detail).toContain('1');
        expect(formatted.detail).toContain('30');
      });
    });

    it('formats series season-episode pairs', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData(prev => ({
          ...prev,
          title: 'Test Series',
          category: 'series',
        }));
        result.current.updateSeasonEpisode(0, 'season', '3');
        result.current.updateSeasonEpisode(0, 'episode', '10,11');
      });

      act(() => {
        const formatted = result.current.formatFormDataForSave(mockT);
        expect(formatted.detail).toBe('3,10,11');
      });
    });

    it('handles multiple season-episode pairs', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData(prev => ({
          ...prev,
          title: 'Test Series',
          category: 'series',
        }));
        result.current.addSeasonEpisodeRow();
        result.current.updateSeasonEpisode(0, 'season', '3');
        result.current.updateSeasonEpisode(0, 'episode', '10');
        result.current.updateSeasonEpisode(1, 'season', '4');
        result.current.updateSeasonEpisode(1, 'episode', '1');
      });

      act(() => {
        const formatted = result.current.formatFormDataForSave(mockT);
        expect(formatted.detail).toBe('3,10;4,1');
      });
    });
  });

  describe('setFormData', () => {
    it('updates form data', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setFormData(prev => ({ ...prev, title: 'New Title' }));
      });

      expect(result.current.formData.title).toBe('New Title');
    });
  });

  describe('setDuration', () => {
    it('updates duration', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setDuration({ hours: '2', minutes: '15' });
      });

      expect(result.current.duration.hours).toBe('2');
      expect(result.current.duration.minutes).toBe('15');
    });
  });

  describe('setSeasonEpisodes', () => {
    it('updates season episodes', () => {
      const { result } = renderHook(() => useActivityForm(null, null, null));

      act(() => {
        result.current.setSeasonEpisodes([
          { season: '1', episode: '5' },
          { season: '2', episode: '1' },
        ]);
      });

      expect(result.current.seasonEpisodes).toHaveLength(2);
      expect(result.current.seasonEpisodes[0].season).toBe('1');
    });
  });
});

