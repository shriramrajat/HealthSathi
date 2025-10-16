// Prescription service for managing e-prescriptions with Firebase integration
// Handles both typed prescriptions and file uploads

import { Timestamp, getDocs } from 'firebase/firestore'
import { 
  Prescription, 
  Medication, 
  PrescriptionFilters 
} from '@/lib/types/dashboard-models'
import { 
  validatePrescription, 
  validatePrescriptionUpdate 
} from '@/lib/validation/dashboard-schemas'
import { 
  dashboardOperations, 
  dashboardQueries, 
  dashboardSubscriptions 
} from '@/lib/firebase/dashboard-collections'
import { 
  storageOperations, 
  FileValidator, 
  UploadResult,
  UploadProgressCallback 
} from '@/lib/firebase/storage-utils'

// Prescription creation data
export interface CreatePrescriptionData {
  patientId: string
  doctorId: string
  appointmentId?: string
  medications: Medication[]
  diagnosis: string
  notes: string
  status?: 'active' | 'completed' | 'cancelled' | 'expired'
  expiryDate?: Date
  pharmacyId?: string
  patientName?: string
  doctorName?: string
}

// Prescription with file data
export interface CreatePrescriptionWithFileData extends Omit<CreatePrescriptionData, 'medications'> {
  medications?: Medication[]
  file: File
}

// Prescription update data
export interface UpdatePrescriptionData {
  medications?: Medication[]
  diagnosis?: string
  notes?: string
  status?: 'active' | 'completed' | 'cancelled' | 'expired'
  expiryDate?: Date
  pharmacyId?: string
  dispensedAt?: Date
}

// Prescription service result
export interface PrescriptionServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Prescription search options
export interface PrescriptionSearchOptions {
  patientSearch?: string
  medicationSearch?: string
  status?: Prescription['status'][]
  dateRange?: {
    start: Date
    end: Date
  }
  limit?: number
}

export class PrescriptionService {
  // Create prescription with typed medications
  async createPrescription(
    data: CreatePrescriptionData
  ): Promise<PrescriptionServiceResult<string>> {
    try {
      // Validate prescription data
      const prescriptionData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: data.status || 'active'
      }

      // Convert expiryDate if provided
      if (data.expiryDate) {
        (prescriptionData as any).expiryDate = Timestamp.fromDate(data.expiryDate)
      }

      const validation = validatePrescription(prescriptionData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation error: ${validation.error?.issues.map(i => i.message).join(', ')}`
        }
      }

      // Create prescription in Firestore
      const prescriptionId = await dashboardOperations.createPrescription(prescriptionData)

      return {
        success: true,
        data: prescriptionId
      }
    } catch (error) {
      console.error('Error creating prescription:', error)
      return {
        success: false,
        error: `Failed to create prescription: ${error}`
      }
    }
  }

  // Create prescription with file upload
  async createPrescriptionWithFile(
    data: CreatePrescriptionWithFileData,
    onUploadProgress?: UploadProgressCallback
  ): Promise<PrescriptionServiceResult<string>> {
    try {
      // Validate file
      const fileValidation = FileValidator.validatePrescriptionFile(data.file)
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.error || 'Invalid file'
        }
      }

      // Upload file to Firebase Storage
      let uploadResult: UploadResult
      try {
        uploadResult = await storageOperations.uploadPrescriptionFile(
          data.file,
          data.doctorId,
          data.patientId,
          onUploadProgress
        )
      } catch (uploadError) {
        return {
          success: false,
          error: `File upload failed: ${uploadError}`
        }
      }

      // Prepare prescription data with file information
      const prescriptionData: CreatePrescriptionData = {
        ...data,
        medications: data.medications || [], // Empty array if file-only prescription
        status: data.status || 'active'
      }

      // Add file information
      const prescriptionWithFile = {
        ...prescriptionData,
        fileUrl: uploadResult.downloadURL,
        fileName: uploadResult.fileName,
        fileType: this.getFileTypeFromContentType(uploadResult.contentType),
        status: prescriptionData.status || 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Convert expiryDate if provided
      if (prescriptionData.expiryDate) {
        (prescriptionWithFile as any).expiryDate = Timestamp.fromDate(prescriptionData.expiryDate)
      }

      // Validate prescription data
      const validation = validatePrescription(prescriptionWithFile)
      if (!validation.success) {
        // If validation fails, clean up uploaded file
        try {
          await storageOperations.deleteFile(uploadResult.filePath)
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError)
        }

        return {
          success: false,
          error: `Validation error: ${validation.error?.issues.map(i => i.message).join(', ')}`
        }
      }

      // Create prescription in Firestore
      const prescriptionId = await dashboardOperations.createPrescription(prescriptionWithFile)

      return {
        success: true,
        data: prescriptionId
      }
    } catch (error) {
      console.error('Error creating prescription with file:', error)
      return {
        success: false,
        error: `Failed to create prescription with file: ${error}`
      }
    }
  }

  // Update prescription
  async updatePrescription(
    prescriptionId: string,
    updates: UpdatePrescriptionData
  ): Promise<PrescriptionServiceResult<void>> {
    try {
      // Prepare update data with timestamp
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      }

      // Convert dates to Timestamps
      if (updates.dispensedAt) {
        updateData.dispensedAt = Timestamp.fromDate(updates.dispensedAt)
      }
      if (updates.expiryDate) {
        updateData.expiryDate = Timestamp.fromDate(updates.expiryDate)
      }

      // Validate update data
      const validation = validatePrescriptionUpdate(updateData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation error: ${validation.error?.issues.map(i => i.message).join(', ')}`
        }
      }

