'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Video, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Stethoscope,
  Heart,
  Activity,
  Loader2
} from 'lucide-react'
import { Appointment } from '@/lib/types/dashboard-models'
import { cn } from '@/lib/utils'

interface AppointmentsDisplayProps {
  appointments: Appointment[]
  isLoading?: boolean
  error?: string
  onStartConsultation?: (appointmentId: string, patientId: string, patientName?: string) => void
  onCallPatient?: (appointmentId: string, phone: string) => void
  isStartingConsultation?: boolean
  className?: string
}

type SortField = 'scheduledAt' | 'patientName' | 'priority' | 'status'
type SortDirection = 'asc' | 'desc'

interface AppointmentFilters {
  search: string
  status: string
  type: string
  priority: string
}

// Helper function to check if appointment is within 15 minutes
const isUpcomingSoon = (scheduledAt: Date): boolean => {
  const now = new Date()
  const appointmentTime = new Date(scheduledAt)
  const timeDiff = appointmentTime.getTime() - now.getTime()
  return timeDiff > 0 && timeDiff <= 15 * 60 * 1000 // 15 minutes in milliseconds
}

// Helper function to get status color
const getStatusColor = (status: Appointment['status']): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'no-show':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Helper function to get priority color
const getPriorityColor = (priority: Appointment['priority']): string => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'normal':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Helper function to format time
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Helper function to format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Individual appointment card component
interface AppointmentCardProps {
  appointment: Appointment
  onStartConsultation?: (appointmentId: string, patientId: string, patientName?: string) => void
  onCallPatient?: (appointmentId: string, phone: string) => void
  isStartingConsultation?: boolean
}

const AppointmentCard = ({ 
  appointment, 
  onStartConsultation, 
  onCallPatient,
  isStartingConsultation = false
}: AppointmentCardProps) => {
  const scheduledDate = appointment.scheduledAt.toDate()
  const isUpcoming = isUpcomingSoon(scheduledDate)
  const canStartConsultation = ['scheduled', 'confirmed'].includes(appointment.status)

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isUpcoming && "ring-2 ring-orange-200 bg-orange-50/50",
      appointment.priority === 'urgent' && "border-red-300"
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col space-y-2 sm:space-y-3">
          {/* Header with patient info and status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-base sm:text-lg truncate">
                  {appointment.patientName || 'Unknown Patient'}
                </h4>
                {isUpcoming && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Soon
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>ID: {appointment.patientId}</span>
                {appointment.patientPhone && (
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{appointment.patientPhone}</span>
                    <span className="sm:hidden">{appointment.patientPhone.slice(-4)}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(appointment.priority)}>
                {appointment.priority}
              </Badge>
            </div>
          </div>

          {/* Appointment details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center text-xs sm:text-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span>{formatDate(scheduledDate)}</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span>{formatTime(scheduledDate)}</span>
                <span className="text-muted-foreground ml-1">
                  ({appointment.duration}min)
                </span>
              </div>
              <div className="flex items-center text-xs sm:text-sm">
                <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span className="capitalize">{appointment.type.replace('-', ' ')}</span>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center text-xs sm:text-sm font-medium">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    Symptoms:
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {appointment.symptoms.join(', ')}
                  </div>
                </div>
              )}
              {appointment.notes && (
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-medium">Notes:</div>
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {appointment.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            {canStartConsultation && onStartConsultation && (
              <Button 
                size="sm" 
                onClick={() => onStartConsultation(
                  appointment.id, 
                  appointment.patientId, 
                  appointment.patientName
                )}
                disabled={isStartingConsultation}
                className="flex-1 min-w-0 h-10 text-sm"
              >
                {isStartingConsultation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Starting...</span>
                    <span className="sm:hidden">Starting</span>
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Start Consultation</span>
                    <span className="sm:hidden">Start</span>
                  </>
                )}
              </Button>
            )}
            <div className="flex gap-2">
              {appointment.patientPhone && onCallPatient && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCallPatient(appointment.id, appointment.patientPhone!)}
                  className="flex-1 sm:flex-none h-10 text-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-10 text-sm">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">View Patient</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton component
const AppointmentCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-1">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function AppointmentsDisplay({
  appointments,
  isLoading = false,
  error,
  onStartConsultation,
  onCallPatient,
  isStartingConsultation = false,
  className
}: AppointmentsDisplayProps) {
  const [filters, setFilters] = useState<AppointmentFilters>({
    search: '',
    status: 'all',
    type: 'all',
    priority: 'all'
  })
  const [sortField, setSortField] = useState<SortField>('scheduledAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter and sort appointments
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments.filter(appointment => {
      const matchesSearch = !filters.search || 
        appointment.patientName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        appointment.patientId.toLowerCase().includes(filters.search.toLowerCase()) ||
        appointment.symptoms.some(symptom => 
          symptom.toLowerCase().includes(filters.search.toLowerCase())
        )

      const matchesStatus = filters.status === 'all' || appointment.status === filters.status
      const matchesType = filters.type === 'all' || appointment.type === filters.type
      const matchesPriority = filters.priority === 'all' || appointment.priority === filters.priority

      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    // Sort appointments
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'scheduledAt':
          aValue = a.scheduledAt.toDate().getTime()
          bValue = b.scheduledAt.toDate().getTime()
          break
        case 'patientName':
          aValue = a.patientName || ''
          bValue = b.patientName || ''
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [appointments, filters, sortField, sortDirection])

  // Get upcoming appointments (within 15 minutes)
  const upcomingAppointments = filteredAndSortedAppointments.filter(appointment => 
    isUpcomingSoon(appointment.scheduledAt.toDate())
  )

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load appointments: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with filters and sorting */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Appointments</h3>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedAppointments.length} appointments
              {upcomingAppointments.length > 0 && (
                <span className="text-orange-600 font-medium">
                  {' '}• {upcomingAppointments.length} starting soon
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('scheduledAt')}
              className="flex items-center gap-1"
            >
              {sortField === 'scheduledAt' && sortDirection === 'desc' ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
              Time
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('priority')}
              className="flex items-center gap-1"
            >
              {sortField === 'priority' && sortDirection === 'desc' ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
              Priority
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setFilters({ search: '', status: 'all', type: 'all', priority: 'all' })}
            className="flex items-center gap-2 h-10 text-sm"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Appointments list */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <AppointmentCardSkeleton key={index} />
          ))
        ) : filteredAndSortedAppointments.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">No appointments found</h4>
              <p className="text-muted-foreground text-center">
                {appointments.length === 0 
                  ? "No appointments scheduled yet."
                  : "No appointments match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          // Appointment cards
          filteredAndSortedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStartConsultation={onStartConsultation}
              onCallPatient={onCallPatient}
              isStartingConsultation={isStartingConsultation}
            />
          ))
        )}
      </div>
    </div>
  )
}