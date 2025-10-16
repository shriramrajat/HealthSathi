'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { Consultation, ConsultationFilters } from '@/lib/types/dashboard-models'
import { useConsultations } from '@/hooks/use-consultations'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'

interface ConsultationHistoryProps {
  doctorId: string
  patientId?: string // If provided, show only consultations for this patient
  onConsultationSelect?: (consultation: Consultation) => void
  className?: string
}

interface GroupedConsultations {
  [key: string]: Consultation[]
}

export function ConsultationHistory({ 
  doctorId, 
  patientId,
  onConsultationSelect,
  className 
}: ConsultationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['today', 'yesterday']))
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)

  // Build filters
  const filters: ConsultationFilters = useMemo(() => {
    const baseFilters: ConsultationFilters = {}
    
    if (patientId) {
      // This would need to be handled in the hook/service
      // For now, we'll filter client-side
    }
    
    if (statusFilter !== 'all') {
      baseFilters.status = [statusFilter as Consultation['status']]
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          baseFilters.dateRange = {
            start: today as any,
            end: new Date(today.getTime() + 24 * 60 * 60 * 1000) as any
          }
          break
        case 'week':
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          baseFilters.dateRange = {
            start: weekStart as any,
            end: now as any
          }
          break
        case 'month':
          const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          baseFilters.dateRange = {
            start: monthStart as any,
            end: now as any
          }
          break
      }
    }

    return baseFilters
  }, [patientId, statusFilter, dateFilter])

  const { 
    consultations, 
    isLoading, 
    error,
    refresh 
  } = useConsultations({ 
    doctorId, 
    filters 
  })

  // Filter consultations based on search query and patient ID
  const filteredConsultations = useMemo(() => {
    let filtered = consultations

    // Filter by patient ID if provided
    if (patientId) {
      filtered = filtered.filter(consultation => consultation.patientId === patientId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(consultation => 
        consultation.patientName?.toLowerCase().includes(query) ||
        consultation.notes.toLowerCase().includes(query) ||
        consultation.roomId.toLowerCase().includes(query)
      )
    }

    // Sort by start time (most recent first)
    return filtered.sort((a, b) => 
      b.startTime.toDate().getTime() - a.startTime.toDate().getTime()
    )
  }, [consultations, patientId, searchQuery])

  // Group consultations by date
  const groupedConsultations: GroupedConsultations = useMemo(() => {
    const groups: GroupedConsultations = {}

    filteredConsultations.forEach(consultation => {
      const date = consultation.startTime.toDate()
      let groupKey: string

      if (isToday(date)) {
        groupKey = 'today'
      } else if (isYesterday(date)) {
        groupKey = 'yesterday'
      } else if (isThisWeek(date)) {
        groupKey = 'this-week'
      } else if (isThisMonth(date)) {
        groupKey = 'this-month'
      } else {
        groupKey = format(date, 'MMMM yyyy')
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(consultation)
    })

    return groups
  }, [filteredConsultations])

  // Get group display name
  const getGroupDisplayName = (groupKey: string): string => {
    switch (groupKey) {
      case 'today': return 'Today'
      case 'yesterday': return 'Yesterday'
      case 'this-week': return 'This Week'
      case 'this-month': return 'This Month'
      default: return groupKey
    }
  }

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Handle consultation selection
  const handleConsultationSelect = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    onConsultationSelect?.(consultation)
  }

  // Export consultation notes
  const exportConsultationNotes = (consultation: Consultation) => {
    const content = `
Consultation Notes
==================

Patient: ${consultation.patientName || 'Unknown'}
Date: ${format(consultation.startTime.toDate(), 'PPP')}
Time: ${format(consultation.startTime.toDate(), 'p')}
Duration: ${consultation.duration ? `${consultation.duration} minutes` : 'N/A'}
Status: ${consultation.status}
Room ID: ${consultation.roomId}

Notes:
------
${consultation.notes || 'No notes recorded'}

Generated on: ${format(new Date(), 'PPP p')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consultation-${consultation.roomId}-${format(consultation.startTime.toDate(), 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format consultation duration
  const formatDuration = (minutes?: number): string => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  // Get status color
  const getStatusColor = (status: Consultation['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-blue-500'
      case 'scheduled': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load consultation history</p>
            <Button variant="outline" onClick={refresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consultation History
          {patientId && <Badge variant="outline">Patient Specific</Badge>}
        </CardTitle>

        {/* Search and filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search consultations, patients, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedConsultations).length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No consultation history found</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {Object.entries(groupedConsultations).map(([groupKey, consultations]) => (
                <Collapsible
                  key={groupKey}
                  open={expandedGroups.has(groupKey)}
                  onOpenChange={() => toggleGroup(groupKey)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{getGroupDisplayName(groupKey)}</span>
                        <Badge variant="secondary">{consultations.length}</Badge>
                      </div>
                      {expandedGroups.has(groupKey) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-2 mt-2">
                    {consultations.map((consultation) => (
                      <Card
                        key={consultation.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedConsultation?.id === consultation.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleConsultationSelect(consultation)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(consultation.status)}`} />
                                <span className="font-medium">
                                  {consultation.patientName || 'Unknown Patient'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {consultation.status}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(consultation.startTime.toDate(), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(consultation.startTime.toDate(), 'h:mm a')}
                                </div>
                                {consultation.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(consultation.duration)}
                                  </div>
                                )}
                              </div>

                              {consultation.notes && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {consultation.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  exportConsultationNotes(consultation)
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              
                              {consultation.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`/consultation/room/${consultation.roomId}`, '_blank')
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}