"use client"

import React from 'react'
import { usePerformanceMonitoring } from '@/lib/performance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Performance Monitor Component
 * Displays real-time Core Web Vitals and performance metrics
 */
export function PerformanceMonitor() {
  const { metrics, summary, clearMetrics, exportData } = usePerformanceMonitoring()

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-500'
      case 'needs-improvement': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-auto bg-background/95 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Performance Monitor
          <Badge variant="outline" className="text-xs">
            Score: {summary.overallScore}/100
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Core Web Vitals & Performance Metrics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Core Web Vitals */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(summary.coreWebVitals).map(([metric, data]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="font-mono">{metric}:</span>
                <div className="flex items-center gap-1">
                  <span>{Math.round(data.value)}ms</span>
                  <div className={`w-2 h-2 rounded-full ${getRatingColor(data.rating)}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Metrics */}
        {Object.keys(summary.customMetrics).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Custom Metrics</h4>
            <div className="space-y-1 text-xs">
              {Object.entries(summary.customMetrics).slice(0, 3).map(([name, value]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="font-mono text-xs truncate">{name}:</span>
                  <span>{Math.round(value)}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Metrics */}
        {metrics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Recent Metrics ({metrics.length})
            </h4>
            <div className="space-y-1 text-xs max-h-20 overflow-y-auto">
              {metrics.slice(-3).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between">
                  <span className="font-mono">{metric.name}:</span>
                  <div className="flex items-center gap-1">
                    <span>{Math.round(metric.value)}ms</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${getRatingColor(metric.rating)}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Count */}
        {summary.errorCount > 0 && (
          <div className="text-xs text-red-600">
            ⚠️ {summary.errorCount} monitoring errors
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearMetrics}
            className="text-xs h-7 px-2"
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="text-xs h-7 px-2"
          >
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Performance Metrics Display Component
 * Shows a simplified view of performance metrics
 */
export function PerformanceMetrics() {
  const { summary } = usePerformanceMonitoring()

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Performance:</span>
      <Badge variant={summary.overallScore >= 80 ? 'default' : summary.overallScore >= 60 ? 'secondary' : 'destructive'}>
        {summary.overallScore}/100
      </Badge>
      {Object.entries(summary.coreWebVitals).slice(0, 2).map(([metric, data]) => (
        <span key={metric} className="font-mono">
          {metric}: {Math.round(data.value)}ms
        </span>
      ))}
    </div>
  )
}