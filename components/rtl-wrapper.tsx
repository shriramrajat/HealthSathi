/**
 * RTL Wrapper Component
 * 
 * This component provides RTL context and utilities to its children.
 * It automatically handles direction-aware styling and layout.
 */

'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { getTextDirection, isRTL, type TextDirection } from '@/lib/i18n/rtl-support';

interface RTLContextValue {
  direction: TextDirection;
  isRTL: boolean;
  locale: string;
}

const RTLContext = createContext<RTLContextValue | undefined>(undefined);

export function useRTLContext() {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error('useRTLContext must be used within RTLWrapper');
  }
  return context;
}

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * RTL Wrapper Component
 * 
 * Wraps children with RTL context and applies direction-aware styling.
 */
export function RTLWrapper({ children, className = '' }: RTLWrapperProps) {
  const locale = useLocale();

  const contextValue = useMemo<RTLContextValue>(
    () => ({
      direction: getTextDirection(locale),
      isRTL: isRTL(locale),
      locale,
    }),
    [locale]
  );

  return (
    <RTLContext.Provider value={contextValue}>
      <div dir={contextValue.direction} className={className}>
        {children}
      </div>
    </RTLContext.Provider>
  );
}

/**
 * RTL-aware container component
 */
interface RTLContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function RTLContainer({ 
  children, 
  className = '', 
  as: Component = 'div' 
}: RTLContainerProps) {
  const { direction } = useRTLContext();

  return (
    <Component dir={direction} className={className}>
      {children}
    </Component>
  );
}

/**
 * RTL-aware text component
 */
interface RTLTextProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  as?: keyof JSX.IntrinsicElements;
}

export function RTLText({ 
  children, 
  className = '', 
  align = 'start',
  as: Component = 'span'
}: RTLTextProps) {
  const { isRTL } = useRTLContext();

  const alignmentClass = useMemo(() => {
    if (align === 'center') return 'text-center';
    if (align === 'start') return isRTL ? 'text-right' : 'text-left';
    if (align === 'end') return isRTL ? 'text-left' : 'text-right';
    return '';
  }, [align, isRTL]);

  return (
    <Component className={`${alignmentClass} ${className}`.trim()}>
      {children}
    </Component>
  );
}

/**
 * RTL-aware icon component
 */
interface RTLIconProps {
  children: React.ReactNode;
  className?: string;
  mirror?: boolean;
  iconName?: string;
}

export function RTLIcon({ 
  children, 
  className = '', 
  mirror = false,
  iconName = ''
}: RTLIconProps) {
  const { isRTL } = useRTLContext();

  const shouldMirror = useMemo(() => {
    if (!isRTL) return false;
    if (mirror) return true;
    
    // Auto-detect if icon should be mirrored based on name
    const mirrorableIcons = ['arrow', 'chevron', 'caret', 'angle', 'forward', 'backward'];
    return mirrorableIcons.some(name => iconName.toLowerCase().includes(name));
  }, [isRTL, mirror, iconName]);

  const mirrorClass = shouldMirror ? 'rtl-mirror' : '';

  return (
    <span className={`inline-flex ${mirrorClass} ${className}`.trim()}>
      {children}
    </span>
  );
}

/**
 * RTL-aware flex container
 */
interface RTLFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  reverse?: boolean;
}

export function RTLFlex({ 
  children, 
  className = '', 
  direction = 'row',
  reverse = false
}: RTLFlexProps) {
  const { isRTL } = useRTLContext();

  const flexClass = useMemo(() => {
    if (direction === 'col') {
      return reverse ? 'flex flex-col-reverse' : 'flex flex-col';
    }
    
    // For row direction, RTL automatically reverses
    if (isRTL) {
      return reverse ? 'flex flex-row' : 'flex flex-row-reverse';
    }
    
    return reverse ? 'flex flex-row-reverse' : 'flex flex-row';
  }, [direction, reverse, isRTL]);

  return (
    <div className={`${flexClass} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * RTL-aware spacing component
 */
interface RTLSpacingProps {
  children: React.ReactNode;
  className?: string;
  start?: string;
  end?: string;
  x?: string;
  y?: string;
}

export function RTLSpacing({ 
  children, 
  className = '', 
  start,
  end,
  x,
  y
}: RTLSpacingProps) {
  const { isRTL } = useRTLContext();

  const spacingClass = useMemo(() => {
    const classes: string[] = [];
    
    if (start) {
      classes.push(isRTL ? `mr-${start}` : `ml-${start}`);
    }
    if (end) {
      classes.push(isRTL ? `ml-${end}` : `mr-${end}`);
    }
    if (x) {
      classes.push(`mx-${x}`);
    }
    if (y) {
      classes.push(`my-${y}`);
    }
    
    return classes.join(' ');
  }, [start, end, x, y, isRTL]);

  return (
    <div className={`${spacingClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
