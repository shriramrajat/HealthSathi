/**
 * Firebase Performance Monitoring and Optimization Utilities
 * Provides tools for monitoring Firebase operations and optimizing performance
 */

import { getFirebasePerformanceMetrics } from './firebase'

// Performance tracking interface
interface PerformanceMetric {
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

// Global performance store
class FirebasePerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100 // Keep last 100 metrics
  private listeners: ((metric: PerformanceMetric) => void)[] = []

  /**
   * Start tracking a Firebase operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const metric: PerformanceMetric = {
      operation: `${operation}_${id}`,
      startTime: performance.now(),
      success: false,
      metadata
    }

    this.metrics.push(metric)
    return metric.operation
  }

  /**
   * End tracking a Firebase operation
   */
  endOperation(operationId: string, success: boolean = true, error?: string) {
    const metric = this.metrics.find(m => m.operation === operationId)
    if (!metric) return

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    metric.success = success
    metric.error = error

    // Notify listeners
    this.listeners.forEach(listener => listener(metric))

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
      console.warn(`Slow Firebase operation detected: ${operationId} took ${metric.duration.toFixed(2)}ms`)
    }

    // Cleanup old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined)
    
    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        slowOperations: 0,
        errorRate: 0
      }
    }

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    const successfulOperations = completedMetrics.filter(m => m.success).length
    const slowOperations = completedMetrics.filter(m => (m.duration || 0) > 1000).length
    const errorOperations = completedMetrics.filter(m => !m.success).length

    return {
      totalOperations: completedMetrics.length,
      averageDuration: totalDuration / completedMetrics.length,
      successRate: (successfulOperations / completedMetrics.length) * 100,
      slowOperations,
      errorRate: (errorOperations / completedMetrics.length) * 100,
      metrics: completedMetrics.slice(-10) // Last 10 operations
    }
  }

  /**
   * Add performance listener
   */
  addListener(listener: (metric: PerformanceMetric) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new FirebasePerformanceMonitor()

/**
 * Decorator for tracking Firebase operations
 */
export function trackFirebaseOperation(operationName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const operationId = performanceMonitor.startOperation(
        `${operationName}.${propertyKey}`,
        { args: args.length }
      )

      try {
        const result = await originalMethod.apply(this, args)
        performanceMonitor.endOperation(operationId, true)
        return result
      } catch (error) {
        performanceMonitor.endOperation(
          operationId, 
          false, 
          error instanceof Error ? error.message : 'Unknown error'
        )
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Higher-order function for tracking async operations
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const operationId = performanceMonitor.startOperation(operationName, {
      args: args.length
    })

    try {
      const result = await fn(...args)
      performanceMonitor.endOperation(operationId, true)
      return result
    } catch (error) {
      performanceMonitor.endOperation(
        operationId,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }) as T
}

/**
 * Firebase query optimization utilities
 */
export class FirestoreQueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Cache query results with TTL
   */
  static cacheQuery(queryKey: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Cleanup expired entries
    this.cleanupExpiredCache()
  }

  /**
   * Get cached query result
   */
  static getCachedQuery(queryKey: string): any | null {
    const cached = this.queryCache.get(queryKey)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(queryKey)
      return null
    }

    return cached.data
  }

  /**
   * Generate query key from parameters
   */
  static generateQueryKey(collection: string, filters: any[], orderBy?: any[]): string {
    const filterStr = filters.map(f => `${f.field}${f.op}${f.value}`).join('|')
    const orderStr = orderBy?.map(o => `${o.field}${o.direction}`).join('|') || ''
    return `${collection}:${filterStr}:${orderStr}`
  }

  /**
   * Cleanup expired cache entries
   */
  private static cleanupExpiredCache() {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key)
      }
    }
  }

  /**
   * Clear all cached queries
   */
  static clearCache() {
    this.queryCache.clear()
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: this.queryCache.size,
      entries: Array.from(this.queryCache.keys())
    }
  }
}

/**
 * Firebase connection status monitor
 */
export class FirebaseConnectionMonitor {
  private static listeners: ((status: boolean) => void)[] = []
  private static isConnected = true
  private static checkInterval: NodeJS.Timeout | null = null

  /**
   * Start monitoring Firebase connection
   */
  static startMonitoring() {
    if (this.checkInterval) return

    this.checkInterval = setInterval(async () => {
      try {
        // Simple connectivity check using Firestore
        const { getFirebaseFirestore } = await import('./firebase')
        const db = await getFirebaseFirestore()
        
        // Try to read from a system collection (lightweight operation)
        const { doc, getDoc } = await import('firebase/firestore')
        await getDoc(doc(db, 'system_settings', 'connectivity_check'))
        
        this.setConnectionStatus(true)
      } catch (error) {
        this.setConnectionStatus(false)
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Stop monitoring Firebase connection
   */
  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Set connection status and notify listeners
   */
  private static setConnectionStatus(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected
      this.listeners.forEach(listener => listener(connected))
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Firebase connection status: ${connected ? 'Connected' : 'Disconnected'}`)
      }
    }
  }

  /**
   * Add connection status listener
   */
  static addListener(listener: (status: boolean) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current connection status
   */
  static getConnectionStatus(): boolean {
    return this.isConnected
  }
}

/**
 * React hook for Firebase performance monitoring
 */
export function useFirebasePerformance() {
  const [stats, setStats] = React.useState(performanceMonitor.getStats())
  const [connectionStatus, setConnectionStatus] = React.useState(
    FirebaseConnectionMonitor.getConnectionStatus()
  )

  React.useEffect(() => {
    // Update stats when new metrics are added
    const unsubscribeMetrics = performanceMonitor.addListener(() => {
      setStats(performanceMonitor.getStats())
    })

    // Monitor connection status
    const unsubscribeConnection = FirebaseConnectionMonitor.addListener(setConnectionStatus)
    FirebaseConnectionMonitor.startMonitoring()

    return () => {
      unsubscribeMetrics()
      unsubscribeConnection()
    }
  }, [])

  return {
    stats,
    connectionStatus,
    clearMetrics: () => performanceMonitor.clear(),
    clearCache: () => FirestoreQueryOptimizer.clearCache()
  }
}

// Import React for the hook
import React from 'react'

/**
 * Performance monitoring component for development
 */
export function FirebasePerformanceDebugger() {
  const { stats, connectionStatus } = useFirebasePerformance()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return React.createElement('div', {
    className: "fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm"
  }, [
    React.createElement('h3', {
      key: 'title',
      className: "font-bold mb-2"
    }, 'Firebase Performance'),
    React.createElement('div', {
      key: 'stats',
      className: "space-y-1"
    }, [
      React.createElement('div', { key: 'connection' }, `Connection: ${connectionStatus ? '🟢 Connected' : '🔴 Disconnected'}`),
      React.createElement('div', { key: 'operations' }, `Operations: ${stats.totalOperations}`),
      React.createElement('div', { key: 'duration' }, `Avg Duration: ${stats.averageDuration.toFixed(2)}ms`),
      React.createElement('div', { key: 'success' }, `Success Rate: ${stats.successRate.toFixed(1)}%`),
      React.createElement('div', { key: 'slow' }, `Slow Ops: ${stats.slowOperations}`),
      React.createElement('div', { key: 'error' }, `Error Rate: ${stats.errorRate.toFixed(1)}%`)
    ])
  ])
}