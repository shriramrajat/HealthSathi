'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  CalendarIcon,
  ClockIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  FilterIcon,
  ArchiveIcon,
  EyeIcon,
  RefreshCwIcon
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

import { 
  symptomResultsService, 
  type SymptomHistoryOptions 
} from '@/lib/services/symptom-results-service'
import type { 
  SymptomAnalysisResult, 
  SymptomUrgencyLevel,
  SymptomTrend 
} from '@/lib/types/symptom-checker-types'

// Component props
interface SymptomHistoryProps {
  patientId: string
  showTrends?: boolean
  showFilters?: boolean
  maxResults?: number
  onResultClick?: (result: SymptomAnalysisResult) => void
  className?: string
}

// Urgency color mapping
const URGENCY_COLORS = {
  low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  emergency: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
}

const URGENCY_ICONS = {
  low: MinusIcon,
  medium: ClockIcon,
  high: AlertTriangleIcon,
  emergency: AlertTriangleIcon
}

export default function SymptomHistory({
  patientId,
  showTrends = false,
  showFilters = true,
  maxResults = 20,
  onResultClick,
  className
}: SymptomHistoryProps) {
  const [results, setResults] = useState<SymptomAnalysisResult[]>([])
  const [trends, setTrends] = useState<SymptomTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filter states
  const [urgencyFilter, setUrgencyFilter] = useState<SymptomUrgencyLevel[]>([])
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [includeArchived, setIncludeArchived] = useState(false)

  // Load symptom history
  const loadSymptomHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const options: SymptomHistoryOptions = {
        limit: maxResults,
        includeArchived,
        urgencyFilter: urgencyFilter.length > 0 ? urgencyFilter : undefined,
        dateRange: dateRange || undefined
      }

      const response = await symptomResultsService.getPatientSymptomHistory(patientId, options)

      if (response.success && response.data) {
        setResults(response.data)
      } else {
        setError(response.error || 'Failed to load symptom history')
      }
    } catch (err) {
      console.error('Error loading symptom history:', err)
      setError('Failed to load symptom history')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [patientId, maxResults, includeArchived, urgencyFilter, dateRange])

  // Load symptom trends
  const loadSymptomTrends = useCallback(async () => {
    if (!showTrends) return

    try {
      const response = await symptomResultsService.getPatientSymptomTrends(patientId, 30)

      if (response.success && response.data) {
        setTrends(response.data)
      }
    } catch (err) {
      console.error('Error loading symptom trends:', err)
    }
  }, [patientId, showTrends])

  // Initial load
  useEffect(() => {
    loadSymptomHistory()
    loadSymptomTrends()
  }, [loadSymptomHistory, loadSymptomTrends])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadSymptomHistory(false)
    loadSymptomTrends()
  }, [loadSymptomHistory, loadSymptomTrends])

  // Handle filter changes
  const handleUrgencyFilterChange = useCallback((value: string) => {
    if (value === 'all') {
      setUrgencyFilter([])
    } else {
      setUrgencyFilter([value as SymptomUrgencyLevel])
    }
  }, [])

  const handleDateRangeChange = useCallback((range: { start: Date; end: Date } | null) => {
    setDateRange(range)
  }, [])

  const handleIncludeArchivedChange = useCallback((value: string) => {
    setIncludeArchived(value === 'true')
  }, [])

  // Render trend indicator
  const renderTrendIndicator = (trend: SymptomTrend) => {
    const TrendIcon = trend.frequency === 'increasing' ? TrendingUpIcon : 
                     trend.frequency === 'decreasing' ? TrendingDownIcon : MinusIcon
    
    const trendColor = trend.frequency === 'increasing' ? 'text-red-500' :
                      trend.frequency === 'decreasing' ? 'text-green-500' : 'text-gray-500'

    return (
      <div className="flex items-center gap-1">
        <TrendIcon className={cn('size-3', trendColor)} />
        <span className={cn('text-xs', trendColor)}>
          {trend.frequency}
        </span>
      </div>
    )
  }

  // Render result card
  const renderResultCard = (result: SymptomAnalysisResult) => {
    const UrgencyIcon = URGENCY_ICONS[result.urgency]
    const urgencyColor = URGENCY_COLORS[result.urgency]

    return (
      <Card 
        key={result.id} 
        className={cn(
          "transition-all duration-200 hover:shadow-md cursor-pointer",
          onResultClick && "hover:bg-muted/50"
        )}
        onClick={() => onResultClick?.(result)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <UrgencyIcon className="size-4" />
              <CardTitle className="text-sm">
                Symptom Check
              </CardTitle>
              <Badge variant="outline" className={cn('text-xs', urgencyColor)}>
                {result.urgency}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="size-3" />
              {format(
                result.timestamp instanceof Date ? result.timestamp : result.timestamp.toDate(),
                'MMM dd, yyyy'
              )}
            </div>
          </div>
          <CardDescription className="text-xs">
            {result.selectedSymptoms.length} symptoms • {result.confidence}% confidence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected Symptoms */}
          <div>
            <h4 className="text-xs font-medium mb-2">Symptoms:</h4>
            <div className="flex flex-wrap gap-1">
              {result.selectedSymptoms.slice(0, 5).map((symptom, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {symptom}
                </Badge>
              ))}
              {result.selectedSymptoms.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{result.selectedSymptoms.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          {/* Advice Preview */}
          <div>
            <h4 className="text-xs font-medium mb-1">Advice:</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {result.finalAdvice}
            </p>
          </div>

          {/* Actions */}
          {result.recommendedActions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-1">Recommended Actions:</h4>
              <div className="space-y-1">
                {result.recommendedActions.slice(0, 2).map((action, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      'size-2 rounded-full',
                      action.urgency === 'emergency' ? 'bg-red-500' :
                      action.urgency === 'high' ? 'bg-orange-500' :
                      action.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    )} />
                    <span className="text-muted-foreground truncate">
                      {action.title}
                    </span>
                  </div>
                ))}
                {result.recommendedActions.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{result.recommendedActions.length - 2} more actions
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Follow-up indicator */}
          {result.followUpRequired && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <ClockIcon className="size-3" />
              Follow-up required
              {result.followUpDays && ` in ${result.followUpDays} days`}
            </div>
          )}

          {/* Archived indicator */}
          {result.isArchived && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArchiveIcon className="size-3" />
              Archived
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Symptom History</h3>
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCwIcon className={cn('size-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FilterIcon className="size-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Urgency Filter */}
              <div>
                <label className="text-xs font-medium mb-1 block">Urgency Level</label>
                <Select value={urgencyFilter[0] || 'all'} onValueChange={handleUrgencyFilterChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All urgency levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-xs font-medium mb-1 block">Date Range</label>
                <div className="text-xs text-muted-foreground">
                  Date range picker coming soon
                </div>
              </div>

              {/* Include Archived */}
              <div>
                <label className="text-xs font-medium mb-1 block">Include Archived</label>
                <Select value={includeArchived.toString()} onValueChange={handleIncludeArchivedChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Active Only</SelectItem>
                    <SelectItem value="true">Include Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {showTrends && trends.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Symptom Trends (Last 30 Days)</CardTitle>
            <CardDescription className="text-xs">
              Patterns in your symptom reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trends.slice(0, 6).map((trend, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium truncate">{trend.symptomName}</h4>
                    {renderTrendIndicator(trend)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trend.occurrences.length} occurrence{trend.occurrences.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Severity: {trend.severity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <EyeIcon className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No symptom history found</h3>
            <p className="text-muted-foreground text-center">
              No symptom checker results match your current filters.
            </p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map(renderResultCard)}
        </div>
      )}
    </div>
  )
}