/**
 * RTL (Right-to-Left) Layout Support Utilities
 * 
 * This module provides utilities for handling RTL languages like Arabic, Hebrew, etc.
 * It includes direction detection, CSS class generation, and layout mirroring support.
 */

import { isRTLLanguage, getLanguageDirection } from './languages';

export type TextDirection = 'ltr' | 'rtl';

/**
 * Get the text direction for a given locale
 */
export function getTextDirection(locale: string): TextDirection {
  return getLanguageDirection(locale);
}

/**
 * Check if a locale uses RTL direction
 */
export function isRTL(locale: string): boolean {
  return isRTLLanguage(locale);
}

/**
 * Get the opposite direction
 */
export function getOppositeDirection(direction: TextDirection): TextDirection {
  return direction === 'ltr' ? 'rtl' : 'ltr';
}

/**
 * Get direction-aware CSS classes
 * 
 * This function returns CSS classes that adapt to the text direction.
 * For example, 'ml-4' becomes 'mr-4' in RTL mode.
 */
export function getDirectionalClass(
  ltrClass: string,
  rtlClass: string,
  direction: TextDirection
): string {
  return direction === 'rtl' ? rtlClass : ltrClass;
}

/**
 * Convert logical properties to physical properties based on direction
 * 
 * Logical properties (start/end) are converted to physical properties (left/right)
 * based on the text direction.
 */
export function getPhysicalProperty(
  logicalProperty: 'start' | 'end',
  direction: TextDirection
): 'left' | 'right' {
  if (direction === 'rtl') {
    return logicalProperty === 'start' ? 'right' : 'left';
  }
  return logicalProperty === 'start' ? 'left' : 'right';
}

/**
 * Generate direction-aware inline styles
 */
export function getDirectionalStyles(
  styles: Record<string, any>,
  direction: TextDirection
): Record<string, any> {
  const directionStyles: Record<string, any> = { ...styles };

  // Swap left/right properties in RTL mode
  if (direction === 'rtl') {
    // Swap margin
    if ('marginLeft' in styles) {
      directionStyles.marginRight = styles.marginLeft;
      delete directionStyles.marginLeft;
    }
    if ('marginRight' in styles) {
      directionStyles.marginLeft = styles.marginRight;
      delete directionStyles.marginRight;
    }

    // Swap padding
    if ('paddingLeft' in styles) {
      directionStyles.paddingRight = styles.paddingLeft;
      delete directionStyles.paddingLeft;
    }
    if ('paddingRight' in styles) {
      directionStyles.paddingLeft = styles.paddingRight;
      delete directionStyles.paddingRight;
    }

    // Swap border
    if ('borderLeft' in styles) {
      directionStyles.borderRight = styles.borderLeft;
      delete directionStyles.borderLeft;
    }
    if ('borderRight' in styles) {
      directionStyles.borderLeft = styles.borderRight;
      delete directionStyles.borderRight;
    }

    // Swap position
    if ('left' in styles) {
      directionStyles.right = styles.left;
      delete directionStyles.left;
    }
    if ('right' in styles) {
      directionStyles.left = styles.right;
      delete directionStyles.right;
    }

    // Reverse text-align
    if (styles.textAlign === 'left') {
      directionStyles.textAlign = 'right';
    } else if (styles.textAlign === 'right') {
      directionStyles.textAlign = 'left';
    }

    // Reverse float
    if (styles.float === 'left') {
      directionStyles.float = 'right';
    } else if (styles.float === 'right') {
      directionStyles.float = 'left';
    }

    // Reverse transform for translateX
    if (styles.transform && typeof styles.transform === 'string') {
      directionStyles.transform = styles.transform.replace(
        /translateX\((-?\d+(?:\.\d+)?(?:px|%|rem|em)?)\)/g,
        (match, value) => {
          const numValue = parseFloat(value);
          const unit = value.replace(/^-?\d+(?:\.\d+)?/, '');
          return `translateX(${-numValue}${unit})`;
        }
      );
    }
  }

  return directionStyles;
}

/**
 * Get Tailwind CSS classes for RTL support
 * 
 * This function converts standard Tailwind classes to their RTL equivalents.
 * For example: 'ml-4' -> 'mr-4' in RTL mode
 */
