"use client"

import { useEffect, useState, useCallback, useRef } from 'react'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  
  // Custom metrics
  componentLoadTime: number
  renderTime: number
  memoryUsage: number
  networkLatency: number
  
  // Healthcare-specific metrics
  dashboardLoadTime: number
  queryResponseTime: number
  cacheHitRate: number
}



interface NetworkMetrics {
  latency: number
  bandwidth: number
  connectionType: string
  isOnline: boolean
}

export function usePerformanceMonitor(componentName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    componentLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    dashboardLoadTime: 0,
    queryResponseTime: 0,
    cacheHitRate: 0
  })

  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    latency: 0,
    bandwidth: 0,
    connectionType: 'unknown',
    isOnline: navigator.onLine
  })

  const renderStartTime = useRef<number>(0)
  const componentMountTime = useRef<number>(0)
  const renderCount = useRef<number>(0)
  const renderTimes = useRef<number[]>([])

  // Initialize performance monitoring
  useEffect(() => {
    componentMountTime.current = performance.now()

    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      // This would require web-vitals library
      // For now, we'll use Performance Observer API
      
      // Monitor LCP
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1] as any
            setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

          // Monitor FID
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }))
            })
          })
          fidObserver.observe({ entryTypes: ['first-input'] })

          // Monitor CLS
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            })
            setMetrics(prev => ({ ...prev, cls: clsValue }))
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })

          return () => {
            lcpObserver.disconnect()
            fidObserver.disconnect()
            clsObserver.disconnect()
          }
        } catch (error) {
          console.warn('Performance Observer not fully supported:', error)
        }
      }
    }

    // Monitor network status
    const handleOnline = () => setNetworkMetrics(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setNetworkMetrics(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Monitor connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setNetworkMetrics(prev => ({
        ...prev,
        connectionType: connection.effectiveType || 'unknown',
        bandwidth: connection.downlink || 0
      }))

      const handleConnectionChange = () => {
        setNetworkMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
          bandwidth: connection.downlink || 0
        }))
      }

      connection.addEventListener('change', handleConnectionChange)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }))
      }
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Track render performance
  useEffect(() => {
    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    const renderEndTime = performance.now()
    const renderTime = renderEndTime - renderStartTime.current
    
    renderCount.current += 1
    renderTimes.current.push(renderTime)
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift()
    }

    setMetrics(prev => ({
      ...prev,
      renderTime: renderTime,
      componentLoadTime: renderEndTime - componentMountTime.current
    }))

    // Log performance data for healthcare components
    if (componentName && renderTime > 100) { // Log slow renders
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  })

  // Measure network latency
  const measureNetworkLatency = useCallback(async () => {
    const startTime = performance.now()
    try {
      // Use a small image or API endpoint to measure latency
      await fetch('/api/health-check', { method: 'HEAD' })
      const latency = performance.now() - startTime
      setNetworkMetrics(prev => ({ ...prev, latency }))
      return latency
    } catch (error) {
      console.warn('Failed to measure network latency:', error)
      return -1
    }
  }, [])

  // Measure query performance
  const measureQueryTime = useCallback(async <T>(
    queryFn: () => Promise<T>,
    queryName?: string
  ): Promise<T> => {
    const startTime = performance.now()
    try {
      const result = await queryFn()
      const queryTime = performance.now() - startTime
      
      setMetrics(prev => ({
        ...prev,
        queryResponseTime: queryTime
      }))

      if (queryName && queryTime > 1000) { // Log slow queries
        console.warn(`Slow query detected (${queryName}): ${queryTime.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const queryTime = performance.now() - startTime
      console.error(`Query failed after ${queryTime.toFixed(2)}ms:`, error)
      throw error
    }
  }, [])

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const summary = {
      component: componentName || 'Unknown',
      renderCount: renderCount.current,
      averageRenderTime: renderTimes.current.length > 0 
        ? renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length 
        : 0,
      totalLoadTime: metrics.componentLoadTime,
      memoryUsage: metrics.memoryUsage,
      networkLatency: networkMetrics.latency,
      isOnline: networkMetrics.isOnline,
      connectionType: networkMetrics.connectionType,
      coreWebVitals: {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls
      }
    }

    return summary
  }, [componentName, metrics, networkMetrics])

  // Performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations: string[] = []

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Consider optimizing images and reducing server response time (LCP > 2.5s)')
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Consider reducing JavaScript execution time (FID > 100ms)')
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Consider adding size attributes to images and ads (CLS > 0.1)')
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('High memory usage detected. Consider optimizing component state and cleanup.')
    }

    if (networkMetrics.latency > 500) {
      recommendations.push('High network latency detected. Consider implementing offline support.')
    }

    if (renderTimes.current.some(time => time > 16)) {
      recommendations.push('Some renders are taking longer than 16ms. Consider optimizing render logic.')
    }

    return recommendations
  }, [metrics, networkMetrics])

  // Healthcare-specific performance checks
  const getHealthcarePerformanceStatus = useCallback(() => {
    const status = {
      critical: false,
      warnings: [] as string[],
      recommendations: [] as string[]
    }

    // Critical performance issues for healthcare
    if (metrics.queryResponseTime > 3000) {
      status.critical = true
      status.warnings.push('Database queries are taking too long (>3s). This may affect patient care.')
    }

    if (!networkMetrics.isOnline) {
      status.critical = true
      status.warnings.push('Network connection lost. Offline mode should be enabled.')
    }

    if (metrics.memoryUsage > 100) {
      status.warnings.push('High memory usage may cause application crashes.')
    }

    // Healthcare-specific recommendations
    if (networkMetrics.connectionType === 'slow-2g' || networkMetrics.connectionType === '2g') {
      status.recommendations.push('Slow connection detected. Enable data compression and reduce image sizes.')
    }

    if (metrics.componentLoadTime > 2000) {
      status.recommendations.push('Component loading is slow. Consider lazy loading non-critical components.')
    }

    return status
  }, [metrics, networkMetrics])

  return {
    metrics,
    networkMetrics,
    measureNetworkLatency,
    measureQueryTime,
    getPerformanceSummary,
    getPerformanceRecommendations,
    getHealthcarePerformanceStatus
  }
}

// Hook for monitoring dashboard-specific performance
export function useDashboardPerformance(dashboardType: 'patient' | 'pharmacy' | 'chw' | 'doctor') {
  const baseMonitor = usePerformanceMonitor(`${dashboardType}-dashboard`)
  const [dashboardMetrics, setDashboardMetrics] = useState({
    sectionsLoaded: 0,
    totalSections: 0,
    loadingProgress: 0,
    criticalDataLoaded: false
  })

  const trackSectionLoad = useCallback((_sectionName: string, isLoaded: boolean) => {
    setDashboardMetrics(prev => {
      const newSectionsLoaded = isLoaded ? prev.sectionsLoaded + 1 : prev.sectionsLoaded
      const loadingProgress = prev.totalSections > 0 ? (newSectionsLoaded / prev.totalSections) * 100 : 0
      
      return {
        ...prev,
        sectionsLoaded: newSectionsLoaded,
        loadingProgress
      }
    })
  }, [])

  const setTotalSections = useCallback((total: number) => {
    setDashboardMetrics(prev => ({
      ...prev,
      totalSections: total,
      loadingProgress: total > 0 ? (prev.sectionsLoaded / total) * 100 : 0
    }))
  }, [])

  const markCriticalDataLoaded = useCallback(() => {
    setDashboardMetrics(prev => ({
      ...prev,
      criticalDataLoaded: true
    }))
  }, [])

  return {
    ...baseMonitor,
    dashboardMetrics,
    trackSectionLoad,
    setTotalSections,
    markCriticalDataLoaded
  }
}