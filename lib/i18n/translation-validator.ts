/**
 * Translation Validation and Fallback Utilities
 * 
 * This module provides utilities for:
 * - Detecting missing translation keys
 * - Validating translation completeness
 * - Providing fallback mechanisms
 * - Development-time warnings for incomplete translations
 */

import { I18N_CONFIG } from './config';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './languages';

export interface TranslationValidationResult {
  isComplete: boolean;
  missingKeys: string[];
  totalKeys: number;
  translatedKeys: number;
  completeness: number; // Percentage
}

export interface TranslationCompletenessReport {
  [locale: string]: TranslationValidationResult;
}

/**
 * Flatten nested translation object into dot-notation keys
 */
function flattenTranslations(
  obj: Record<string, any>,
  prefix: string = ''
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenTranslations(value, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
}

/**
 * Load translation file for a specific locale
 */
async function loadTranslations(locale: string): Promise<Record<string, any>> {
  try {
    const translations = await import(`../../messages/${locale}.json`);
    return translations.default || translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    return {};
  }
}

/**
 * Validate translation completeness for a specific locale against the default language
 */
export async function validateTranslationCompleteness(
  locale: string
): Promise<TranslationValidationResult> {
  // Load default language translations as reference
  const defaultTranslations = await loadTranslations(DEFAULT_LANGUAGE);
  const defaultFlat = flattenTranslations(defaultTranslations);
  const defaultKeys = Object.keys(defaultFlat);

  // Load target locale translations
  const localeTranslations = await loadTranslations(locale);
  const localeFlat = flattenTranslations(localeTranslations);

  // Find missing keys
  const missingKeys = defaultKeys.filter(key => !(key in localeFlat));

  const totalKeys = defaultKeys.length;
  const translatedKeys = totalKeys - missingKeys.length;
  const completeness = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

  return {
    isComplete: missingKeys.length === 0,
    missingKeys,
    totalKeys,
    translatedKeys,
    completeness: Math.round(completeness * 100) / 100,
  };
}

/**
 * Generate a completeness report for all supported languages
 */
export async function generateCompletenessReport(): Promise<TranslationCompletenessReport> {
  const report: TranslationCompletenessReport = {};

  for (const language of SUPPORTED_LANGUAGES) {
    if (language.code !== DEFAULT_LANGUAGE) {
      report[language.code] = await validateTranslationCompleteness(language.code);
    }
  }

  return report;
}

/**
 * Log missing translations in development mode
 */
export function logMissingTranslation(key: string, locale: string): void {
  if (I18N_CONFIG.fallback.logMissing && process.env.NODE_ENV === 'development') {
    console.warn(
      `[i18n] Missing translation key: "${key}" for locale: "${locale}". Falling back to default language.`
    );
  }
}

/**
 * Get translation with fallback support
 */
export function getTranslationWithFallback(
  translations: Record<string, any>,
  defaultTranslations: Record<string, any>,
  key: string,
  locale: string
): string {
  // Try to get the translation from the current locale
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      value = undefined;
      break;
    }
  }

  // If translation exists, return it
  if (value !== undefined && typeof value === 'string') {
    return value;
  }

  // Log missing translation
  logMissingTranslation(key, locale);

  // Fallback to default language
  if (I18N_CONFIG.fallback.useDefault && locale !== DEFAULT_LANGUAGE) {
    let fallbackValue: any = defaultTranslations;

    for (const k of keys) {
      if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
        fallbackValue = fallbackValue[k];
      } else {
        fallbackValue = undefined;
        break;
      }
    }

    if (fallbackValue !== undefined && typeof fallbackValue === 'string') {
      return fallbackValue;
    }
  }

  // If all else fails, return the key itself (useful for debugging)
  if (I18N_CONFIG.fallback.showKeys) {
    return `[${key}]`;
  }

  return key;
}

/**
 * Validate translation file structure
 */
export async function validateTranslationStructure(
  locale: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const translations = await loadTranslations(locale);

    // Check if translations is an object
    if (typeof translations !== 'object' || translations === null) {
      errors.push(`Translation file for ${locale} is not a valid object`);
      return { valid: false, errors };
    }

    // Check for required top-level keys
    const requiredKeys = ['common', 'auth', 'dashboard', 'consultation'];
    for (const key of requiredKeys) {
      if (!(key in translations)) {
        errors.push(`Missing required top-level key: ${key}`);
      }
    }

    // Check for empty values
    const flatTranslations = flattenTranslations(translations);
    for (const [key, value] of Object.entries(flatTranslations)) {
      if (!value || value.trim() === '') {
        errors.push(`Empty translation value for key: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Failed to load or parse translation file: ${error}`);
    return { valid: false, errors };
  }
}

/**
 * Print completeness report to console (for development)
 */
export async function printCompletenessReport(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('\n=== Translation Completeness Report ===\n');

  const report = await generateCompletenessReport();

  for (const [locale, result] of Object.entries(report)) {
    const status = result.isComplete ? '✓' : '✗';
    const color = result.isComplete ? '\x1b[32m' : '\x1b[33m';
    const reset = '\x1b[0m';

    console.log(`${color}${status} ${locale.toUpperCase()}${reset}`);
    console.log(`  Completeness: ${result.completeness}%`);
    console.log(`  Translated: ${result.translatedKeys}/${result.totalKeys} keys`);

    if (!result.isComplete && result.missingKeys.length > 0) {
      console.log(`  Missing keys (${result.missingKeys.length}):`);
      result.missingKeys.slice(0, 10).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (result.missingKeys.length > 10) {
        console.log(`    ... and ${result.missingKeys.length - 10} more`);
      }
    }
    console.log('');
  }

  console.log('=======================================\n');
}

/**
 * Check if a translation key exists
 */
export function hasTranslationKey(
  translations: Record<string, any>,
  key: string
): boolean {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return false;
    }
  }

  return value !== undefined;
}
