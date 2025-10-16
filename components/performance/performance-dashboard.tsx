"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Zap, 
  Database, 
  Wifi, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { optimizedFirestore } from '@/lib/services/optimized-firestore'

interface PerformanceDashboardProps {
  showDetailed?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PerformanceDashboard({ 
  showDetailed = false, 
  autoRefresh = true,
  refreshInterval = 30000 
}: PerformanceDashboardProps) {
  const {
    metrics,
    networkMetrics,
    measureNetworkLatency,
    getPerformanceSummary,
    getPerformanceRecommendations,
    getHealthcarePerformanceStatus
  } = usePerformanceMonitor('performance-dashboard')

  const [firestoreMetrics, setFirestoreMetrics] = useState<Map<string, any>>(new Map())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Refresh performance data
  const refreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      await measureNetworkLatency()
      const fsMetrics = optimizedFirestore.getPerformanceMetrics()
      setFirestoreMetrics(fsMetrics)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(refreshMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial load
  useEffect(() => {
    refreshMetrics()
  }, [])

  const performanceSummary = getPerformanceSummary()
  const recommendations = getPerformanceRecommendations()
  const healthcareStatus = getHealthcarePerformanceStatus()

  // Performance score calculation
  const calculatePerformanceScore = () => {
    let score = 100
    
    // Deduct points for poor metrics
    if (metrics.lcp && metrics.lcp > 2500) score -= 20
    if (metrics.fid && metrics.fid > 100) score -= 15
    if (metrics.cls && metrics.cls > 0.1) score -= 15
    if (metrics.memoryUsage > 50) score -= 10
    if (networkMetrics.latency > 500) score -= 15
    if (metrics.queryResponseTime > 1000) score -= 25

    return Math.max(0, score)
  }

  const performanceScore = calculatePerformanceScore()

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Real-time performance metrics for healthcare platform
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getScoreBadgeVariant(performanceScore)} className="text-sm">
                Score: {performanceScore}/100
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMetrics}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Core Web Vitals */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">LCP</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(2)}s` : 'N/A'}
              </div>
              <Progress 
                value={metrics.lcp ? Math.min(100, (2500 / metrics.lcp) * 100) : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">FID</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
              </div>
              <Progress 
                value={metrics.fid ? Math.min(100, (100 / metrics.fid) * 100) : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">CLS</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
              <Progress 
                value={metrics.cls ? Math.min(100, (0.1 / metrics.cls) * 100) : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.memoryUsage.toFixed(1)}MB
              </div>
              <Progress 
                value={Math.min(100, (metrics.memoryUsage / 100) * 100)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Healthcare-specific Status */}
      {(healthcareStatus.critical || healthcareStatus.warnings.length > 0) && (
        <Card className={healthcareStatus.critical ? 'border-red-500' : 'border-yellow-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {healthcareStatus.critical ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Healthcare Performance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthcareStatus.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">{warning}</p>
                </div>
              ))}
              {healthcareStatus.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showDetailed && (
        <Tabs defaultValue="network" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Network Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${networkMetrics.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium">Connection Status</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {networkMetrics.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Connection Type</span>
                    <div className="text-lg font-semibold capitalize">
                      {networkMetrics.connectionType}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Latency</span>
                    <div className="text-lg font-semibold">
                      {networkMetrics.latency > 0 ? `${networkMetrics.latency.toFixed(0)}ms` : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Firestore Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {firestoreMetrics.size > 0 ? (
                  <div className="space-y-4">
                    {Array.from(firestoreMetrics.entries()).map(([key, metrics]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{key}</h4>
                          <Badge variant="outline">
                            {metrics.cacheHitRate.toFixed(1)}% cache hit
                          </Badge>
                        </div>
                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Avg Query Time:</span>
                            <span className="ml-2 font-medium">{metrics.avgQueryTime.toFixed(2)}ms</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Queries:</span>
                            <span className="ml-2 font-medium">{metrics.totalQueries}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cache Hit Rate:</span>
                            <span className="ml-2 font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No database metrics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-sm">No performance issues detected. Great job!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  )
}

// Compact performance indicator for headers
export function PerformanceIndicator() {
  const { metrics, networkMetrics } = usePerformanceMonitor('indicator')
  
  const isHealthy = 
    networkMetrics.isOnline &&
    metrics.memoryUsage < 50 &&
    networkMetrics.latency < 500

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className="text-xs text-muted-foreground">
        {isHealthy ? 'Optimal' : 'Monitoring'}
      </span>
    </div>
  )
}