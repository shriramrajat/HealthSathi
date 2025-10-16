// Healthcare Platform Types - Main Export File
// Centralized exports for all healthcare platform type definitions

// Core healthcare models (primary exports)
export * from './healthcare-models'

// Firestore schemas and validation (selective exports to avoid conflicts)
export type {
  PatientSchema,
  AppointmentSchema,
  PrescriptionSchema,
  PharmacySchema,
  PharmacyStockSchema,
  PrescriptionQueueSchema,
  CHWSchema,
  CHWLogSchema,
  EmergencyLogSchema,
  SymptomResultSchema,
  QRHealthRecordSchema,
  QRScanLogSchema,
  ConsultationSchema,
  NotificationConfigSchema,
  NotificationSchema,
  COLLECTION_PATHS,
  FIRESTORE_INDEXES
} from './firestore-schemas'

// Firestore validation functions with prefixes to avoid conflicts
export {
  validatePatient as validatePatientFirestore,
  validateAppointment as validateAppointmentFirestore,
  validatePrescription as validatePrescriptionFirestore,
  validatePharmacyStock as validatePharmacyStockFirestore,
  validateCHWLog as validateCHWLogFirestore,
  validateSymptomResult as validateSymptomResultFirestore,
  validateQRHealthRecord as validateQRHealthRecordFirestore,
  validateConsultation as validateConsultationFirestore,
  validateNotification as validateNotificationFirestore
} from './firestore-schemas'

// Symptom checker system types (selective exports to avoid conflicts)
export type {
  SymptomUrgencyLevel,
  Symptom,
  SymptomCondition,
  SymptomCheckerSession,
  SymptomCheckerStep,
  SymptomAnswer,
  SymptomAnalysisResult,
  MatchedRule,
  RecommendedAction,
  SpecialistReferral,
  SymptomCheckerProps,
  SymptomSelectionProps,
  SymptomResultsProps,
  SymptomCheckerConfig,
  SymptomCheckerAnalytics,
  SymptomFrequency,
  UrgencyDistribution,
  SymptomValidationResult,
  SymptomRuleValidation,
  ValidationError,
  ValidationWarning,
  SymptomHistory,
  SymptomTrend,
  SymptomOccurrence,
  SymptomCheckerMode,
  SymptomConditionType,
  RecommendedActionType,
  SymptomTrendDirection,
  SymptomSeverityTrend
} from './symptom-checker-types'

// QR code system types (selective exports to avoid conflicts)
export type {
  QRCodeType,
  QRCodeStatus,
  AccessLevel,
  QRCode,
  QRCodeMetadata,
  HealthRecordData,
  PatientBasicInfo,
  MedicalHistoryItem,
  CurrentMedication,
  AllergyInfo,
  EmergencyInfo,
  EmergencyContactInfo,
  AccessPermission,
  PermissionSet,
  AccessCondition,
  QRScanResult,
  QRScanError,
  QRErrorCode,
  QRScanPurpose,
  QRGenerationRequest,
  QRGenerationResult,
  QRCodeConfig,
  QRStyling,
  QRSystemAnalytics,
  PatientScanStats,
  ScanTrendData,
  QRSecurityConfig,
  QRSecurityEvent,
  SecurityEventType,
  QRScannerProps,
  QRDisplayProps,
  QRRecordViewProps,
  QRCodeFormat,
  QRErrorCorrectionLevel,
  QRDotStyle,
  QRSecurityEventSeverity
} from './qr-system-types'

// Form validation schemas
export * from './validation-schemas'

// Legacy dashboard models (for backward compatibility - use specific imports to avoid conflicts)
export type {
  // Legacy types that don't conflict
  PrescriptionFile,
  DashboardNotification,
  ConsultationTrendData,
  PatientDemographicsData,
  PrescriptionPatternData,
  AppointmentStatusData,
  DashboardState,
  ConsultationFilters
} from './dashboard-models'

// Re-export commonly used Firebase types for convenience
export { Timestamp, GeoPoint } from 'firebase/firestore'

// Type utility helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Common form types
export interface FormState<T> {
  data: T
  errors: Record<keyof T, string>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  dateRange?: {
    start: Date
    end: Date
  }
  status?: string[]
  category?: string[]
}

// Dashboard layout types
export interface DashboardLayout {
  sidebar: {
    isCollapsed: boolean
    width: number
  }
  header: {
    height: number
    showBreadcrumbs: boolean
  }
  content: {
    padding: number
    maxWidth?: number
  }
}

// Theme and styling types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  borderRadius: number
  fontSize: 'sm' | 'md' | 'lg'
}

// Notification toast types
export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  resetError: () => void
}

// Real-time connection status
export interface ConnectionStatus {
  isConnected: boolean
  isReconnecting: boolean
  lastConnected?: Date
  retryCount: number
}

// File upload types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

// Search and filter types
export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
  filters: Record<string, any>
  facets?: SearchFacet[]
}

export interface SearchFacet {
  field: string
  values: Array<{
    value: string
    count: number
    selected: boolean
  }>
}

// Audit and logging types
export interface AuditLog {
  id: string
  userId: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, { from: any; to: any }>
  metadata?: Record<string, any>
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// System health types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  services: ServiceHealth[]
  lastChecked: Date
  uptime: number
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  errorRate?: number
  lastError?: string
}

// Feature flags
export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  rolloutPercentage?: number
  conditions?: Record<string, any>
}

// Analytics event types
export interface AnalyticsEvent {
  name: string
  properties: Record<string, any>
  userId?: string
  sessionId?: string
  timestamp: Date
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  description: string
  action: () => void
  scope?: 'global' | 'modal' | 'form'
}

// Accessibility types
export interface A11yConfig {
  announcePageChanges: boolean
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'normal' | 'large' | 'extra-large'
  screenReaderOptimized: boolean
}

// Performance monitoring
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

// Cache types
export interface CacheConfig {
  ttl: number // Time to live in seconds
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: Date
  ttl: number
  hits: number
}

// Validation types
export interface ValidationRule {
  field: string
  rules: Array<{
    type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom'
    value?: any
    message: string
    validator?: (value: any) => boolean
  }>
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}