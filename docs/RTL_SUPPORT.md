# RTL (Right-to-Left) Language Support

This document describes the RTL language support infrastructure implemented in the NeuraNovaa application.

## Overview

The application includes comprehensive RTL support for languages like Arabic, Hebrew, Farsi, and Urdu. The infrastructure automatically handles layout mirroring, text direction, and direction-aware styling.

## Features

### 1. Automatic Direction Detection

The application automatically detects the text direction based on the current locale:

```typescript
import { getTextDirection, isRTL } from '@/lib/i18n/rtl-support';

const direction = getTextDirection('ar'); // 'rtl'
const isRTLMode = isRTL('ar'); // true
```

### 2. React Hooks

#### `useRTL()`

The main hook for RTL support in React components:

```tsx
import { useRTL } from '@/hooks/use-rtl';

function MyComponent() {
  const { direction, isRTL, spacing, textAlign } = useRTL();

  return (
    <div className={spacing.start('4')}>
      <p className={textAlign.start}>
        This text aligns to the start (left in LTR, right in RTL)
      </p>
    </div>
  );
}
```

#### `useRTLAnimation()`

Hook for direction-aware animations:

```tsx
import { useRTLAnimation } from '@/hooks/use-rtl';

function AnimatedComponent() {
  const { getSlideDirection, getTransformX } = useRTLAnimation();

  const slideFrom = getSlideDirection('left'); // 'right' in RTL mode
  const transform = getTransformX(100); // -100 in RTL mode

  return <div style={{ transform: `translateX(${transform}px)` }}>...</div>;
}
```

### 3. RTL Components

#### RTLWrapper

Wraps children with RTL context:

```tsx
import { RTLWrapper } from '@/components/rtl-wrapper';

function App() {
  return (
    <RTLWrapper>
      <YourContent />
    </RTLWrapper>
  );
}
```

#### RTLText

Direction-aware text component:

```tsx
import { RTLText } from '@/components/rtl-wrapper';

<RTLText align="start">This text aligns to the start</RTLText>
<RTLText align="end">This text aligns to the end</RTLText>
<RTLText align="center">This text is centered</RTLText>
```

#### RTLIcon

Automatically mirrors icons in RTL mode:

```tsx
import { RTLIcon } from '@/components/rtl-wrapper';
import { ChevronRight } from 'lucide-react';

<RTLIcon iconName="chevron">
  <ChevronRight />
</RTLIcon>
```

#### RTLFlex

Direction-aware flex container:

```tsx
import { RTLFlex } from '@/components/rtl-wrapper';

<RTLFlex direction="row">
  <div>First</div>
  <div>Second</div>
</RTLFlex>
```

### 4. Utility Functions

#### Direction-aware Tailwind Classes

```typescript
import { getDirectionalTailwindClasses } from '@/lib/i18n/rtl-support';

const classes = getDirectionalTailwindClasses('ml-4 text-left', 'rtl');
// Returns: 'mr-4 text-right'
```

#### Direction-aware Inline Styles

```typescript
import { getDirectionalStyles } from '@/lib/i18n/rtl-support';

const styles = getDirectionalStyles(
  { marginLeft: '1rem', textAlign: 'left' },
  'rtl'
);
// Returns: { marginRight: '1rem', textAlign: 'right' }
```

### 5. CSS Classes

Global RTL CSS classes are available in `styles/rtl.css`:

```css
/* Automatically applied based on dir attribute */
[dir='rtl'] .text-start {
  text-align: right;
}

/* Manual RTL mirroring */
.rtl-mirror {
  transform: scaleX(-1);
}

/* Prevent mirroring */
.no-rtl-mirror {
  transform: none !important;
}
```

## Usage Guidelines

### 1. Use Logical Properties

Instead of `left` and `right`, use `start` and `end`:

```tsx
// ❌ Bad
<div className="ml-4 text-left">

// ✅ Good
const { spacing, textAlign } = useRTL();
<div className={`${spacing.start('4')} ${textAlign.start}`}>
```

### 2. Mirror Directional Icons

Icons that indicate direction should be mirrored in RTL:

```tsx
import { RTLIcon } from '@/components/rtl-wrapper';
import { ArrowRight } from 'lucide-react';

// Automatically mirrors in RTL
<RTLIcon iconName="arrow">
  <ArrowRight />
</RTLIcon>
```

### 3. Don't Mirror Non-Directional Content

Some content should not be mirrored:

- Numbers
- Code blocks
- Logos
- Images with text
- Mathematical expressions

```tsx
// Prevent mirroring
<div className="no-rtl-mirror">
  <code>const x = 10;</code>
</div>
```

### 4. Test in Both Directions

Always test your components in both LTR and RTL modes:

```tsx
// Switch locale to test
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/ar'); // Switch to Arabic (RTL)
router.push('/en'); // Switch to English (LTR)
```

## Supported RTL Languages

The following languages are configured for RTL support:

- Arabic (ar)
- Hebrew (he)
- Farsi/Persian (fa)
- Urdu (ur)

To add a new RTL language, update `lib/i18n/languages.ts`:

```typescript
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'new-language'];
```

## Layout Mirroring

The following layout elements are automatically mirrored in RTL mode:

- Margins and padding (left ↔ right)
- Text alignment (left ↔ right)
- Float positioning (left ↔ right)
- Absolute positioning (left ↔ right)
- Border sides (left ↔ right)
- Border radius corners
- Flexbox direction
- Grid flow direction
- Transform translateX (positive ↔ negative)

## Animations

Animations are automatically adjusted for RTL:

```tsx
import { useRTLAnimation } from '@/hooks/use-rtl';

function SlideIn() {
  const { getSlideDirection } = useRTLAnimation();

  return (
    <motion.div
      initial={{ x: getSlideDirection('left') === 'left' ? -100 : 100 }}
      animate={{ x: 0 }}
    >
      Content
    </motion.div>
  );
}
```

## Best Practices

1. **Use semantic spacing**: Use `start`/`end` instead of `left`/`right`
2. **Test thoroughly**: Test all components in both LTR and RTL modes
3. **Mirror directional icons**: Arrows, chevrons, and carets should mirror
4. **Preserve content integrity**: Don't mirror logos, images, or code
5. **Use RTL hooks**: Leverage `useRTL()` for consistent behavior
6. **Document RTL behavior**: Note any special RTL handling in component docs

## Troubleshooting

### Issue: Layout breaks in RTL mode

**Solution**: Check if you're using physical properties (left/right) instead of logical properties (start/end).

### Issue: Icons not mirroring

**Solution**: Wrap icons in `RTLIcon` component or use the `useRTL()` hook's `getIconStyle()` method.

### Issue: Animations going wrong direction

**Solution**: Use `useRTLAnimation()` hook to get direction-aware animation values.

### Issue: Text alignment incorrect

**Solution**: Use the `textAlign` helper from `useRTL()` hook instead of hardcoded classes.

## Performance Considerations

- RTL detection happens once per component render
- Direction calculations are memoized
- CSS transformations are hardware-accelerated
- No runtime overhead for LTR languages

## Future Enhancements

- [ ] Automatic RTL detection from browser settings
- [ ] RTL-aware form validation messages
- [ ] RTL-aware date/time formatting
- [ ] RTL-aware number formatting
- [ ] Visual RTL testing tools
- [ ] RTL screenshot comparison tests

## Resources

- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [W3C: Structural markup and right-to-left text](https://www.w3.org/International/questions/qa-html-dir)
- [Material Design: Bidirectionality](https://material.io/design/usability/bidirectionality.html)
