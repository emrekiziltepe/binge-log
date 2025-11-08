import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language files
import tr from './locales/tr.json';
import en from './locales/en.json';

// Supported languages
const supportedLanguages = ['tr', 'en'];

// Get language preference from AsyncStorage
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  return 'en'; // Default language is English
};

// Language change function
export const changeLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem('selectedLanguage', languageCode);
    i18n.changeLanguage(languageCode);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Configure i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    lng: 'en', // Start with English, then load from AsyncStorage
    fallbackLng: 'en',
    debug: false, // Turn off debug
    
    resources: {
      tr: {
        translation: tr
      },
      en: {
        translation: en
      }
    },
    
    interpolation: {
      escapeValue: false, // React already provides XSS protection
    },
    
    react: {
      useSuspense: false, // Turn off suspense for React Native
    }
  });

// Load saved language when app starts
getInitialLanguage().then(language => {
  if (language !== 'en') {
    i18n.changeLanguage(language);
  }
});

export default i18n;
