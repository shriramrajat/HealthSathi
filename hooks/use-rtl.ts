/**
 * RTL Support Hook
 * 
 * This hook provides RTL-aware utilities for React components.
 */

'use client';

import { useLocale } from 'next-intl';
import { useMemo, useCallback } from 'react';
import {
  getTextDirection,
  isRTL,
  getDirectionalClass,
  getDirectionalStyles,
  getDirectionalTailwindClasses,
  directionClass,
  getIconTransform,
  shouldMirrorIcon,
  type TextDirection,
} from '@/lib/i18n/rtl-support';

/**
 * Hook for RTL support
 * 
 * @returns RTL utilities and helpers
 */
export function useRTL() {
  const locale = useLocale();

  const direction = useMemo(() => getTextDirection(locale), [locale]);
  const isRTLMode = useMemo(() => isRTL(locale), [locale]);

  /**
   * Get direction-aware CSS class
   */
  const getClass = useCallback(
    (ltrClass: string, rtlClass: string) => {
      return getDirectionalClass(ltrClass, rtlClass, direction);
    },
    [direction]
  );

  /**
   * Get direction-aware inline styles
   */
  const getStyles = useCallback(
    (styles: Record<string, any>) => {
      return getDirectionalStyles(styles, direction);
    },
    [direction]
  );

  /**
   * Get direction-aware Tailwind classes
   */
  const getTailwindClasses = useCallback(
    (classes: string) => {
      return getDirectionalTailwindClasses(classes, direction);
    },
    [direction]
  );

  /**
   * Create direction-aware className
   */
  const className = useCallback(
    (baseClasses: string, additionalClasses?: string) => {
      return directionClass(baseClasses, direction, additionalClasses);
    },
    [direction]
  );

  /**
   * Get icon transform for RTL
   */
  const getIconStyle = useCallback(
    (iconName: string) => {
      const transform = getIconTransform(iconName, direction);
      return transform ? { transform } : {};
    },
    [direction]
  );

  /**
   * Check if icon should be mirrored
   */
  const shouldMirror = useCallback(
    (iconName: string) => {
      return isRTLMode && shouldMirrorIcon(iconName);
    },
    [isRTLMode]
  );

  /**
   * Get margin/padding helper
   */
  const spacing = useMemo(
    () => ({
      start: (value: string) => (isRTLMode ? `mr-${value}` : `ml-${value}`),
      end: (value: string) => (isRTLMode ? `ml-${value}` : `mr-${value}`),
      x: (value: string) => `mx-${value}`,
      y: (value: string) => `my-${value}`,
    }),
    [isRTLMode]
  );

  /**
   * Get position helper
   */
  const position = useMemo(
    () => ({
      start: (value: string) => (isRTLMode ? `right-${value}` : `left-${value}`),
      end: (value: string) => (isRTLMode ? `left-${value}` : `right-${value}`),
    }),
    [isRTLMode]
  );

  /**
   * Get text alignment helper
   */
  const textAlign = useMemo(
    () => ({
      start: isRTLMode ? 'text-right' : 'text-left',
      end: isRTLMode ? 'text-left' : 'text-right',
      center: 'text-center',
    }),
    [isRTLMode]
  );

  /**
   * Get border helper
   */
  const border = useMemo(
    () => ({
      start: (value: string) => (isRTLMode ? `border-r-${value}` : `border-l-${value}`),
      end: (value: string) => (isRTLMode ? `border-l-${value}` : `border-r-${value}`),
    }),
    [isRTLMode]
  );

  /**
   * Get rounded corner helper
   */
  const rounded = useMemo(
    () => ({
      start: (value: string) => (isRTLMode ? `rounded-r-${value}` : `rounded-l-${value}`),
      end: (value: string) => (isRTLMode ? `rounded-l-${value}` : `rounded-r-${value}`),
      topStart: (value: string) => (isRTLMode ? `rounded-tr-${value}` : `rounded-tl-${value}`),
      topEnd: (value: string) => (isRTLMode ? `rounded-tl-${value}` : `rounded-tr-${value}`),
      bottomStart: (value: string) => (isRTLMode ? `rounded-br-${value}` : `rounded-bl-${value}`),
      bottomEnd: (value: string) => (isRTLMode ? `rounded-bl-${value}` : `rounded-br-${value}`),
    }),
    [isRTLMode]
  );

  return {
    direction,
    isRTL: isRTLMode,
    locale,
    getClass,
    getStyles,
    getTailwindClasses,
    className,
    getIconStyle,
    shouldMirror,
    spacing,
    position,
    textAlign,
    border,
    rounded,
  };
}

/**
 * Hook for direction-aware animations
 */
export function useRTLAnimation() {
  const { isRTL } = useRTL();

  const getSlideDirection = useCallback(
    (direction: 'left' | 'right') => {
      if (isRTL) {
        return direction === 'left' ? 'right' : 'left';
      }
      return direction;
    },
    [isRTL]
  );

  const getTransformX = useCallback(
    (value: number) => {
      return isRTL ? -value : value;
    },
    [isRTL]
  );

  return {
    getSlideDirection,
    getTransformX,
    isRTL,
  };
}
