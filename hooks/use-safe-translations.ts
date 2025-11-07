/**
 * Safe Translation Hook with Fallback Support
 * 
 * This hook extends next-intl's useTranslations with additional
 * fallback mechanisms and missing key detection.
 */

'use client';

import { useTranslations as useNextIntlTranslations, useLocale } from 'next-intl';
import { useCallback } from 'react';
import { logMissingTranslation } from '@/lib/i18n/translation-validator';
import { DEFAULT_LANGUAGE } from '@/lib/i18n/languages';

/**
 * Enhanced translation hook with fallback support
 * 
 * @param namespace - The translation namespace (e.g., 'common', 'auth')
 * @returns Translation function with fallback support
 */
export function useSafeTranslations(namespace?: string) {
  const t = useNextIntlTranslations(namespace);
  const locale = useLocale();

  /**
   * Get translation with fallback and error handling
   */
  const translate = useCallback(
    (key: string, values?: Record<string, any>, options?: { fallback?: string }): string => {
      try {
        // Try to get the translation
        const translation = t(key, values);
        
        // Check if translation is missing (next-intl returns the key if missing)
        if (translation === key || translation.startsWith('[') && translation.endsWith(']')) {
          // Log missing translation in development
          if (process.env.NODE_ENV === 'development') {
            const fullKey = namespace ? `${namespace}.${key}` : key;
            logMissingTranslation(fullKey, locale);
          }
          
          // Return fallback if provided
          if (options?.fallback) {
            return options.fallback;
          }
        }
        
        return translation;
      } catch (error) {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`Translation error for key "${key}":`, error);
        }
        
        // Return fallback or key
        return options?.fallback || key;
      }
    },
    [t, locale, namespace]
  );

  /**
   * Check if a translation key exists
   */
  const has = useCallback(
    (key: string): boolean => {
      try {
        const translation = t(key);
        return translation !== key && !translation.startsWith('[');
      } catch {
        return false;
      }
    },
    [t]
  );

  /**
   * Get translation or return undefined if missing
   */
  const optional = useCallback(
    (key: string, values?: Record<string, any>): string | undefined => {
      try {
        const translation = t(key, values);
        if (translation === key || translation.startsWith('[') && translation.endsWith(']')) {
          return undefined;
        }
        return translation;
      } catch {
        return undefined;
      }
    },
    [t]
  );

  /**
   * Get translation with rich text support
   */
  const rich = useCallback(
    (key: string, values?: Record<string, any>): React.ReactNode => {
      return t.rich(key, values);
    },
    [t]
  );

  return {
    t: translate,
    has,
    optional,
    rich,
    locale,
    isDefaultLocale: locale === DEFAULT_LANGUAGE,
  };
}

/**
 * Hook for getting translations from multiple namespaces
 */
export function useMultipleTranslations(namespaces: string[]) {
  const locale = useLocale();
  const translations = namespaces.reduce((acc, namespace) => {
    acc[namespace] = useNextIntlTranslations(namespace);
    return acc;
  }, {} as Record<string, ReturnType<typeof useNextIntlTranslations>>);

  const translate = useCallback(
    (namespace: string, key: string, values?: Record<string, any>): string => {
      try {
        const t = translations[namespace];
        if (!t) {
          console.warn(`Namespace "${namespace}" not loaded`);
          return key;
        }
        return t(key, values);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Translation error for ${namespace}.${key}:`, error);
        }
        return key;
      }
    },
    [translations]
  );

  return {
    t: translate,
    translations,
    locale,
  };
}
