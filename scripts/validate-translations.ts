#!/usr/bin/env tsx
/**
 * Translation Validation Script
 * 
 * Run this script to validate translation completeness across all supported languages.
 * 
 * Usage:
 *   npm run validate:translations
 *   or
 *   tsx scripts/validate-translations.ts
 */

import {
  generateCompletenessReport,
  validateTranslationStructure,
  printCompletenessReport,
} from '../lib/i18n/translation-validator';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../lib/i18n/languages';

async function main() {
  console.log('🔍 Validating translations...\n');

  let hasErrors = false;

  // Validate structure for all languages
  console.log('📋 Validating translation file structure...\n');
  for (const language of SUPPORTED_LANGUAGES) {
    const result = await validateTranslationStructure(language.code);
    
    if (!result.valid) {
      hasErrors = true;
      console.error(`❌ ${language.name} (${language.code}): Structure validation failed`);
      result.errors.forEach(error => console.error(`   - ${error}`));
      console.log('');
    } else {
      console.log(`✅ ${language.name} (${language.code}): Structure valid`);
    }
  }

  console.log('');

  // Generate and print completeness report
  await printCompletenessReport();

  // Check completeness
  const report = await generateCompletenessReport();
  let allComplete = true;

  for (const [locale, result] of Object.entries(report)) {
    if (!result.isComplete) {
      allComplete = false;
      if (result.completeness < 90) {
        hasErrors = true;
        console.error(
          `⚠️  Warning: ${locale} translation is only ${result.completeness}% complete`
        );
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ Translation validation failed with errors');
    process.exit(1);
  } else if (!allComplete) {
    console.warn('⚠️  Some translations are incomplete but above threshold');
    process.exit(0);
  } else {
    console.log('✅ All translations are complete and valid!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error during validation:', error);
  process.exit(1);
});
