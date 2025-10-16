'use client'

import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, Pill, Activity } from 'lucide-react'
import type {
  AnalyticsData,
  ConsultationTrendData,
  PatientDemographicsData,
  PrescriptionPatternData,
  AppointmentStatusData
} from '@/lib/types/dashboard-models'

interface AnalyticsChartsProps {
  data: AnalyticsData
  isLoading?: boolean
  error?: string | null
}

// Color schemes for different charts
const CONSULTATION_COLORS = {
  completed: '#22c55e',
  cancelled: '#ef4444',
  noShow: '#f59e0b'
}

const APPOINTMENT_STATUS_COLORS = [
  '#3b82f6', // scheduled - blue
  '#22c55e', // confirmed - green
  '#f59e0b', // in-progress - amber
  '#10b981', // completed - emerald
  '#ef4444', // cancelled - red
  '#f97316'  // no-show - orange
]

const PRESCRIPTION_COLORS = [
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1'  // indigo
]

const DEMOGRAPHICS_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4'  // cyan
]

export function AnalyticsCharts({ data, isLoading = false, error }: AnalyticsChartsProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load analytics data</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">
            <CalendarDays className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="demographics">
            <Users className="h-4 w-4 mr-2" />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="prescriptions">
            <Pill className="h-4 w-4 mr-2" />
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Activity className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultation Trends</CardTitle>
              <CardDescription>
                Daily consultation activity over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.consultationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric' 
                        })
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke={CONSULTATION_COLORS.completed}
                      strokeWidth={2}
                      name="Completed"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cancelled"
                      stroke={CONSULTATION_COLORS.cancelled}
                      strokeWidth={2}
                      name="Cancelled"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="noShow"
                      stroke={CONSULTATION_COLORS.noShow}
                      strokeWidth={2}
                      name="No Show"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
              <CardDescription>
                Distribution of patients by age group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.patientDemographics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ ageGroup, percentage }) => `${ageGroup}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.patientDemographics.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={DEMOGRAPHICS_COLORS[index % DEMOGRAPHICS_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} patients (${props.payload.percentage}%)`,
                        props.payload.ageGroup
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Patterns</CardTitle>
              <CardDescription>
                Most commonly prescribed medication types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.prescriptionPatterns} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="medicationType" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} prescriptions`, 'Count']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                    >
                      {data.prescriptionPatterns.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRESCRIPTION_COLORS[index % PRESCRIPTION_COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Status Distribution</CardTitle>
              <CardDescription>
                Current status breakdown of all appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.appointmentStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ status, percentage }) => 
                        `${status.charAt(0).toUpperCase() + status.slice(1)}: ${percentage}%`
                      }
                    >
                      {data.appointmentStatusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || APPOINTMENT_STATUS_COLORS[index % APPOINTMENT_STATUS_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} appointments (${props.payload.percentage}%)`,
                        props.payload.status.charAt(0).toUpperCase() + props.payload.status.slice(1)
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}