// Symptom Checker System Types
// Shared types and interfaces for AI-powered symptom checking functionality

import { Timestamp } from 'firebase/firestore'

// ============================================================================
// SYMPTOM CHECKER CORE TYPES
// ============================================================================

export type SymptomUrgencyLevel = 'low' | 'medium' | 'high' | 'emergency'

export interface SymptomCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  symptoms: string[]
  isActive: boolean
}

export interface Symptom {
  id: string
  name: string
  description: string
  category: string
  severity: SymptomUrgencyLevel
  commonCauses: string[]
  relatedSymptoms: string[]
  isActive: boolean
}

export interface SymptomRule {
  id: string
  name: string
  description: string
  symptoms: string[] // Array of symptom IDs that trigger this rule
  conditions: SymptomCondition[]
  advice: string
  urgency: SymptomUrgencyLevel
  recommendedAction: string
  specialistReferral?: string
  followUpDays?: number
  isActive: boolean
  priority: number // Higher number = higher priority when multiple rules match
}

export interface SymptomCondition {
  type: 'all' | 'any' | 'count' | 'age' | 'gender'
  symptoms?: string[] // For 'all' or 'any' conditions
  count?: {
    min?: number
    max?: number
    symptoms: string[]
  } // For 'count' conditions
  age?: {
    min?: number
    max?: number
  } // For age-based conditions
  gender?: 'male' | 'female' | 'other' // For gender-based conditions
}

// ============================================================================
// SYMPTOM CHECKER SESSION TYPES
// ============================================================================

export interface SymptomCheckerSession {
  id: string
  patientId: string
  startedAt: Timestamp
  completedAt?: Timestamp
  currentStep: SymptomCheckerStep
  selectedSymptoms: string[]
  answers: SymptomAnswer[]
  results?: SymptomAnalysisResult
  isCompleted: boolean
  sessionData: Record<string, any> // For storing additional session state
}

export type SymptomCheckerStep = 
  | 'category_selection'
  | 'symptom_selection'
  | 'severity_assessment'
  | 'additional_questions'
  | 'analysis'
  | 'results'

export interface SymptomAnswer {
  questionId: string
  question: string
  answer: string | number | boolean | string[]
  timestamp: Timestamp
}

// ============================================================================
// SYMPTOM ANALYSIS TYPES
// ============================================================================

export interface SymptomAnalysisResult {
  id: string
  patientId: string
  sessionId: string
  selectedSymptoms: string[]
  matchedRules: MatchedRule[]
  finalAdvice: string
  urgency: SymptomUrgencyLevel
  recommendedActions: RecommendedAction[]
  specialistReferrals: SpecialistReferral[]
  followUpRequired: boolean
  followUpDays?: number
  confidence: number // 0-100 confidence score
  timestamp: Timestamp
  isArchived: boolean
}

export interface MatchedRule {
  ruleId: string
  ruleName: string
  matchScore: number // 0-100 how well the symptoms match this rule
  triggeredSymptoms: string[]
  advice: string
  urgency: SymptomUrgencyLevel
  confidence: number
}

export interface RecommendedAction {
  id: string
  type: 'self_care' | 'pharmacy_visit' | 'doctor_appointment' | 'emergency_care' | 'specialist_referral'
  title: string
  description: string
  urgency: SymptomUrgencyLevel
  timeframe: string // e.g., "within 24 hours", "immediately", "within a week"
  priority: number
  isCompleted?: boolean
  completedAt?: Timestamp
}

export interface SpecialistReferral {
  id: string
  specialty: string
  reason: string
  urgency: SymptomUrgencyLevel
  notes?: string
  isScheduled?: boolean
  appointmentId?: string
}

// ============================================================================
// SYMPTOM CHECKER UI TYPES
// ============================================================================

export interface SymptomCheckerProps {
  patientId: string
  onComplete: (result: SymptomAnalysisResult) => void
  onCancel: () => void
  initialSymptoms?: string[]
  mode?: 'full' | 'quick' | 'emergency'
}

export interface SymptomSelectionProps {
  categories: SymptomCategory[]
  selectedSymptoms: string[]
  onSymptomToggle: (symptomId: string) => void
  onCategorySelect: (categoryId: string) => void
  maxSelections?: number
}

export interface SymptomResultsProps {
  result: SymptomAnalysisResult
  onBookAppointment?: (specialistType?: string) => void
  onSaveResult?: () => void
  onStartNewCheck?: () => void
}

// ============================================================================
// SYMPTOM CHECKER CONFIGURATION
// ============================================================================

export interface SymptomCheckerConfig {
  maxSymptomSelections: number
  minSymptomSelections: number
  enableEmergencyDetection: boolean
  emergencySymptoms: string[]
  requireAgeVerification: boolean
  enableFollowUpReminders: boolean
  defaultFollowUpDays: number
  confidenceThreshold: number
  enableSpecialistReferrals: boolean
  supportedLanguages: string[]
}

// ============================================================================
// SYMPTOM CHECKER ANALYTICS
// ============================================================================

export interface SymptomCheckerAnalytics {
  totalSessions: number
  completedSessions: number
  abandonedSessions: number
  averageSessionDuration: number
  mostCommonSymptoms: SymptomFrequency[]
  urgencyDistribution: UrgencyDistribution
  followUpCompliance: number
  appointmentBookingRate: number
  timeRange: {
    start: Timestamp
    end: Timestamp
  }
}

export interface SymptomFrequency {
  symptomId: string
  symptomName: string
  count: number
  percentage: number
}

export interface UrgencyDistribution {
  low: number
  medium: number
  high: number
  emergency: number
}

// ============================================================================
// SYMPTOM CHECKER VALIDATION
// ============================================================================

export interface SymptomValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface SymptomRuleValidation {
  ruleId: string
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

// ============================================================================
// SYMPTOM CHECKER HISTORY
// ============================================================================

export interface SymptomHistory {
  patientId: string
  sessions: SymptomCheckerSession[]
  results: SymptomAnalysisResult[]
  trends: SymptomTrend[]
  lastUpdated: Timestamp
}

export interface SymptomTrend {
  symptomId: string
  symptomName: string
  occurrences: SymptomOccurrence[]
  frequency: 'increasing' | 'decreasing' | 'stable'
  severity: 'improving' | 'worsening' | 'stable'
  lastOccurrence: Timestamp
}

export interface SymptomOccurrence {
  date: Timestamp
  severity: SymptomUrgencyLevel
  sessionId: string
  resultId: string
  notes?: string
}

// ============================================================================
// EXPORT UTILITY TYPES
// ============================================================================

export type SymptomCheckerMode = 'full' | 'quick' | 'emergency'
export type SymptomConditionType = SymptomCondition['type']
export type RecommendedActionType = RecommendedAction['type']
export type SymptomTrendDirection = SymptomTrend['frequency']
export type SymptomSeverityTrend = SymptomTrend['severity']