export function getDirectionalTailwindClasses(
  classes: string,
  direction: TextDirection
): string {
  if (direction === 'ltr') {
    return classes;
  }

  // Split classes and process each one
  const classArray = classes.split(' ');
  const rtlClasses = classArray.map(cls => {
    // Margin classes
    if (cls.startsWith('ml-')) return cls.replace('ml-', 'mr-');
    if (cls.startsWith('mr-')) return cls.replace('mr-', 'ml-');
    if (cls.startsWith('-ml-')) return cls.replace('-ml-', '-mr-');
    if (cls.startsWith('-mr-')) return cls.replace('-mr-', '-ml-');

    // Padding classes
    if (cls.startsWith('pl-')) return cls.replace('pl-', 'pr-');
    if (cls.startsWith('pr-')) return cls.replace('pr-', 'pl-');

    // Border classes
    if (cls.startsWith('border-l-')) return cls.replace('border-l-', 'border-r-');
    if (cls.startsWith('border-r-')) return cls.replace('border-r-', 'border-l-');

    // Rounded corners
    if (cls.startsWith('rounded-l-')) return cls.replace('rounded-l-', 'rounded-r-');
    if (cls.startsWith('rounded-r-')) return cls.replace('rounded-r-', 'rounded-l-');
    if (cls.startsWith('rounded-tl-')) return cls.replace('rounded-tl-', 'rounded-tr-');
    if (cls.startsWith('rounded-tr-')) return cls.replace('rounded-tr-', 'rounded-tl-');
    if (cls.startsWith('rounded-bl-')) return cls.replace('rounded-bl-', 'rounded-br-');
    if (cls.startsWith('rounded-br-')) return cls.replace('rounded-br-', 'rounded-bl-');

    // Text alignment
    if (cls === 'text-left') return 'text-right';
    if (cls === 'text-right') return 'text-left';

    // Position classes
    if (cls.startsWith('left-')) return cls.replace('left-', 'right-');
    if (cls.startsWith('right-')) return cls.replace('right-', 'left-');
    if (cls.startsWith('-left-')) return cls.replace('-left-', '-right-');
    if (cls.startsWith('-right-')) return cls.replace('-right-', '-left-');

    // Inset classes
    if (cls.startsWith('inset-x-')) return cls; // No change needed
    if (cls.startsWith('start-')) return cls.replace('start-', 'end-');
    if (cls.startsWith('end-')) return cls.replace('end-', 'start-');

    // Space between
    if (cls.startsWith('space-x-reverse')) return cls;
    if (cls.startsWith('space-x-')) return `${cls} space-x-reverse`;

    // Divide
    if (cls.startsWith('divide-x-reverse')) return cls;
    if (cls.startsWith('divide-x-')) return `${cls} divide-x-reverse`;

    return cls;
  });

  return rtlClasses.join(' ');
}

/**
 * Create a direction-aware className helper
 */
export function directionClass(
  baseClasses: string,
  direction: TextDirection,
  additionalClasses?: string
): string {
  const dirClasses = getDirectionalTailwindClasses(baseClasses, direction);
  return additionalClasses ? `${dirClasses} ${additionalClasses}` : dirClasses;
}

/**
 * Get HTML dir attribute value
 */
export function getHtmlDir(locale: string): 'ltr' | 'rtl' {
  return getTextDirection(locale);
}

/**
 * Get document direction class for global styling
 */
export function getDocumentDirectionClass(locale: string): string {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Mirror icon rotation for RTL
 * 
 * Some icons need to be mirrored in RTL mode (e.g., arrows, chevrons)
 */
export function shouldMirrorIcon(iconName: string): boolean {
  const mirrorableIcons = [
    'arrow',
    'chevron',
    'caret',
    'angle',
    'forward',
    'backward',
    'next',
    'previous',
    'redo',
    'undo',
  ];

  return mirrorableIcons.some(name => 
    iconName.toLowerCase().includes(name)
  );
}

/**
 * Get icon transform style for RTL
 */
export function getIconTransform(iconName: string, direction: TextDirection): string {
  if (direction === 'rtl' && shouldMirrorIcon(iconName)) {
    return 'scaleX(-1)';
  }
  return '';
}
