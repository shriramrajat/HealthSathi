/**
 * Performance Monitoring Utilities for Core Web Vitals
 * Provides tools for measuring and reporting Core Web Vitals metrics
 */

// Core Web Vitals metric types
export interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'TTI'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  timestamp: number
  url: string
}

// Performance report interface
export interface PerformanceReport {
  timestamp: number
  url: string
  userAgent: string
  connection?: string
  metrics: WebVitalMetric[]
  customMetrics: Record<string, number>
  errors: string[]
}

// Thresholds for Core Web Vitals (in milliseconds)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  TTI: { good: 3800, poor: 7300 }
} as const

// Global performance store
class PerformanceMonitor {
  private metrics: WebVitalMetric[] = []
  private customMetrics: Record<string, number> = {}
  private errors: string[] = []
  private observers: PerformanceObserver[] = []
  private listeners: ((metric: WebVitalMetric) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  /**
   * Initialize performance observers for Core Web Vitals
   */
  private initializeObservers() {
    try {
      // First Contentful Paint (FCP)
      this.observePaintMetrics()
      
      // Largest Contentful Paint (LCP)
      this.observeLCP()
      
      // First Input Delay (FID)
      this.observeFID()
      
      // Cumulative Layout Shift (CLS)
      this.observeCLS()
      
      // Time to First Byte (TTFB)
      this.observeTTFB()
      
      // Time to Interactive (TTI) - custom implementation
      this.observeTTI()
    } catch (error) {
      this.addError(`Failed to initialize performance observers: ${error}`)
    }
  }

  /**
   * Observe paint metrics (FCP)
   */
  private observePaintMetrics() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime)
          }
        }
      })
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (error) {
      this.addError(`FCP observer error: ${error}`)
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          this.recordMetric('LCP', lastEntry.startTime)
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    } catch (error) {
      this.addError(`LCP observer error: ${error}`)
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFID() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any // Type assertion for first-input entries
          if (fidEntry.processingStart && fidEntry.startTime) {
            const fid = fidEntry.processingStart - fidEntry.startTime
            this.recordMetric('FID', fid)
          }
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (error) {
      this.addError(`FID observer error: ${error}`)
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  private observeCLS() {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.recordMetric('CLS', clsValue)
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    } catch (error) {
      this.addError(`CLS observer error: ${error}`)
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   */
  private observeTTFB() {
    if (typeof window === 'undefined' || !window.performance?.timing) return

    try {
      const { timing } = window.performance
      const ttfb = timing.responseStart - timing.navigationStart
      if (ttfb > 0) {
        this.recordMetric('TTFB', ttfb)
      }
    } catch (error) {
      this.addError(`TTFB calculation error: ${error}`)
    }
  }

  /**
   * Observe Time to Interactive (TTI) - simplified implementation
   */
  private observeTTI() {
    if (typeof window === 'undefined') return

    try {
      // Wait for page load and then calculate TTI
      if (document.readyState === 'complete') {
        this.calculateTTI()
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => this.calculateTTI(), 100)
        })
      }
    } catch (error) {
      this.addError(`TTI calculation error: ${error}`)
    }
  }

  /**
   * Calculate Time to Interactive (simplified)
   */
  private calculateTTI() {
    try {
      const { timing } = window.performance
      if (!timing) return

      // Simplified TTI calculation: domContentLoaded + 50ms buffer for main thread quiet
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
      const tti = domContentLoaded + 50 // Add small buffer
      
      this.recordMetric('TTI', tti)
    } catch (error) {
      this.addError(`TTI calculation failed: ${error}`)
    }
  }

  /**
   * Record a Core Web Vital metric
   */
  private recordMetric(name: WebVitalMetric['name'], value: number) {
    const rating = this.getRating(name, value)
    const metric: WebVitalMetric = {
      name,
      value,
      rating,
      delta: value, // For simplicity, delta equals value in this implementation
      id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    this.metrics.push(metric)
    this.listeners.forEach(listener => listener(metric))

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${value.toFixed(2)}ms (${rating})`)
    }
  }

  /**
   * Get rating for a metric value
   */
  private getRating(name: WebVitalMetric['name'], value: number): WebVitalMetric['rating'] {
    const threshold = THRESHOLDS[name]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Add custom metric
   */
  addCustomMetric(name: string, value: number) {
    this.customMetrics[name] = value
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Custom metric ${name}: ${value}`)
    }
  }

  /**
   * Add error to report
   */
  private addError(error: string) {
    this.errors.push(error)
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Performance monitoring error: ${error}`)
    }
  }

  /**
   * Get current performance report
   */
  getReport(): PerformanceReport {
    return {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: this.getConnectionInfo(),
      metrics: [...this.metrics],
      customMetrics: { ...this.customMetrics },
      errors: [...this.errors]
    }
  }

  /**
   * Get connection information
   */
  private getConnectionInfo(): string | undefined {
    if (typeof navigator === 'undefined') return undefined
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      return `${connection.effectiveType || 'unknown'} (${connection.downlink || 'unknown'}Mbps)`
    }
    return undefined
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary: Record<string, { value: number; rating: string }> = {}
    
    // Get latest metric for each type
    for (const metricName of ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'TTI'] as const) {
      const latestMetric = this.metrics
        .filter(m => m.name === metricName)
        .sort((a, b) => b.timestamp - a.timestamp)[0]
      
      if (latestMetric) {
        summary[metricName] = {
          value: latestMetric.value,
          rating: latestMetric.rating
        }
      }
    }

    return {
      coreWebVitals: summary,
      customMetrics: this.customMetrics,
      errorCount: this.errors.length,
      overallScore: this.calculateOverallScore(summary)
    }
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculateOverallScore(summary: Record<string, { rating: string }>): number {
    const ratings = Object.values(summary).map(m => m.rating)
    if (ratings.length === 0) return 0

    const scores: number[] = ratings.map(rating => {
      switch (rating) {
        case 'good': return 100
        case 'needs-improvement': return 60
        case 'poor': return 20
        default: return 0
      }
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  /**
   * Add performance listener
   */
  addListener(listener: (metric: WebVitalMetric) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear all metrics and errors
   */
  clear() {
    this.metrics = []
    this.customMetrics = {}
    this.errors = []
  }

  /**
   * Disconnect all observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Measure function execution time
 */
export function measureExecutionTime<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const start = performance.now()
    const result = fn(...args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start
        performanceMonitor.addCustomMetric(`${name}_duration`, duration)
      })
    } else {
      const duration = performance.now() - start
      performanceMonitor.addCustomMetric(`${name}_duration`, duration)
      return result
    }
  }) as T
}

/**
 * Performance timing decorator
 */
export function performanceTiming(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const start = performance.now()
      const result = originalMethod.apply(this, args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          performanceMonitor.addCustomMetric(`${name}.${propertyKey}`, duration)
        })
      } else {
        const duration = performance.now() - start
        performanceMonitor.addCustomMetric(`${name}.${propertyKey}`, duration)
        return result
      }
    }

    return descriptor
  }
}

/**
 * Mark performance milestone
 */
export function markPerformanceMilestone(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
    performanceMonitor.addCustomMetric(`milestone_${name}`, performance.now())
  }
}

/**
 * Measure performance between two marks
 */
export function measurePerformanceBetweenMarks(name: string, startMark: string, endMark: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure) {
        performanceMonitor.addCustomMetric(`measure_${name}`, measure.duration)
      }
    } catch (error) {
      console.warn(`Failed to measure performance between marks: ${error}`)
    }
  }
}

/**
 * Get performance navigation timing
 */
export function getNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance?.timing) {
    return null
  }

  const timing = window.performance.timing
  return {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    ssl: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
    ttfb: timing.responseStart - timing.navigationStart,
    download: timing.responseEnd - timing.responseStart,
    domProcessing: timing.domComplete - timing.domLoading,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart
  }
}

/**
 * Export performance data as JSON
 */
export function exportPerformanceData(): string {
  const report = performanceMonitor.getReport()
  const navigationTiming = getNavigationTiming()
  
  return JSON.stringify({
    ...report,
    navigationTiming
  }, null, 2)
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') {
    return {
      metrics: [],
      summary: { coreWebVitals: {}, customMetrics: {}, errorCount: 0, overallScore: 0 },
      report: null,
      clearMetrics: () => {},
      exportData: () => '{}'
    }
  }

  const [metrics, setMetrics] = React.useState<WebVitalMetric[]>([])
  const [summary, setSummary] = React.useState(performanceMonitor.getSummary())

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.addListener((metric) => {
      setMetrics(prev => [...prev, metric])
      setSummary(performanceMonitor.getSummary())
    })

    // Initial load
    setMetrics(performanceMonitor.getReport().metrics)
    setSummary(performanceMonitor.getSummary())

    return unsubscribe
  }, [])

  return {
    metrics,
    summary,
    report: performanceMonitor.getReport(),
    clearMetrics: () => {
      performanceMonitor.clear()
      setMetrics([])
      setSummary(performanceMonitor.getSummary())
    },
    exportData: exportPerformanceData
  }
}

// Import React for the hook
import React from 'react'