import AsyncStorage from '@react-native-async-storage/async-storage';

// Color palettes
export const lightColors = {
  // Background colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  
  // Text colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0051D5',
  
  // Status colors
  success: '#047857',
  successLight: '#a7f3d0',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Card colors
  card: '#ffffff',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Input colors
  inputBackground: '#ffffff',
  inputBorder: '#e2e8f0',
  inputText: '#1e293b',
  placeholder: '#94a3b8',
  
  // Modal colors
  modalBackground: 'rgba(0, 0, 0, 0.5)',
  modalContent: '#ffffff',
  
  // Tab bar colors
  tabBarBackground: '#ffffff',
  tabBarActive: '#007AFF',
  tabBarInactive: '#94a3b8',
  
  // Header colors
  headerBackground: '#007AFF',
  headerText: '#ffffff',
};

export const darkColors = {
  // Background colors
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  
  // Text colors
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  
  // Border colors
  border: '#334155',
  borderLight: '#475569',
  
  // Primary colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  
  // Status colors
  success: '#10b981',
  successLight: '#065f46',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Card colors
  card: '#1e293b',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  // Input colors
  inputBackground: '#334155',
  inputBorder: '#475569',
  inputText: '#f1f5f9',
  placeholder: '#64748b',
  
  // Modal colors
  modalBackground: 'rgba(0, 0, 0, 0.7)',
  modalContent: '#1e293b',
  
  // Tab bar colors
  tabBarBackground: '#1e293b',
  tabBarActive: '#3b82f6',
  tabBarInactive: '#64748b',
  
  // Header colors
  headerBackground: '#1e293b',
  headerText: '#f1f5f9',
};

class ThemeService {
  constructor() {
    this.theme = 'dark';
    this.colors = darkColors;
    this.listeners = [];
  }

  async init() {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.theme = savedTheme;
        this.colors = savedTheme === 'dark' ? darkColors : lightColors;
      } else {
        // If no saved theme, use dark as default
        this.theme = 'dark';
        this.colors = darkColors;
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }

  getTheme() {
    return this.theme;
  }

  getColors() {
    return this.colors;
  }

  async setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }

    try {
      await AsyncStorage.setItem('theme', theme);
      this.theme = theme;
      this.colors = theme === 'dark' ? darkColors : lightColors;
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  async toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    await this.setTheme(newTheme);
    return newTheme;
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.theme));
  }
}

const themeService = new ThemeService();

export default themeService;

