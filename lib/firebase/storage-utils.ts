// Firebase Storage utilities for Doctor Dashboard
// Handles file uploads for prescriptions and other medical documents

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage'

import { getFirebaseStorage } from '../firebase'

// File type validation
export const ALLOWED_FILE_TYPES = {
  PRESCRIPTION: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  PROFILE: ['image/jpeg', 'image/png', 'image/jpg'],
  CONSULTATION: ['video/mp4', 'video/webm', 'audio/mp3', 'audio/wav']
} as const

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  PRESCRIPTION: 10 * 1024 * 1024, // 10MB
  PROFILE: 5 * 1024 * 1024, // 5MB
  CONSULTATION: 100 * 1024 * 1024 // 100MB
} as const

// Storage paths
export const STORAGE_PATHS = {
  PRESCRIPTIONS: 'prescriptions',
  PROFILES: 'profiles',
  CONSULTATIONS: 'consultations'
} as const

// File validation result
export interface FileValidationResult {
  isValid: boolean
  error?: string
}

// Upload progress callback
export type UploadProgressCallback = (progress: number) => void

// Upload result
export interface UploadResult {
  downloadURL: string
  fileName: string
  filePath: string
  fileSize: number
  contentType: string
}

// File validation utilities
export class FileValidator {
  static validatePrescriptionFile(file: File): FileValidationResult {
    // Check file type
    if (!ALLOWED_FILE_TYPES.PRESCRIPTION.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'
      }
    }

    // Check file size
    if (file.size > FILE_SIZE_LIMITS.PRESCRIPTION) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 10MB.'
      }
    }

    // Check file name
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'File name too long. Maximum length is 255 characters.'
      }
    }

    return { isValid: true }
  }

  static validateProfileImage(file: File): FileValidationResult {
    // Check file type
    if (!ALLOWED_FILE_TYPES.PROFILE.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPG and PNG images are allowed.'
      }
    }

    // Check file size
    if (file.size > FILE_SIZE_LIMITS.PROFILE) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 5MB.'
      }
    }

    return { isValid: true }
  }

  static validateConsultationRecording(file: File): FileValidationResult {
    // Check file type
    if (!ALLOWED_FILE_TYPES.CONSULTATION.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only MP4, WebM, MP3, and WAV files are allowed.'
      }
    }

    // Check file size
    if (file.size > FILE_SIZE_LIMITS.CONSULTATION) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 100MB.'
      }
    }

    return { isValid: true }
  }
}

// Storage operations
export class StorageOperations {
  private storage: any

  constructor() {
    this.initializeStorage()
  }

  private async initializeStorage() {
    this.storage = await getFirebaseStorage()
  }

  // Generate secure file path
  private generateFilePath(
    basePath: string,
    userId: string,
    fileName: string,
    additionalPath?: string
  ): string {
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    
    if (additionalPath) {
      return `${basePath}/${userId}/${additionalPath}/${uniqueFileName}`
    }
    
    return `${basePath}/${userId}/${uniqueFileName}`
  }

  // Upload prescription file
  async uploadPrescriptionFile(
    file: File,
    doctorId: string,
    patientId: string,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    if (!this.storage) await this.initializeStorage()

    // Validate file
    const validation = FileValidator.validatePrescriptionFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Generate file path
    const filePath = this.generateFilePath(
      STORAGE_PATHS.PRESCRIPTIONS,
      doctorId,
      file.name,
      patientId
    )

    // Create storage reference
    const storageRef = ref(this.storage, filePath)

    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        doctorId,
        patientId,
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    }

    try {
      let uploadTask: UploadTask

      if (onProgress) {
        // Use resumable upload with progress tracking
        uploadTask = uploadBytesResumable(storageRef, file, metadata)
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              onProgress(progress)
            },
            (error) => {
              console.error('Upload error:', error)
              reject(new Error(`Upload failed: ${error.message}`))
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve({
                  downloadURL,
                  fileName: file.name,
                  filePath,
                  fileSize: file.size,
                  contentType: file.type
                })
              } catch (error) {
                reject(error)
              }
            }
          )
        })
      } else {
        // Simple upload without progress tracking
        const snapshot = await uploadBytes(storageRef, file, metadata)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        return {
          downloadURL,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          contentType: file.type
        }
      }
    } catch (error) {
      console.error('Error uploading prescription file:', error)
      throw new Error(`Failed to upload prescription file: ${error}`)
    }
  }

  // Upload profile image
  async uploadProfileImage(
    file: File,
    userId: string,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    if (!this.storage) await this.initializeStorage()

    // Validate file
    const validation = FileValidator.validateProfileImage(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Generate file path
    const filePath = this.generateFilePath(
      STORAGE_PATHS.PROFILES,
      userId,
      file.name
    )

    // Create storage reference
    const storageRef = ref(this.storage, filePath)

    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    }

    try {
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, file, metadata)
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              onProgress(progress)
            },
            (error) => {
              reject(new Error(`Upload failed: ${error.message}`))
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve({
                  downloadURL,
                  fileName: file.name,
                  filePath,
                  fileSize: file.size,
                  contentType: file.type
                })
              } catch (error) {
                reject(error)
              }
            }
          )
        })
      } else {
        const snapshot = await uploadBytes(storageRef, file, metadata)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        return {
          downloadURL,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          contentType: file.type
        }
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      throw new Error(`Failed to upload profile image: ${error}`)
    }
  }

  // Upload consultation recording
  async uploadConsultationRecording(
    file: File,
    consultationId: string,
    doctorId: string,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    if (!this.storage) await this.initializeStorage()

    // Validate file
    const validation = FileValidator.validateConsultationRecording(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Generate file path
    const filePath = this.generateFilePath(
      STORAGE_PATHS.CONSULTATIONS,
      doctorId,
      file.name,
      consultationId
    )

    // Create storage reference
    const storageRef = ref(this.storage, filePath)

    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        consultationId,
        doctorId,
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    }

    try {
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, file, metadata)
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              onProgress(progress)
            },
            (error) => {
              reject(new Error(`Upload failed: ${error.message}`))
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve({
                  downloadURL,
                  fileName: file.name,
                  filePath,
                  fileSize: file.size,
                  contentType: file.type
                })
              } catch (error) {
                reject(error)
              }
            }
          )
        })
      } else {
        const snapshot = await uploadBytes(storageRef, file, metadata)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        return {
          downloadURL,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          contentType: file.type
        }
      }
    } catch (error) {
      console.error('Error uploading consultation recording:', error)
      throw new Error(`Failed to upload consultation recording: ${error}`)
    }
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    if (!this.storage) await this.initializeStorage()

    try {
      const storageRef = ref(this.storage, filePath)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }

  // Get file metadata
  async getFileMetadata(filePath: string) {
    if (!this.storage) await this.initializeStorage()

    try {
      const storageRef = ref(this.storage, filePath)
      return await getMetadata(storageRef)
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error(`Failed to get file metadata: ${error}`)
    }
  }

  // Get download URL for existing file
  async getDownloadURL(filePath: string): Promise<string> {
    if (!this.storage) await this.initializeStorage()

    try {
      const storageRef = ref(this.storage, filePath)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error('Error getting download URL:', error)
      throw new Error(`Failed to get download URL: ${error}`)
    }
  }
}

// Export singleton instance
export const storageOperations = new StorageOperations()

// Utility functions
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/')
}

export function isPDFFile(contentType: string): boolean {
  return contentType === 'application/pdf'
}

export function isVideoFile(contentType: string): boolean {
  return contentType.startsWith('video/')
}

export function isAudioFile(contentType: string): boolean {
  return contentType.startsWith('audio/')
}