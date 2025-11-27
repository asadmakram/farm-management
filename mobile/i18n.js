import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

import en from './locales/en.json';
import ur from './locales/ur.json';

const resources = {
  en: { translation: en },
  ur: { translation: ur }
};

// RTL languages
const RTL_LANGUAGES = ['ur', 'ar', 'he', 'fa'];

const initI18n = async () => {
  // Get saved language from AsyncStorage
  let savedLanguage = await AsyncStorage.getItem('userLanguage');
  
  // If no saved language, use device locale
  if (!savedLanguage) {
    savedLanguage = Localization.getLocales()[0].languageCode;
  }

  // Check if RTL direction needs to change
  const isRTL = RTL_LANGUAGES.includes(savedLanguage);
  const currentRTL = I18nManager.isRTL;

  // If RTL setting needs to change, update it and reload the app
  if (isRTL !== currentRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    
    // Save the RTL state
    await AsyncStorage.setItem('isRTL', isRTL.toString());
    
    // Reload the app to apply RTL changes
    if (!__DEV__) {
      await Updates.reloadAsync();
    }
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
};

initI18n();

export default i18n;
