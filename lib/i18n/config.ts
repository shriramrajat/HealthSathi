import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './languages';

export const I18N_CONFIG = {
  // Default locale
  defaultLocale: DEFAULT_LANGUAGE,
  
  // All supported locales
  locales: SUPPORTED_LANGUAGES.map(lang => lang.code),
  
  // Locale detection settings
  localeDetection: {
    // Enable automatic locale detection
    enabled: true,
    
    // Cookie name for storing locale preference
    cookieName: 'NEXT_LOCALE',
    
    // Cookie options
    cookieOptions: {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
    
    // Local storage key for client-side preference
    localStorageKey: 'preferred-language',
    
    // Firestore field name for user language preference
    firestoreField: 'language',
  },
  
  // Translation file paths
  messages: {
    path: '/messages',
    extension: '.json',
  },
  
  // Fallback behavior
  fallback: {
    // Show keys when translation is missing in development
    showKeys: process.env.NODE_ENV === 'development',
    
    // Log missing translations
    logMissing: process.env.NODE_ENV === 'development',
    
    // Fallback to default language when translation is missing
    useDefault: true,
  },
  
  // Performance settings
  performance: {
    // Enable lazy loading of translation files
    lazyLoading: true,
    
    // Cache translations in memory
    cacheTranslations: true,
    
    // Preload critical translations
    preloadCritical: ['common', 'auth'],
  },
  
  // Development tools
  development: {
    // Enable translation debugging
    debug: process.env.NODE_ENV === 'development',
    
    // Show translation boundaries in UI
    showBoundaries: false,
    
    // Validate translation completeness
    validateCompleteness: process.env.NODE_ENV === 'development',
  },
} as const;

export type I18nConfig = typeof I18N_CONFIG;