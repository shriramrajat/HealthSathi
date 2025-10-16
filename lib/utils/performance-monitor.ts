'use client'

import React from 'react'
import { useEffect, useRef, useCallback } from 'react'

// Performance metrics interface
export interface PerformanceMetrics {
  componentName: string
  renderTime: number
  mountTime: number
  updateCount: number
  memoryUsage?: number
  timestamp: number
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private observers: Array<(metrics: PerformanceMetrics) => void> = []

  // Record component performance
  recordMetric(metric: PerformanceMetrics) {
    this.metrics.set(metric.componentName, metric)
    this.observers.forEach(observer => observer(metric))
  }

  // Get metrics for a component
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName)
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  // Subscribe to metric updates
  subscribe(observer: (metrics: PerformanceMetrics) => void) {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  // Clear metrics
  clear() {
    this.metrics.clear()
  }

  // Get performance summary
  getSummary() {
    const metrics = this.getAllMetrics()
    if (metrics.length === 0) return null

    const totalRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0)
    const avgRenderTime = totalRenderTime / metrics.length
    const slowestComponent = metrics.reduce((prev, current) => 
      prev.renderTime > current.renderTime ? prev : current
    )

    return {
      totalComponents: metrics.length,
      totalRenderTime,
      avgRenderTime,
      slowestComponent: slowestComponent.componentName,
      slowestRenderTime: slowestComponent.renderTime,
      lastUpdated: new Date()
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0)
  const mountStartTime = useRef<number>(0)
  const updateCount = useRef<number>(0)
  const isFirstRender = useRef<boolean>(true)

  // Start timing on component mount/render
  useEffect(() => {
    if (isFirstRender.current) {
      mountStartTime.current = performance.now()
      isFirstRender.current = false
    }
    renderStartTime.current = performance.now()
  })

  // Record metrics after render
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    const mountTime = isFirstRender.current ? 0 : performance.now() - mountStartTime.current
    updateCount.current += 1

    // Get memory usage if available
    let memoryUsage: number | undefined
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage = memory.usedJSHeapSize
    }

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      mountTime,
      updateCount: updateCount.current,
      memoryUsage,
      timestamp: Date.now()
    }

    performanceMonitor.recordMetric(metrics)
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Record final metrics on unmount
      const finalMetrics = performanceMonitor.getMetrics(componentName)
      if (finalMetrics) {
        console.log(`Component ${componentName} performance:`, finalMetrics)
      }
    }
  }, [componentName])

  return {
    getMetrics: () => performanceMonitor.getMetrics(componentName),
    getAllMetrics: () => performanceMonitor.getAllMetrics(),
    getSummary: () => performanceMonitor.getSummary()
  }
}

// Hook for performance alerts
export function usePerformanceAlerts(thresholds: {
  renderTime?: number
  memoryUsage?: number
}) {
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      // Check render time threshold
      if (thresholds.renderTime && metrics.renderTime > thresholds.renderTime) {
        console.warn(
          `Performance Alert: ${metrics.componentName} render time (${metrics.renderTime.toFixed(2)}ms) exceeds threshold (${thresholds.renderTime}ms)`
        )
      }

      // Check memory usage threshold
      if (thresholds.memoryUsage && metrics.memoryUsage && metrics.memoryUsage > thresholds.memoryUsage) {
        console.warn(
          `Performance Alert: ${metrics.componentName} memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB)`
        )
      }
    })

    return unsubscribe
  }, [thresholds])
}

// Utility function to measure async operations
export function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now()
  
  return operation().finally(() => {
    const duration = performance.now() - startTime
    console.log(`Async operation "${operationName}" took ${duration.toFixed(2)}ms`)
  })
}

// Utility function to debounce expensive operations
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

// Component wrapper for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown'
    usePerformanceMonitor(name)
    
    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`
  
  return WrappedComponent
}