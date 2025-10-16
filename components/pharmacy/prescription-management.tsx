"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Eye,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  User,
  Stethoscope,
  Pill,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Prescription, PrescriptionQueue, Medicine } from "@/lib/types/healthcare-models"
import { toast } from "sonner"
import { notificationTriggersService } from "@/lib/services/notification-triggers"

interface PrescriptionManagementProps {
  pharmacyId: string
  onPrescriptionUpdate?: () => void
}

export default function PrescriptionManagement({ pharmacyId, onPrescriptionUpdate }: PrescriptionManagementProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [prescriptionQueue, setPrescriptionQueue] = useState<PrescriptionQueue[]>([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [dispensingNotes, setDispensingNotes] = useState('')

  // Fetch prescriptions and queue
  const fetchPrescriptionData = async () => {
    setIsLoading(true)
    try {
      // Fetch prescriptions assigned to this pharmacy
      const prescriptionsQuery = query(
        collection(db, 'prescriptions'),
        where('pharmacyId', '==', pharmacyId),
        orderBy('createdAt', 'desc')
      )
      
      const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
      const prescriptionsList: Prescription[] = []
      
      prescriptionsSnapshot.forEach((doc) => {
        prescriptionsList.push({
          id: doc.id,
          ...doc.data()
        } as Prescription)
      })
      
      setPrescriptions(prescriptionsList)
      setFilteredPrescriptions(prescriptionsList)

      // Fetch prescription queue
      const queueQuery = query(
        collection(db, 'prescription-queue'),
        where('pharmacyId', '==', pharmacyId),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'asc')
      )
      
      const queueSnapshot = await getDocs(queueQuery)
      const queueList: PrescriptionQueue[] = []
      
      queueSnapshot.forEach((doc) => {
        queueList.push({
          id: doc.id,
          ...doc.data()
        } as PrescriptionQueue)
      })
      
      setPrescriptionQueue(queueList)
      
    } catch (error) {
      console.error('Error fetching prescription data:', error)
      toast.error('Failed to load prescriptions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (pharmacyId) {
      fetchPrescriptionData()
    }
  }, [pharmacyId])

  // Filter prescriptions based on search and filters
  useEffect(() => {
    let filtered = prescriptions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some(medicine => 
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === filterStatus)
    }

    setFilteredPrescriptions(filtered)
  }, [prescriptions, searchTerm, filterStatus])

  // Handle prescription processing (add to queue)
  const handleProcessPrescription = async (prescription: Prescription) => {
    try {
      // Check if already in queue
      const existingQueue = prescriptionQueue.find(q => q.prescriptionId === prescription.id)
      if (existingQueue) {
        toast.error('Prescription is already in the processing queue')
        return
      }

      // Add to prescription queue
      const queueItem = {
        prescriptionId: prescription.id,
        pharmacyId,
        patientId: prescription.patientId,
        patientName: prescription.patientName || 'Unknown Patient',
        doctorName: prescription.doctorName || 'Unknown Doctor',
        medicines: prescription.medicines,
        priority: 'normal' as const,
        status: 'pending' as const,
        estimatedTime: prescription.medicines.length * 15, // 15 minutes per medicine
        queuePosition: prescriptionQueue.length + 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await addDoc(collection(db, 'prescription-queue'), queueItem)
      
      toast.success('Prescription added to processing queue')
      fetchPrescriptionData()
      onPrescriptionUpdate?.()
    } catch (error) {
      console.error('Error processing prescription:', error)
      toast.error('Failed to process prescription')
    }
  }

  // Handle queue status update
  const handleUpdateQueueStatus = async (queueItem: PrescriptionQueue, newStatus: PrescriptionQueue['status']) => {
    try {
      await updateDoc(doc(db, 'prescription-queue', queueItem.id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      })

      // Trigger notification when prescription is ready for pickup
      if (newStatus === 'ready') {
        try {
          const prescription = prescriptions.find(p => p.id === queueItem.prescriptionId)
          if (prescription) {
            await notificationTriggersService.triggerPrescriptionReady(prescription, pharmacyId)
          }
        } catch (notificationError) {
          console.warn('Failed to send prescription ready notification:', notificationError)
          // Don't fail the status update if notification fails
        }
      }
      
      toast.success(`Prescription marked as ${newStatus.replace('-', ' ')}`)
      fetchPrescriptionData()
      onPrescriptionUpdate?.()
    } catch (error) {
      console.error('Error updating queue status:', error)
      toast.error('Failed to update status')
    }
  }

  // Handle prescription dispensing
  const handleDispensePrescription = async (prescription: Prescription) => {
    try {
      // Update prescription status
      await updateDoc(doc(db, 'prescriptions', prescription.id), {
        status: 'dispensed',
        dispensedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        dispensingNotes: dispensingNotes,
      })

      // Remove from queue if exists
      const queueItem = prescriptionQueue.find(q => q.prescriptionId === prescription.id)
      if (queueItem) {
        await updateDoc(doc(db, 'prescription-queue', queueItem.id), {
          status: 'dispensed',
          updatedAt: Timestamp.now(),
        })
      }

      // Trigger prescription dispensed notification
      try {
        await notificationTriggersService.triggerPrescriptionDispensed(prescription, pharmacyId)
      } catch (notificationError) {
        console.warn('Failed to send prescription dispensed notification:', notificationError)
        // Don't fail the dispensing if notification fails
      }
      
      toast.success('Prescription marked as dispensed')
      setIsDispenseDialogOpen(false)
      setSelectedPrescription(null)
      setDispensingNotes('')
      fetchPrescriptionData()
      onPrescriptionUpdate?.()
    } catch (error) {
      console.error('Error dispensing prescription:', error)
      toast.error('Failed to dispense prescription')
    }
  }

  // Open prescription details
  const openPrescriptionDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setIsViewDialogOpen(true)
  }

  // Open dispense dialog
  const openDispenseDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setIsDispenseDialogOpen(true)
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'secondary'
      case 'dispensed': return 'default'
      case 'cancelled': return 'destructive'
      case 'expired': return 'outline'
      default: return 'secondary'
    }
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'normal': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  // Get queue status color
  const getQueueStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'in-progress': return 'default'
      case 'ready': return 'default'
      case 'dispensed': return 'outline'
      default: return 'secondary'
    }
  }

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Prescription Management</h2>
          <p className="text-muted-foreground">Process and dispense prescriptions from doctors</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchPrescriptionData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold">{prescriptions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {prescriptions.filter(p => p.status === 'issued').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Queue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {prescriptionQueue.filter(q => q.status !== 'dispensed').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dispensed</p>
                <p className="text-2xl font-bold text-green-600">
                  {prescriptions.filter(p => p.status === 'dispensed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions, patients, doctors, or medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="dispensed">Dispensed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {prescriptionQueue.filter(q => q.status !== 'dispensed').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Processing Queue</span>
              <Badge variant="outline">
                {prescriptionQueue.filter(q => q.status !== 'dispensed').length} items
              </Badge>
            </CardTitle>
            <CardDescription>
              Prescriptions currently being processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescriptionQueue
                .filter(q => q.status !== 'dispensed')
                .map((queueItem, index) => (
                <div key={queueItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-semibold">{queueItem.patientName}</div>
                      <div className="text-sm text-muted-foreground">
                        Dr. {queueItem.doctorName} • {queueItem.medicines.length} medicines
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={getQueueStatusColor(queueItem.status) as any}>
                      {queueItem.status.replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {queueItem.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateQueueStatus(queueItem, 'in-progress')}
                        >
                          Start Processing
                        </Button>
                      )}
                      {queueItem.status === 'in-progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateQueueStatus(queueItem, 'ready')}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {queueItem.status === 'ready' && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const prescription = prescriptions.find(p => p.id === queueItem.prescriptionId)
                            if (prescription) openDispenseDialog(prescription)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Dispense
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions table */}
      <Card>
        <CardHeader>
          <CardTitle>All Prescriptions</CardTitle>
          <CardDescription>
            View and manage all prescriptions assigned to your pharmacy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">
                            {prescription.patientName || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {prescription.diagnosis}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span>{prescription.doctorName || 'Unknown Doctor'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {prescription.medicines.slice(0, 2).map((medicine, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{medicine.name}</span>
                            <span className="text-muted-foreground ml-2">{medicine.dosage}</span>
                          </div>
                        ))}
                        {prescription.medicines.length > 2 && (
                          <div className="text-sm text-muted-foreground">
                            +{prescription.medicines.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(prescription.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(prescription.status) as any}>
                        {prescription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPrescriptionDetails(prescription)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {prescription.status === 'issued' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcessPrescription(prescription)}
                            >
                              Process
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openDispenseDialog(prescription)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Dispense
                            </Button>
                          </>
                        )}
                        {prescription.status === 'dispensed' && prescription.dispensedAt && (
                          <div className="text-sm text-muted-foreground">
                            Dispensed {formatDate(prescription.dispensedAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No prescriptions match your filters' 
                  : 'No prescriptions found'
                }
              </p>
              <p className="text-sm">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Prescriptions from doctors will appear here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Prescription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Complete prescription information
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Patient</Label>
                  <p className="font-semibold">{selectedPrescription.patientName || 'Unknown Patient'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Doctor</Label>
                  <p className="font-semibold">{selectedPrescription.doctorName || 'Unknown Doctor'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Diagnosis</Label>
                <p className="mt-1">{selectedPrescription.diagnosis}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Medicines</Label>
                <div className="mt-2 space-y-3">
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{medicine.name}</h4>
                        <Badge variant="outline">{medicine.dosage}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Frequency: {medicine.frequency}</div>
                        <div>Duration: {medicine.duration}</div>
                        {medicine.quantity && <div>Quantity: {medicine.quantity}</div>}
                        {medicine.refills && <div>Refills: {medicine.refills}</div>}
                      </div>
                      {medicine.instructions && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Instructions:</span> {medicine.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Doctor's Notes</Label>
                  <p className="mt-1">{selectedPrescription.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date Issued</Label>
                  <p>{formatDate(selectedPrescription.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedPrescription.status) as any}>
                    {selectedPrescription.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedPrescription?.status === 'issued' && (
              <Button onClick={() => {
                setIsViewDialogOpen(false)
                openDispenseDialog(selectedPrescription)
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Dispense
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispense Prescription Dialog */}
      <Dialog open={isDispenseDialogOpen} onOpenChange={setIsDispenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispense Prescription</DialogTitle>
            <DialogDescription>
              Mark this prescription as dispensed to the patient
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="font-semibold mb-2">
                  {selectedPrescription.patientName || 'Unknown Patient'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedPrescription.medicines.length} medicine(s) prescribed by Dr. {selectedPrescription.doctorName}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dispensingNotes">Dispensing Notes (Optional)</Label>
                <Textarea
                  id="dispensingNotes"
                  placeholder="Add any notes about the dispensing process..."
                  value={dispensingNotes}
                  onChange={(e) => setDispensingNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDispenseDialogOpen(false)
              setDispensingNotes('')
            }}>
              Cancel
            </Button>
            <Button onClick={() => selectedPrescription && handleDispensePrescription(selectedPrescription)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Dispensed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}