      // Update prescription in Firestore
      await dashboardOperations.updatePrescription(prescriptionId, updateData)

      return {
        success: true
      }
    } catch (error) {
      console.error('Error updating prescription:', error)
      return {
        success: false,
        error: `Failed to update prescription: ${error}`
      }
    }
  }

  // Get prescription by ID
  async getPrescription(prescriptionId: string): Promise<PrescriptionServiceResult<Prescription>> {
    try {
      const prescription = await dashboardOperations.getPrescription(prescriptionId)
      
      if (!prescription) {
        return {
          success: false,
          error: 'Prescription not found'
        }
      }

      return {
        success: true,
        data: prescription
      }
    } catch (error) {
      console.error('Error getting prescription:', error)
      return {
        success: false,
        error: `Failed to get prescription: ${error}`
      }
    }
  }

  // Get prescriptions for a doctor with filtering
  async getDoctorPrescriptions(
    doctorId: string,
    options: PrescriptionSearchOptions = {}
  ): Promise<PrescriptionServiceResult<Prescription[]>> {
    try {
      // Build filters
      const filters: PrescriptionFilters = {}
      
      if (options.status && options.status.length > 0) {
        filters.status = options.status
      }
      
      if (options.patientSearch) {
        filters.patientSearch = options.patientSearch
      }
      
      if (options.medicationSearch) {
        filters.medicationSearch = options.medicationSearch
      }
      
      if (options.dateRange) {
        filters.dateRange = {
          start: Timestamp.fromDate(options.dateRange.start),
          end: Timestamp.fromDate(options.dateRange.end)
        }
      }

      // Query prescriptions
      const query = await dashboardQueries.queryDoctorPrescriptions(
        doctorId, 
        filters, 
        options.limit || 100
      )
      
      const snapshot = await getDocs(query)
      const prescriptions: Prescription[] = []
      
      snapshot.forEach((doc) => {
        prescriptions.push({ id: doc.id, ...doc.data() } as Prescription)
      })

      // Apply client-side filtering for search terms (since Firestore has limited text search)
      let filteredPrescriptions = prescriptions

      if (options.patientSearch) {
        const searchTerm = options.patientSearch.toLowerCase()
        filteredPrescriptions = filteredPrescriptions.filter(prescription =>
          prescription.patientName?.toLowerCase().includes(searchTerm)
        )
      }

      if (options.medicationSearch) {
        const searchTerm = options.medicationSearch.toLowerCase()
        filteredPrescriptions = filteredPrescriptions.filter(prescription =>
          prescription.medications.some(med =>
            med.name.toLowerCase().includes(searchTerm)
          )
        )
      }

      return {
        success: true,
        data: filteredPrescriptions
      }
    } catch (error) {
      console.error('Error getting doctor prescriptions:', error)
      return {
        success: false,
        error: `Failed to get prescriptions: ${error}`
      }
    }
  }

  // Get prescriptions for a patient
  async getPatientPrescriptions(
    patientId: string,
    limit: number = 50
  ): Promise<PrescriptionServiceResult<Prescription[]>> {
    try {
      const query = await dashboardQueries.queryPatientPrescriptions(patientId, limit)
      const snapshot = await getDocs(query)
      
      const prescriptions: Prescription[] = []
      snapshot.forEach((doc) => {
        prescriptions.push({ id: doc.id, ...doc.data() } as Prescription)
      })

      return {
        success: true,
        data: prescriptions
      }
    } catch (error) {
      console.error('Error getting patient prescriptions:', error)
      return {
        success: false,
        error: `Failed to get patient prescriptions: ${error}`
      }
    }
  }

  // Subscribe to doctor's prescriptions with real-time updates
  async subscribeToDoctorPrescriptions(
    doctorId: string,
    callback: (prescriptions: Prescription[]) => void,
    filters?: PrescriptionFilters
  ): Promise<() => void> {
    try {
      const unsubscribe = await dashboardSubscriptions.subscribeToPrescriptions(
        doctorId,
        callback,
        filters
      )
      return unsubscribe
    } catch (error) {
      console.error('Error subscribing to prescriptions:', error)
      throw error
    }
  }

  // Get secure download URL for prescription file
  async getPrescriptionFileUrl(
    prescriptionId: string
  ): Promise<PrescriptionServiceResult<string>> {
    try {
      const prescription = await this.getPrescription(prescriptionId)
      
      if (!prescription.success || !prescription.data) {
        return {
          success: false,
          error: 'Prescription not found'
        }
      }

      if (!prescription.data.fileUrl) {
        return {
          success: false,
          error: 'No file associated with this prescription'
        }
      }

      // Return the existing download URL (Firebase Storage URLs are already secure with expiration)
      return {
        success: true,
        data: prescription.data.fileUrl
      }
    } catch (error) {
      console.error('Error getting prescription file URL:', error)
      return {
        success: false,
        error: `Failed to get file URL: ${error}`
      }
    }
  }

  // Delete prescription and associated file
  async deletePrescription(prescriptionId: string): Promise<PrescriptionServiceResult<void>> {
    try {
      // Get prescription to check for associated file
      const prescriptionResult = await this.getPrescription(prescriptionId)
      
      if (!prescriptionResult.success || !prescriptionResult.data) {
        return {
          success: false,
          error: 'Prescription not found'
        }
      }

      const prescription = prescriptionResult.data

      // Delete associated file if exists
      if (prescription.fileUrl) {
        try {
          // Extract file path from URL or use stored file path
          // Note: This is a simplified approach. In production, you might want to store the file path separately
          const filePath = this.extractFilePathFromUrl(prescription.fileUrl)
          if (filePath) {
            await storageOperations.deleteFile(filePath)
          }
        } catch (fileError) {
          console.error('Error deleting prescription file:', fileError)
          // Continue with prescription deletion even if file deletion fails
        }
      }

      // Delete prescription document
      await dashboardOperations.deletePrescription(prescriptionId)

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting prescription:', error)
      return {
        success: false,
        error: `Failed to delete prescription: ${error}`
      }
    }
  }

  // Mark prescription as dispensed
  async markPrescriptionAsDispensed(
    prescriptionId: string,
    pharmacyId?: string
  ): Promise<PrescriptionServiceResult<void>> {
    return this.updatePrescription(prescriptionId, {
      status: 'completed',
      dispensedAt: new Date(),
      ...(pharmacyId && { pharmacyId })
    })
  }

  // Cancel prescription
  async cancelPrescription(prescriptionId: string): Promise<PrescriptionServiceResult<void>> {
    return this.updatePrescription(prescriptionId, {
      status: 'cancelled'
    })
  }

  // Helper methods
  private getFileTypeFromContentType(contentType: string): 'pdf' | 'jpg' | 'png' {
    switch (contentType) {
      case 'application/pdf':
        return 'pdf'
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg'
      case 'image/png':
        return 'png'
      default:
        return 'pdf' // Default fallback
    }
  }

  private extractFilePathFromUrl(url: string): string | null {
    try {
      // This is a simplified extraction. In production, you might want to store file paths separately
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const encodedPath = pathParts[pathParts.length - 1]
      return decodeURIComponent(encodedPath)
    } catch (error) {
      console.error('Error extracting file path from URL:', error)
      return null
    }
  }

  // Get prescription statistics for dashboard
  async getPrescriptionStatistics(
    doctorId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<PrescriptionServiceResult<{
    total: number
    active: number
    completed: number
    cancelled: number
    expired: number
    todayCount: number
  }>> {
    try {
      const options: PrescriptionSearchOptions = {
        limit: 1000 // Get all prescriptions for statistics
      }

      if (dateRange) {
        options.dateRange = dateRange
      }

      const result = await this.getDoctorPrescriptions(doctorId, options)
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to get prescriptions'
        }
      }

      const prescriptions = result.data
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const statistics = {
        total: prescriptions.length,
        active: prescriptions.filter(p => p.status === 'active').length,
        completed: prescriptions.filter(p => p.status === 'completed').length,
        cancelled: prescriptions.filter(p => p.status === 'cancelled').length,
        expired: prescriptions.filter(p => p.status === 'expired').length,
        todayCount: prescriptions.filter(p => {
          const createdAt = p.createdAt.toDate()
          return createdAt >= startOfDay && createdAt < endOfDay
        }).length
      }

      return {
        success: true,
        data: statistics
      }
    } catch (error) {
      console.error('Error getting prescription statistics:', error)
      return {
        success: false,
        error: `Failed to get prescription statistics: ${error}`
      }
    }
  }
}

// Export singleton instance
export const prescriptionService = new PrescriptionService()

// Export types for external use
export type {
  CreatePrescriptionData as CreatePrescriptionDataType,
  CreatePrescriptionWithFileData as CreatePrescriptionWithFileDataType,
  UpdatePrescriptionData as UpdatePrescriptionDataType,
  PrescriptionServiceResult as PrescriptionServiceResultType,
  PrescriptionSearchOptions as PrescriptionSearchOptionsType
}