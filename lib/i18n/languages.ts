export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  enabled: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    enabled: true,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    direction: 'ltr',
    enabled: true,
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    direction: 'ltr',
    enabled: true,
  },
];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(lang => lang.code);

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getEnabledLanguages = (): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.enabled);
};

export const isValidLanguageCode = (code: string): boolean => {
  return LANGUAGE_CODES.includes(code);
};

export const getLanguageName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.name || code;
};

export const getNativeLanguageName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.nativeName || code;
};

export const getLanguageFlag = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.flag || '🌐';
};

export const getLanguageDirection = (code: string): 'ltr' | 'rtl' => {
  const language = getLanguageByCode(code);
  return language?.direction || 'ltr';
};

// Future RTL language support configuration
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const isRTLLanguage = (code: string): boolean => {
  return RTL_LANGUAGES.includes(code);
};

// Language detection utilities
export const detectBrowserLanguage = (): string => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.split('-')[0];
  return isValidLanguageCode(browserLang) ? browserLang : DEFAULT_LANGUAGE;
};

export const getPreferredLanguage = (userLang?: string, browserLang?: string): string => {
  // Priority: user preference > browser language > default
  if (userLang && isValidLanguageCode(userLang)) {
    return userLang;
  }
  
  if (browserLang && isValidLanguageCode(browserLang)) {
    return browserLang;
  }
  
  const detectedLang = detectBrowserLanguage();
  return detectedLang;
};