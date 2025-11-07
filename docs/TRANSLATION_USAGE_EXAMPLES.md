# Translation and RTL Usage Examples

This document provides practical examples of using the translation validation, fallback mechanisms, and RTL support features.

## Translation Validation

### Running Translation Validation

```bash
# Validate all translations
npm run i18n:validate

# Or use the alias
npm run i18n:check
```

### Example Output

```
🔍 Validating translations...

📋 Validating translation file structure...

✅ English (en): Structure valid
✅ Hindi (hi): Structure valid
✅ Marathi (mr): Structure valid

=== Translation Completeness Report ===

✓ HI
  Completeness: 100%
  Translated: 450/450 keys

✓ MR
  Completeness: 100%
  Translated: 450/450 keys

=======================================

✅ All translations are complete and valid!
```

## Using Safe Translations Hook

### Basic Usage

```tsx
'use client';

import { useSafeTranslations } from '@/hooks/use-safe-translations';

export function MyComponent() {
  const { t, has, optional } = useSafeTranslations('common');

  return (
    <div>
      {/* Basic translation */}
      <h1>{t('buttons.save')}</h1>

      {/* Translation with fallback */}
      <p>{t('newKey', {}, { fallback: 'Default text' })}</p>

      {/* Check if translation exists */}
      {has('buttons.delete') && (
        <button>{t('buttons.delete')}</button>
      )}

      {/* Optional translation (returns undefined if missing) */}
      {optional('buttons.custom') && (
        <span>{optional('buttons.custom')}</span>
      )}
    </div>
  );
}
```

### With Variables

```tsx
import { useSafeTranslations } from '@/hooks/use-safe-translations';

export function WelcomeMessage({ userName }: { userName: string }) {
  const { t } = useSafeTranslations('dashboard');

  return (
    <h1>{t('patient.welcome', { name: userName })}</h1>
  );
}
```

### Multiple Namespaces

```tsx
import { useMultipleTranslations } from '@/hooks/use-safe-translations';

export function ComplexComponent() {
  const { t } = useMultipleTranslations(['common', 'auth', 'dashboard']);

  return (
    <div>
      <button>{t('common', 'buttons.save')}</button>
      <p>{t('auth', 'login.title')}</p>
      <h1>{t('dashboard', 'patient.title')}</h1>
    </div>
  );
}
```

## RTL Support Examples

### Using the RTL Hook

```tsx
'use client';

import { useRTL } from '@/hooks/use-rtl';

export function DirectionalComponent() {
  const { direction, isRTL, spacing, textAlign, border } = useRTL();

  return (
    <div className={`${spacing.start('4')} ${border.start('2')}`}>
      <p className={textAlign.start}>
        This text aligns to the start (left in LTR, right in RTL)
      </p>
      
      {isRTL && <span>RTL mode is active</span>}
    </div>
  );
}
```

### RTL-Aware Icons

```tsx
import { useRTL } from '@/hooks/use-rtl';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export function NavigationButtons() {
  const { getIconStyle, shouldMirror } = useRTL();

  return (
    <div>
      {/* Icon that should mirror in RTL */}
      <button>
        <ChevronRight style={getIconStyle('chevron')} />
        Next
      </button>

      {/* Icon that should mirror in RTL */}
      <button>
        <ArrowLeft style={getIconStyle('arrow')} />
        Back
      </button>
    </div>
  );
}
```

### Using RTL Components

```tsx
import { 
  RTLWrapper, 
  RTLText, 
  RTLIcon, 
  RTLFlex,
  RTLSpacing 
} from '@/components/rtl-wrapper';
import { ChevronRight } from 'lucide-react';

export function RTLExample() {
  return (
    <RTLWrapper>
      {/* Text with automatic alignment */}
      <RTLText align="start">
        This text aligns to the start
      </RTLText>

      {/* Icon that mirrors in RTL */}
      <RTLIcon iconName="chevron">
        <ChevronRight />
      </RTLIcon>

      {/* Flex container that reverses in RTL */}
      <RTLFlex direction="row">
        <div>First</div>
        <div>Second</div>
      </RTLFlex>

      {/* Spacing that adapts to direction */}
      <RTLSpacing start="4" end="2">
        <p>Content with directional spacing</p>
      </RTLSpacing>
    </RTLWrapper>
  );
}
```

### Direction-Aware Animations

```tsx
import { useRTLAnimation } from '@/hooks/use-rtl';
import { motion } from 'framer-motion';

export function AnimatedSlide() {
  const { getSlideDirection, getTransformX } = useRTLAnimation();

  return (
    <motion.div
      initial={{ x: getTransformX(-100) }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      Slides in from the start (left in LTR, right in RTL)
    </motion.div>
  );
}
```

### Custom Directional Styling

