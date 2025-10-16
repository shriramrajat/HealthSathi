'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  Video, 
  FileText, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { DashboardStatistics } from '@/lib/types/dashboard-models'

interface StatisticsCardsProps {
  statistics: DashboardStatistics
  isLoading?: boolean
  error?: string
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
}

// Animated counter component for smooth number transitions
const AnimatedCounter = ({ value, duration = 1000, suffix = '' }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(value * easeOutQuart))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return <span>{displayValue}{suffix}</span>
}

// Loading skeleton for statistics cards
const StatisticsCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-4 w-4 bg-gray-200 rounded"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </CardContent>
  </Card>
)

// Individual statistic card component
interface StatisticCardProps {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  isLoading?: boolean
}

const StatisticCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  badge,
  isLoading 
}: StatisticCardProps) => {
  if (isLoading) {
    return <StatisticsCardSkeleton />
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 pr-2">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {badge && (
            <Badge variant={badge.variant} className="text-xs hidden sm:inline-flex">
              {badge.text}
            </Badge>
          )}
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-xl sm:text-2xl font-bold mb-1">
          <AnimatedCounter value={value} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
          <span className="line-clamp-2">{description}</span>
          {trend && (
            <div className={`flex items-center gap-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp 
                className={`h-3 w-3 ${
                  trend.isPositive ? '' : 'rotate-180'
                }`} 
              />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {/* Show badge on mobile below the content */}
        {badge && (
          <div className="mt-2 sm:hidden">
            <Badge variant={badge.variant} className="text-xs">
              {badge.text}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function StatisticsCards({ 
  statistics, 
  isLoading = false, 
  error 
}: StatisticsCardsProps) {
  // Show error state
  if (error) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-center p-4 sm:p-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Failed to load</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate trends (mock data for now - in real implementation, this would come from historical data)
  const todayTrend = { value: 12, isPositive: true }
  const patientsTrend = { value: 8, isPositive: true }
  const consultationsTrend = { value: 5, isPositive: true }
  const prescriptionsTrend = { value: 15, isPositive: true }

  return (
    <div className="space-y-4">
      {/* Main statistics - responsive grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatisticCard
          title="Today's Appointments"
          value={statistics.todayAppointments}
          description="Scheduled for today"
          icon={<Calendar className="h-4 w-4" />}
          trend={todayTrend}
          badge={
            statistics.upcomingAppointments > 0 
              ? { text: `${statistics.upcomingAppointments} upcoming`, variant: 'default' }
              : undefined
          }
          isLoading={isLoading}
        />

        <StatisticCard
          title="Total Patients"
          value={statistics.totalPatients}
          description="Active patients"
          icon={<Users className="h-4 w-4" />}
          trend={patientsTrend}
          isLoading={isLoading}
        />

        <StatisticCard
          title="Completed Consultations"
          value={statistics.completedConsultations}
          description={`Avg. ${statistics.averageConsultationTime}min each`}
          icon={<Video className="h-4 w-4" />}
          trend={consultationsTrend}
          badge={
            statistics.averageConsultationTime > 0
              ? { text: `${statistics.averageConsultationTime}min avg`, variant: 'secondary' }
              : undefined
          }
          isLoading={isLoading}
        />

        <StatisticCard
          title="Prescriptions Issued"
          value={statistics.prescriptionsIssued}
          description="This month"
          icon={<FileText className="h-4 w-4" />}
          trend={prescriptionsTrend}
          isLoading={isLoading}
        />
      </div>

      {/* Additional statistics - responsive grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatisticCard
          title="No-Show Rate"
          value={statistics.noShowAppointments}
          description="Missed appointments"
          icon={<Clock className="h-4 w-4" />}
          badge={
            statistics.noShowAppointments === 0
              ? { text: 'Excellent', variant: 'default' }
              : statistics.noShowAppointments < 5
              ? { text: 'Good', variant: 'secondary' }
              : { text: 'Needs attention', variant: 'destructive' }
          }
          isLoading={isLoading}
        />

        <StatisticCard
          title="Cancelled Appointments"
          value={statistics.cancelledAppointments}
          description="This month"
          icon={<AlertCircle className="h-4 w-4" />}
          isLoading={isLoading}
        />

        <StatisticCard
          title="Patient Satisfaction"
          value={statistics.patientSatisfactionScore || 0}
          description="Average rating"
          icon={<CheckCircle className="h-4 w-4" />}
          badge={
            (statistics.patientSatisfactionScore || 0) >= 4.5
              ? { text: 'Excellent', variant: 'default' }
              : (statistics.patientSatisfactionScore || 0) >= 4.0
              ? { text: 'Good', variant: 'secondary' }
              : { text: 'Needs improvement', variant: 'destructive' }
          }
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}