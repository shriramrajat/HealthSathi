// QR Code System Types
// Shared types and interfaces for digital health records QR code system

import { Timestamp, GeoPoint } from 'firebase/firestore'
import { UserRole } from './healthcare-models'

// ============================================================================
// QR CODE CORE TYPES
// ============================================================================

export type QRCodeType = 'patient_record' | 'appointment' | 'prescription' | 'emergency' | 'temporary'
export type QRCodeStatus = 'active' | 'expired' | 'revoked' | 'suspended'
export type AccessLevel = 'full' | 'limited' | 'emergency_only' | 'view_only'

export interface QRCode {
  id: string
  patientId: string
  qrCode: string // The actual QR code string/hash
  qrCodeUrl?: string // URL to QR code image
  type: QRCodeType
  status: QRCodeStatus
  accessLevel: AccessLevel
  generatedAt: Timestamp
  expiresAt?: Timestamp
  lastUpdatedAt: Timestamp
  isActive: boolean
  metadata: QRCodeMetadata
}

export interface QRCodeMetadata {
  version: string // QR code format version
  encoding: 'base64' | 'hex' | 'uuid'
  size: number // QR code size in pixels
  errorCorrection: 'L' | 'M' | 'Q' | 'H' // Error correction level
  format: 'png' | 'svg' | 'jpeg'
  backgroundColor: string
  foregroundColor: string
  includeMargin: boolean
  customData?: Record<string, any>
}

// ============================================================================
// QR HEALTH RECORD TYPES
// ============================================================================

export interface QRHealthRecord {
  id: string
  patientId: string
  qrId: string
  recordData: HealthRecordData
  accessPermissions: AccessPermission[]
  generatedAt: Timestamp
  lastAccessedAt?: Timestamp
  accessCount: number
  isActive: boolean
  expiresAt?: Timestamp
  emergencyContacts: EmergencyContactInfo[]
}

export interface HealthRecordData {
  basicInfo: PatientBasicInfo
  medicalHistory: MedicalHistoryItem[]
  currentMedications: CurrentMedication[]
  allergies: AllergyInfo[]
  emergencyInfo: EmergencyInfo
  lastUpdated: Timestamp
  dataVersion: string
}

export interface PatientBasicInfo {
  name: string
  dateOfBirth: Timestamp
  gender: 'male' | 'female' | 'other'
  bloodType?: string
  height?: number
  weight?: number
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

export interface MedicalHistoryItem {
  id: string
  condition: string
  diagnosedDate: Timestamp
  status: 'active' | 'resolved' | 'chronic'
  severity: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
  treatingPhysician?: string
}

export interface CurrentMedication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: Timestamp
  endDate?: Timestamp
  prescribedBy: string
  purpose: string
  sideEffects?: string[]
}

export interface AllergyInfo {
  id: string
  allergen: string
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'
  reaction: string
  firstOccurrence?: Timestamp
  notes?: string
}

export interface EmergencyInfo {
  bloodType?: string
  criticalAllergies: string[]
  currentMedications: string[]
  emergencyConditions: string[]
  emergencyContacts: EmergencyContactInfo[]
  preferredHospital?: string
  insuranceInfo?: {
    provider: string
    policyNumber: string
  }
}

export interface EmergencyContactInfo {
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary: boolean
  canMakeDecisions: boolean
}

// ============================================================================
// QR ACCESS AND PERMISSIONS
// ============================================================================

export interface AccessPermission {
  id: string
  grantedTo: string // User ID
  grantedBy: string // User ID who granted permission
  role: UserRole
  accessLevel: AccessLevel
  permissions: PermissionSet
  grantedAt: Timestamp
  expiresAt?: Timestamp
  isActive: boolean
  conditions?: AccessCondition[]
}

export interface PermissionSet {
  canViewBasicInfo: boolean
  canViewMedicalHistory: boolean
  canViewMedications: boolean
  canViewAllergies: boolean
  canViewEmergencyInfo: boolean
  canUpdateRecords: boolean
  canGrantAccess: boolean
  canRevokeAccess: boolean
  canGenerateNewQR: boolean
}

export interface AccessCondition {
  type: 'location' | 'time' | 'emergency' | 'role' | 'facility'
  value: any
  description: string
}

// ============================================================================
// QR SCANNING TYPES
// ============================================================================

export interface QRScanResult {
  success: boolean
  qrId?: string
  patientId?: string
  recordData?: HealthRecordData
  accessLevel?: AccessLevel
  error?: QRScanError
  scannedAt: Timestamp
  scannedBy: string
  scannerRole: UserRole
  location?: GeoPoint
}

export interface QRScanError {
  code: QRErrorCode
  message: string
  details?: string
  canRetry: boolean
  suggestedAction?: string
}

export type QRErrorCode = 
  | 'INVALID_QR'
  | 'EXPIRED_QR'
  | 'REVOKED_QR'
  | 'ACCESS_DENIED'
  | 'PATIENT_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'QR_CORRUPTED'
  | 'RATE_LIMITED'
  | 'SYSTEM_ERROR'

