'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  CalendarIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  UsersIcon,
  ActivityIcon,
  FilterIcon,
  RefreshCwIcon,
  DownloadIcon,
  EyeIcon,
  SearchIcon
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import { 
  symptomResultsService, 
  type SymptomResultsFilters 
} from '@/lib/services/symptom-results-service'
import type { 
  SymptomAnalysisResult, 
  SymptomUrgencyLevel 
} from '@/lib/types/symptom-checker-types'

// Component props
interface ProviderSymptomDashboardProps {
  onResultClick?: (result: SymptomAnalysisResult) => void
  onPatientClick?: (patientId: string) => void
  className?: string
}

// Statistics interface
interface SymptomStatistics {
  totalResults: number
  urgencyDistribution: Record<SymptomUrgencyLevel, number>
  mostCommonSymptoms: Array<{ symptom: string; count: number }>
  averageConfidence: number
}

// Urgency color mapping
const URGENCY_COLORS = {
  low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  emergency: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
}

const URGENCY_BG_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  emergency: 'bg-red-500'
}

export default function ProviderSymptomDashboard({
  onResultClick,
  onPatientClick,
  className
}: ProviderSymptomDashboardProps) {
  const [results, setResults] = useState<SymptomAnalysisResult[]>([])
  const [statistics, setStatistics] = useState<SymptomStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filter states
  const [urgencyFilter, setUrgencyFilter] = useState<SymptomUrgencyLevel[]>([])
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Load symptom results
  const loadSymptomResults = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const filters: SymptomResultsFilters = {}
      
      if (urgencyFilter.length > 0) {
        filters.urgency = urgencyFilter
      }
      
      if (dateRange) {
        filters.dateRange = {
          start: new Date(dateRange.start) as any,
          end: new Date(dateRange.end) as any
        }
      }

      const response = await symptomResultsService.getSymptomResultsForProvider(filters, 100)

      if (response.success && response.data) {
        let filteredResults = response.data

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filteredResults = filteredResults.filter(result =>
            result.selectedSymptoms.some(symptom => symptom.toLowerCase().includes(query)) ||
            result.finalAdvice.toLowerCase().includes(query) ||
            result.patientId.toLowerCase().includes(query)
          )
        }

        setResults(filteredResults)
      } else {
        setError(response.error || 'Failed to load symptom results')
      }
    } catch (err) {
      console.error('Error loading symptom results:', err)
      setError('Failed to load symptom results')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [urgencyFilter, dateRange, searchQuery])

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await symptomResultsService.getSymptomStatistics(dateRange || undefined)

      if (response.success && response.data) {
        setStatistics(response.data)
      }
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }, [dateRange])

  // Initial load
  useEffect(() => {
    loadSymptomResults()
    loadStatistics()
  }, [loadSymptomResults, loadStatistics])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadSymptomResults(false)
    loadStatistics()
  }, [loadSymptomResults, loadStatistics])

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

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  // Render statistics cards
  const renderStatisticsCards = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <ActivityIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Symptom checks recorded
            </p>
          </CardContent>
        </Card>

        {/* Emergency Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Cases</CardTitle>
            <AlertTriangleIcon className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.urgencyDistribution.emergency}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        {/* High Priority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUpIcon className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.urgencyDistribution.high}
            </div>
            <p className="text-xs text-muted-foreground">
              Need prompt care
            </p>
          </CardContent>
        </Card>

        {/* Average Confidence */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averageConfidence}%</div>
            <p className="text-xs text-muted-foreground">
              Analysis accuracy
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render urgency distribution chart
  const renderUrgencyDistribution = () => {
    if (!statistics) return null

    const total = statistics.totalResults
    if (total === 0) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Urgency Distribution</CardTitle>
          <CardDescription className="text-xs">
            Breakdown of symptom check urgency levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statistics.urgencyDistribution).map(([urgency, count]) => {
              const percentage = Math.round((count / total) * 100)
              return (
                <div key={urgency} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('size-3 rounded-full', URGENCY_BG_COLORS[urgency as SymptomUrgencyLevel])} />
                    <span className="text-sm capitalize">{urgency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className={cn('h-2 rounded-full', URGENCY_BG_COLORS[urgency as SymptomUrgencyLevel])}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render common symptoms
  const renderCommonSymptoms = () => {
    if (!statistics || statistics.mostCommonSymptoms.length === 0) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Most Common Symptoms</CardTitle>
          <CardDescription className="text-xs">
            Frequently reported symptoms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statistics.mostCommonSymptoms.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm truncate">{item.symptom}</span>
                <Badge variant="secondary" className="text-xs">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render result card
  const renderResultCard = (result: SymptomAnalysisResult) => {
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
              <Badge variant="outline" className={cn('text-xs', urgencyColor)}>
                {result.urgency}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Patient: {result.patientId.slice(-8)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="size-3" />
              {format(
                result.timestamp instanceof Date ? result.timestamp : result.timestamp.toDate(),
                'MMM dd, HH:mm'
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected Symptoms */}
          <div>
            <h4 className="text-xs font-medium mb-2">Symptoms ({result.selectedSymptoms.length}):</h4>
            <div className="flex flex-wrap gap-1">
              {result.selectedSymptoms.slice(0, 4).map((symptom, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {symptom}
                </Badge>
              ))}
              {result.selectedSymptoms.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{result.selectedSymptoms.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Advice Preview */}
          <div>
            <h4 className="text-xs font-medium mb-1">Analysis:</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {result.finalAdvice}
            </p>
          </div>

          {/* Confidence and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Confidence: {result.confidence}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {result.followUpRequired && (
                <Badge variant="outline" className="text-xs">
                  Follow-up
                </Badge>
              )}
              {result.specialistReferrals.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Referral
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Symptom Analysis Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and analyze patient symptom checker results
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

      {/* Statistics Cards */}
      {renderStatisticsCards()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderUrgencyDistribution()}
            {renderCommonSymptoms()}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FilterIcon className="size-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 size-3 text-muted-foreground" />
                    <Input
                      placeholder="Search symptoms, advice..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-7 h-8"
                    />
                  </div>
                </div>

                {/* Urgency Filter */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Urgency Level</label>
                  <Select value={urgencyFilter[0] || 'all'} onValueChange={handleUrgencyFilterChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All urgency levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium mb-1 block">Date Range</label>
                  <div className="text-xs text-muted-foreground">
                    Date range picker coming soon
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground text-center">
                  No symptom checker results match your current filters.
                </p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="size-4" />
                  Export
                </Button>
              </div>
              <div className="grid gap-4">
                {results.map(renderResultCard)}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderUrgencyDistribution()}
            {renderCommonSymptoms()}
          </div>
          
          {/* Additional analytics could go here */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Analytics Coming Soon</CardTitle>
              <CardDescription className="text-xs">
                Advanced analytics and reporting features will be available here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <TrendingUpIcon className="size-12 text-muted-foreground mb-4 mx-auto" />
                  <p className="text-muted-foreground">
                    Detailed analytics and trends coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}