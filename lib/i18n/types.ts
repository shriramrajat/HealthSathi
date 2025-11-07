// Translation namespace types
export interface TranslationNamespaces {
  common: {
    buttons: Record<string, string>;
    navigation: Record<string, string>;
    forms: Record<string, string>;
    status: Record<string, string>;
    messages: Record<string, string>;
  };
  auth: {
    login: Record<string, string> & {
      socialLogin: Record<string, string>;
    };
    register: Record<string, string> & {
      roles: Record<string, string>;
    };
    forgotPassword: Record<string, string>;
    resetPassword: Record<string, string>;
    errors: Record<string, string>;
  };
  dashboard: {
    patient: Record<string, string>;
    doctor: Record<string, string>;
    pharmacy: Record<string, string>;
    chw: Record<string, string>;
  };
  consultation: {
    preConsultation: Record<string, string>;
    videoCall: Record<string, string>;
    postConsultation: Record<string, string>;
    errors: Record<string, string>;
  } & Record<string, string>;
  pharmacy: {
    prescriptions: Record<string, string>;
    inventory: Record<string, string>;
  };
}

// Language preference storage types
export interface LanguagePreference {
  code: string;
  timestamp: number;
  source: 'user' | 'browser' | 'default';
}

// User profile language extension
export interface UserLanguageProfile {
  language?: string;
  languageUpdatedAt?: Date;
  languageSource?: 'manual' | 'auto' | 'browser';
}

// Translation error types
export interface TranslationError {
  type: 'missing_key' | 'missing_file' | 'invalid_language' | 'load_error';
  language: string;
  key?: string;
  namespace?: string;
  fallback?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// Language switching event types
export interface LanguageChangeEvent {
  previousLanguage: string;
  newLanguage: string;
  source: 'user' | 'system' | 'auto';
  timestamp: Date;
}

// Translation loading states
export type TranslationLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

// Translation context types
export interface TranslationContext {
  language: string;
  direction: 'ltr' | 'rtl';
  isLoading: boolean;
  error?: TranslationError;
  changeLanguage: (language: string) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
}

// Locale detection result
export interface LocaleDetectionResult {
  locale: string;
  source: 'cookie' | 'header' | 'localStorage' | 'browser' | 'default';
  confidence: number;
}

// Translation validation types
export interface TranslationValidation {
  isComplete: boolean;
  missingKeys: string[];
  extraKeys: string[];
  totalKeys: number;
  translatedKeys: number;
  completionPercentage: number;
}

// Export utility type for translation keys
export type TranslationKey = keyof TranslationNamespaces;
export type NestedTranslationKey<T> = T extends Record<string, any>
  ? {
      [K in keyof T]: T[K] extends Record<string, any>
        ? `${K & string}.${NestedTranslationKey<T[K]> & string}`
        : K & string;
    }[keyof T]
  : never;