export interface QRScanLog {
  id: string
  qrId: string
  patientId: string
  scannedBy: string
  scannerRole: UserRole
  scannerName?: string
  location?: GeoPoint
  facility?: string
  purpose: QRScanPurpose
  accessGranted: boolean
  accessLevel?: AccessLevel
  denialReason?: string
  scannedAt: Timestamp
  sessionDuration?: number // in seconds
  dataAccessed: string[] // which parts of the record were accessed
  ipAddress?: string
  userAgent?: string
}

export type QRScanPurpose = 
  | 'emergency'
  | 'consultation'
  | 'prescription'
  | 'admission'
  | 'discharge'
  | 'routine_check'
  | 'referral'
  | 'insurance'
  | 'research'
  | 'audit'
  | 'other'

// ============================================================================
// QR GENERATION TYPES
// ============================================================================

export interface QRGenerationRequest {
  patientId: string
  type: QRCodeType
  accessLevel: AccessLevel
  expiresAt?: Timestamp
  customData?: Record<string, any>
  permissions?: PermissionSet
  emergencyOnly?: boolean
  includePhoto?: boolean
  format?: 'png' | 'svg' | 'jpeg'
  size?: number
}

export interface QRGenerationResult {
  success: boolean
  qrId?: string
  qrCode?: string
  qrCodeUrl?: string
  expiresAt?: Timestamp
  error?: string
  generatedAt: Timestamp
}

export interface QRCodeConfig {
  defaultSize: number
  defaultFormat: 'png' | 'svg' | 'jpeg'
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
  backgroundColor: string
  foregroundColor: string
  includeMargin: boolean
  logoUrl?: string
  logoSize?: number
  customStyling?: QRStyling
}

export interface QRStyling {
  cornerRadius?: number
  dotStyle?: 'square' | 'rounded' | 'dots'
  eyeStyle?: 'square' | 'rounded' | 'circle'
  gradientColors?: string[]
  borderWidth?: number
  borderColor?: string
}

// ============================================================================
// QR SYSTEM ANALYTICS
// ============================================================================

export interface QRSystemAnalytics {
  totalQRCodes: number
  activeQRCodes: number
  expiredQRCodes: number
  revokedQRCodes: number
  totalScans: number
  successfulScans: number
  failedScans: number
  scansByRole: Record<UserRole, number>
  scansByPurpose: Record<QRScanPurpose, number>
  averageScansPerQR: number
  mostScannedPatients: PatientScanStats[]
  scanTrends: ScanTrendData[]
  errorDistribution: Record<QRErrorCode, number>
  timeRange: {
    start: Timestamp
    end: Timestamp
  }
}

export interface PatientScanStats {
  patientId: string
  patientName: string
  totalScans: number
  uniqueScanners: number
  lastScanned: Timestamp
  mostCommonPurpose: QRScanPurpose
}

export interface ScanTrendData {
  date: string
  totalScans: number
  successfulScans: number
  failedScans: number
  uniquePatients: number
  uniqueScanners: number
}

// ============================================================================
// QR SECURITY TYPES
// ============================================================================

export interface QRSecurityConfig {
  encryptionEnabled: boolean
  encryptionAlgorithm: string
  keyRotationDays: number
  maxAccessAttempts: number
  lockoutDurationMinutes: number
  requireLocationVerification: boolean
  allowedLocations?: GeoPoint[]
  locationRadiusMeters?: number
  requireBiometricAuth: boolean
  sessionTimeoutMinutes: number
  auditLogRetentionDays: number
}

export interface QRSecurityEvent {
  id: string
  qrId: string
  patientId: string
  eventType: SecurityEventType
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  ipAddress?: string
  location?: GeoPoint
  timestamp: Timestamp
  resolved: boolean
  resolvedAt?: Timestamp
  resolvedBy?: string
  notes?: string
}

export type SecurityEventType = 
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'MULTIPLE_FAILED_SCANS'
  | 'SUSPICIOUS_LOCATION'
  | 'QR_CODE_COMPROMISED'
  | 'DATA_BREACH_ATTEMPT'
  | 'PERMISSION_ESCALATION'
  | 'UNUSUAL_ACCESS_PATTERN'
  | 'EXPIRED_QR_USAGE'
  | 'REVOKED_QR_USAGE'
  | 'SYSTEM_INTRUSION'

// ============================================================================
// QR UI COMPONENT TYPES
// ============================================================================

export interface QRScannerProps {
  onScanSuccess: (result: QRScanResult) => void
  onScanError: (error: QRScanError) => void
  purpose: QRScanPurpose
  allowedQRTypes?: QRCodeType[]
  showPreview?: boolean
  enableTorch?: boolean
  scanDelay?: number
}

export interface QRDisplayProps {
  qrCode: string
  size?: number
  format?: 'png' | 'svg'
  includePatientInfo?: boolean
  showExpiryDate?: boolean
  customStyling?: QRStyling
}

export interface QRRecordViewProps {
  recordData: HealthRecordData
  accessLevel: AccessLevel
  canEdit?: boolean
  onUpdate?: (data: Partial<HealthRecordData>) => void
  showSensitiveData?: boolean
}

// ============================================================================
// EXPORT UTILITY TYPES
// ============================================================================

export type QRCodeFormat = QRCodeMetadata['format']
export type QRErrorCorrectionLevel = QRCodeMetadata['errorCorrection']
export type QRDotStyle = QRStyling['dotStyle']
export type QRSecurityEventSeverity = QRSecurityEvent['severity']