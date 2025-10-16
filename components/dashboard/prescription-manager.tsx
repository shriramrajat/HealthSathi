'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Pill,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Prescription, Medication } from '@/lib/types/dashboard-models'
import { 
  prescriptionService, 
  PrescriptionSearchOptions,
  UpdatePrescriptionData 
} from '@/lib/services/prescription-service'
import { PrescriptionCreator } from './prescription-creator'

interface PrescriptionManagerProps {
  doctorId: string
  patientId?: string
  patients?: Array<{ id: string; name: string }>
  onPrescriptionCreated?: (prescriptionId: string) => void
}

export function PrescriptionManager({
  doctorId,
  patientId,
  patients = [],
  onPrescriptionCreated
}: PrescriptionManagerProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [medicationSearch, setMedicationSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load prescriptions
  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Build search options
      const options: PrescriptionSearchOptions = {
        limit: 200
      }

      if (searchTerm.trim()) {
        options.patientSearch = searchTerm.trim()
      }

      if (medicationSearch.trim()) {
        options.medicationSearch = medicationSearch.trim()
      }

      if (statusFilter !== 'all') {
        options.status = [statusFilter as Prescription['status']]
      }

      // Add date range filter
      if (dateRange !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        options.dateRange = {
          start: startDate,
          end: now
        }
      }

      // Filter by patient if specified
      let result
      if (patientId) {
        result = await prescriptionService.getPatientPrescriptions(patientId)
      } else {
        result = await prescriptionService.getDoctorPrescriptions(doctorId, options)
      }

      if (result.success && result.data) {
        setPrescriptions(result.data)
      } else {
        setError(result.error || 'Failed to load prescriptions')
      }
    } catch (err) {
      console.error('Error loading prescriptions:', err)
      setError('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }, [doctorId, patientId, searchTerm, medicationSearch, statusFilter, dateRange])

  // Load prescriptions on mount and when filters change
  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  // Handle prescription creation
  const handleCreatePrescription = useCallback(async (data: any, file?: File) => {
    try {
      setIsUpdating(true)

      let result
      if (file) {
        result = await prescriptionService.createPrescriptionWithFile({
          ...data,
          doctorId,
          file
        })
      } else {
        result = await prescriptionService.createPrescription({
          ...data,
          doctorId
        })
      }

      if (result.success && result.data) {
        setShowCreateDialog(false)
        await loadPrescriptions()
        onPrescriptionCreated?.(result.data)
      } else {
        setError(result.error || 'Failed to create prescription')
      }
    } catch (err) {
      console.error('Error creating prescription:', err)
      setError('Failed to create prescription')
    } finally {
      setIsUpdating(false)
    }
  }, [doctorId, loadPrescriptions, onPrescriptionCreated])

  // Handle prescription update
  const handleUpdatePrescription = useCallback(async (
    prescriptionId: string, 
    updates: UpdatePrescriptionData
  ) => {
    try {
      setIsUpdating(true)

      const result = await prescriptionService.updatePrescription(prescriptionId, updates)

      if (result.success) {
        await loadPrescriptions()
        setSelectedPrescription(null)
        setShowDetailsDialog(false)
      } else {
        setError(result.error || 'Failed to update prescription')
      }
    } catch (err) {
      console.error('Error updating prescription:', err)
      setError('Failed to update prescription')
    } finally {
      setIsUpdating(false)
    }
  }, [loadPrescriptions])

  // Handle prescription deletion
  const handleDeletePrescription = useCallback(async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) {
      return
    }

    try {
      setIsUpdating(true)

      const result = await prescriptionService.deletePrescription(prescriptionId)

      if (result.success) {
        await loadPrescriptions()
        setSelectedPrescription(null)
        setShowDetailsDialog(false)
      } else {
        setError(result.error || 'Failed to delete prescription')
      }
    } catch (err) {
      console.error('Error deleting prescription:', err)
      setError('Failed to delete prescription')
    } finally {
      setIsUpdating(false)
    }
  }, [loadPrescriptions])

  // Handle file download
  const handleDownloadFile = useCallback(async (prescription: Prescription) => {
    if (!prescription.fileUrl) return

    try {
      const result = await prescriptionService.getPrescriptionFileUrl(prescription.id)
      
      if (result.success && result.data) {
        // Open file in new tab
        window.open(result.data, '_blank')
      } else {
        setError(result.error || 'Failed to get file URL')
      }
    } catch (err) {
      console.error('Error downloading file:', err)
      setError('Failed to download file')
    }
  }, [])

  // Get status badge variant
  const getStatusBadgeVariant = (status: Prescription['status']) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'expired':
        return 'outline'
      default:
        return 'default'
    }
  }

  // Get status icon
  const getStatusIcon = (status: Prescription['status']) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'expired':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Filter and sort prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.sort((a, b) => 
      b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
    )
  }, [prescriptions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prescription Management</h2>
          <p className="text-gray-600">
            {patientId ? 'Patient prescriptions' : 'Manage all prescriptions'}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
            </DialogHeader>
            <PrescriptionCreator
              patientId={patientId}
              patients={patients}
              onSubmit={handleCreatePrescription}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={isUpdating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient Search */}
            {!patientId && (
              <div className="space-y-2">
                <Label htmlFor="patient-search">Patient Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="patient-search"
                    placeholder="Search by patient name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Medication Search */}
            <div className="space-y-2">
              <Label htmlFor="medication-search">Medication Search</Label>
              <div className="relative">
                <Pill className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="medication-search"
                  placeholder="Search by medication"
                  value={medicationSearch}
                  onChange={(e) => setMedicationSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prescriptions ({filteredPrescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No prescriptions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadgeVariant(prescription.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(prescription.status)}
                              {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                            </div>
                          </Badge>
                          {prescription.fileUrl && (
                            <Badge variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              File Attached
                            </Badge>
                          )}
                        </div>

                        {/* Patient and Date */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {prescription.patientName && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {prescription.patientName}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(prescription.createdAt.toDate(), 'MMM dd, yyyy')}
                          </div>
                        </div>

                        {/* Diagnosis */}
                        <div>
                          <p className="font-medium">{prescription.diagnosis}</p>
                        </div>

                        {/* Medications */}
                        <div className="space-y-1">
                          {prescription.medications.slice(0, 2).map((medication, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              <span className="font-medium">{medication.name}</span>
                              {' - '}
                              <span>{medication.dosage}</span>
                              {', '}
                              <span>{medication.frequency}</span>
                            </div>
                          ))}
                          {prescription.medications.length > 2 && (
                            <p className="text-sm text-gray-500">
                              +{prescription.medications.length - 2} more medications
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {prescription.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(prescription)}
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription)
                            setShowDetailsDialog(true)
                          }}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(selectedPrescription.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedPrescription.status)}
                        {selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)}
                      </div>
                    </Badge>
                    {selectedPrescription.fileUrl && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        File Attached
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Created on {format(selectedPrescription.createdAt.toDate(), 'MMMM dd, yyyy \'at\' h:mm a')}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedPrescription.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadFile(selectedPrescription)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePrescription(selectedPrescription.id)}
                    disabled={isUpdating}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Patient</Label>
                    <p className="mt-1">{selectedPrescription.patientName || 'Unknown Patient'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Diagnosis</Label>
                    <p className="mt-1">{selectedPrescription.diagnosis}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Select
                        value={selectedPrescription.status}
                        onValueChange={(value) => 
                          handleUpdatePrescription(selectedPrescription.id, { 
                            status: value as Prescription['status'] 
                          })
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedPrescription.dispensedAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Dispensed At</Label>
                      <p className="mt-1">
                        {format(selectedPrescription.dispensedAt.toDate(), 'MMMM dd, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Medications</Label>
                <div className="space-y-4">
                  {selectedPrescription.medications.map((medication, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Medication</Label>
                            <p className="mt-1 font-medium">{medication.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Dosage</Label>
                            <p className="mt-1">{medication.dosage}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Frequency</Label>
                            <p className="mt-1">{medication.frequency}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Duration</Label>
                            <p className="mt-1">{medication.duration}</p>
                          </div>
                        </div>
                        
                        {medication.instructions && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-500">Instructions</Label>
                            <p className="mt-1">{medication.instructions}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Notes</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}