```tsx
import { useRTL } from '@/hooks/use-rtl';

export function CustomStyledComponent() {
  const { getStyles, getTailwindClasses } = useRTL();

  // Inline styles
  const containerStyle = getStyles({
    marginLeft: '1rem',
    paddingRight: '2rem',
    textAlign: 'left',
  });

  // Tailwind classes
  const buttonClasses = getTailwindClasses('ml-4 text-left border-l-2');

  return (
    <div style={containerStyle}>
      <button className={buttonClasses}>
        Click me
      </button>
    </div>
  );
}
```

## Combined Example: Multilingual Form with RTL Support

```tsx
'use client';

import { useSafeTranslations } from '@/hooks/use-safe-translations';
import { useRTL } from '@/hooks/use-rtl';
import { RTLWrapper, RTLText, RTLIcon } from '@/components/rtl-wrapper';
import { ChevronRight } from 'lucide-react';

export function MultilingualForm() {
  const { t, has } = useSafeTranslations('auth');
  const { spacing, textAlign, isRTL } = useRTL();

  return (
    <RTLWrapper className="max-w-md mx-auto p-6">
      <form>
        {/* Title with automatic alignment */}
        <RTLText as="h1" align="start" className="text-2xl font-bold mb-6">
          {t('login.title')}
        </RTLText>

        {/* Email field */}
        <div className={`mb-4 ${spacing.start('0')}`}>
          <label className={`block ${textAlign.start} mb-2`}>
            {t('login.email')}
          </label>
          <input
            type="email"
            placeholder={t('login.emailPlaceholder')}
            className="w-full p-2 border rounded"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Password field */}
        <div className={`mb-4 ${spacing.start('0')}`}>
          <label className={`block ${textAlign.start} mb-2`}>
            {t('login.password')}
          </label>
          <input
            type="password"
            placeholder={t('login.passwordPlaceholder')}
            className="w-full p-2 border rounded"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Submit button with icon */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2"
        >
          <span>{t('login.submit')}</span>
          <RTLIcon iconName="chevron">
            <ChevronRight size={16} />
          </RTLIcon>
        </button>

        {/* Forgot password link (only if translation exists) */}
        {has('login.forgotPassword') && (
          <RTLText align="center" className="mt-4 text-sm">
            <a href="/forgot-password" className="text-blue-500 hover:underline">
              {t('login.forgotPassword')}
            </a>
          </RTLText>
        )}
      </form>
    </RTLWrapper>
  );
}
```

## Testing RTL Layouts

### Manual Testing

```tsx
// Switch to RTL language for testing
import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => router.push('/en')}>English (LTR)</button>
      <button onClick={() => router.push('/ar')}>Arabic (RTL)</button>
      <button onClick={() => router.push('/he')}>Hebrew (RTL)</button>
    </div>
  );
}
```

### Visual Testing

```tsx
import { useRTL } from '@/hooks/use-rtl';

export function RTLDebugger() {
  const { direction, isRTL, locale } = useRTL();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded">
      <p>Locale: {locale}</p>
      <p>Direction: {direction}</p>
      <p>RTL Mode: {isRTL ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Best Practices

### 1. Always Use Safe Translations

```tsx
// ❌ Bad - no fallback
const text = t('some.key');

// ✅ Good - with fallback
const { t } = useSafeTranslations('namespace');
const text = t('some.key', {}, { fallback: 'Default text' });
```

### 2. Use Logical Properties for Spacing

```tsx
// ❌ Bad - hardcoded direction
<div className="ml-4 text-left">

// ✅ Good - direction-aware
const { spacing, textAlign } = useRTL();
<div className={`${spacing.start('4')} ${textAlign.start}`}>
```

### 3. Mirror Directional Icons

```tsx
// ❌ Bad - icon doesn't mirror
<ChevronRight />

// ✅ Good - icon mirrors in RTL
<RTLIcon iconName="chevron">
  <ChevronRight />
</RTLIcon>
```

### 4. Test in Both Directions

Always test your components in both LTR and RTL modes to ensure proper layout and functionality.

### 5. Validate Translations Regularly

Run `npm run i18n:validate` before committing changes to ensure translation completeness.

## Troubleshooting

### Missing Translation Keys

If you see warnings about missing keys in development:

```
[i18n] Missing translation key: "auth.login.newField" for locale: "hi". Falling back to default language.
```

Add the missing key to the translation file:

```json
// messages/hi.json
{
  "auth": {
    "login": {
      "newField": "नया फ़ील्ड"
    }
  }
}
```

### RTL Layout Issues

If layout breaks in RTL mode:

1. Check if you're using physical properties (left/right)
2. Use the `useRTL()` hook helpers instead
3. Test with the RTL debugger component
4. Verify icon mirroring is working correctly

### Performance Issues

If you notice performance issues:

1. Memoize translation calls when possible
2. Use `optional()` for conditional translations
3. Avoid calling `t()` in loops
4. Consider using `useMultipleTranslations()` for multiple namespaces
