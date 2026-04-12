import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import tr from '../locales/tr.json';
import ur from '../locales/ur.json';
import id from '../locales/id.json';
import ms from '../locales/ms.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Translation resources
const translations: Record<string, any> = {
  en,
  ar,
  es,
  fr,
  de,
  tr,
  ur,
  id,
  ms,
};

// Current locale
let currentLocale = 'en';

// Get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }
  return typeof value === 'string' ? value : path;
};

// Simple i18n class
class SimpleI18n {
  locale: string = 'en';

  t(key: string, options?: any): string {
    const translation = translations[this.locale] || translations.en;
    let value = getNestedValue(translation, key);

    if ((value === key || value === undefined) && this.locale !== 'en') {
      value = getNestedValue(translations.en, key);
    }

    // Simple interpolation
    if (options && typeof value === 'string') {
      Object.keys(options).forEach((optionKey) => {
        value = value.replace(`{{${optionKey}}}`, String(options[optionKey]));
      });
    }
    
    return value;
  }

  setLocale(locale: string) {
    if (translations[locale]) {
      this.locale = locale;
      currentLocale = locale;
    }
  }

  getLocale(): string {
    return this.locale;
  }
}

// Create i18n instance
export const i18n = new SimpleI18n();

// Get device language or default to English
const getDeviceLanguage = (): string => {
  try {
    const deviceLocale = Localization.locale;
    
    // Check if locale is available
    if (!deviceLocale || typeof deviceLocale !== 'string') {
      return 'en'; // Default to English if locale is not available
    }
    
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    
    // Check if we support this language
    const supportedLanguages = ['en', 'ar', 'es', 'fr', 'de', 'tr', 'ur', 'id', 'ms'];
    if (supportedLanguages.includes(languageCode)) {
      return languageCode;
    }
  } catch (error) {
    console.error('Error getting device language:', error);
  }
  
  return 'en'; // Default to English
};

// Load saved language preference
export const loadSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const supportedLanguages = ['en', 'ar', 'es', 'fr', 'de', 'tr', 'ur', 'id', 'ms'];
    if (savedLanguage && typeof savedLanguage === 'string' && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  
  // Fallback to device language or English
  try {
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en'; // Final fallback to English
  }
};

// Save language preference
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.setLocale(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialize i18n
export const initI18n = async () => {
  try {
    const savedLanguage = await loadSavedLanguage();
    i18n.setLocale(savedLanguage);
    return i18n;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // Fallback to English if initialization fails
    i18n.setLocale('en');
    return i18n;
  }
};

// Translation function
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

export default i18n;
