'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Touch-friendly button component with larger touch targets
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground'
    }

    const sizes = {
      sm: 'h-10 px-4 py-2 text-sm', // Minimum 44px touch target
      md: 'h-12 px-6 py-3 text-base', // 48px touch target
      lg: 'h-14 px-8 py-4 text-lg' // 56px touch target
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'touch-manipulation', // Optimize for touch
          'active:scale-95 transition-transform', // Touch feedback
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TouchButton.displayName = 'TouchButton'

// Swipeable card component
interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  swipeThreshold?: number
}

export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  className,
  swipeThreshold = 100 
}: SwipeableCardProps) => {
  const [startX, setStartX] = useState<number | null>(null)
  const [currentX, setCurrentX] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX || !isDragging) return
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!startX || !currentX || !isDragging) {
      setStartX(null)
      setCurrentX(null)
      setIsDragging(false)
      return
    }

    const diffX = currentX - startX

    if (Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }

    setStartX(null)
    setCurrentX(null)
    setIsDragging(false)
  }

  const translateX = isDragging && startX && currentX ? currentX - startX : 0

  return (
    <div
      ref={cardRef}
      className={cn(
        'transition-transform duration-200 ease-out touch-pan-y',
        className
      )}
      style={{
        transform: `translateX(${Math.max(-50, Math.min(50, translateX))}px)`,
        opacity: isDragging ? 0.9 : 1
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  refreshThreshold?: number
  className?: string
}

export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  refreshThreshold = 80,
  className 
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || containerRef.current?.scrollTop !== 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, refreshThreshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setStartY(null)
    setPullDistance(0)
  }

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1)

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto touch-pan-x', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200"
          style={{ 
            height: `${pullDistance}px`,
            transform: `translateY(-${Math.max(0, refreshThreshold - pullDistance)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <div 
              className={cn(
                'w-4 h-4 border-2 border-current rounded-full transition-all duration-200',
                isRefreshing ? 'animate-spin border-t-transparent' : '',
                refreshProgress >= 1 ? 'text-primary' : ''
              )}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`
              }}
            />
            <span className="text-sm">
              {isRefreshing ? 'Refreshing...' : 
               refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}

// Mobile-optimized modal/dialog
interface MobileDialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export const MobileDialog = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className 
}: MobileDialogProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className={cn(
        'relative w-full max-w-lg mx-4 bg-background rounded-t-lg sm:rounded-lg shadow-lg',
        'max-h-[90vh] sm:max-h-[80vh] overflow-hidden',
        'animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 sm:zoom-in-95',
        'duration-300 ease-out',
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="overflow-auto max-h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

// Touch-optimized input with better mobile UX
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TouchInput = React.forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'touch-manipulation', // Optimize for touch
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
TouchInput.displayName = 'TouchInput'