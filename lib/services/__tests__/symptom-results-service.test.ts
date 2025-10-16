// Test file for symptom results service
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase modules
vi.mock('../../firebase', () => ({
  getFirebaseFirestore: vi.fn(() => Promise.resolve({
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn()
  }))
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-result-id' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
  },
  GeoPoint: vi.fn().mockImplementation((lat, lng) => ({ latitude: lat, longitude: lng }))
}))

import { SymptomResultsService } from '../symptom-results-service'
import type { SymptomAnalysisResult } from '../../types/symptom-checker-types'

describe('SymptomResultsService', () => {
  let service: SymptomResultsService

  beforeEach(() => {
    service = new SymptomResultsService()
    vi.clearAllMocks()
  })

  describe('saveSymptomResult', () => {
    it('should save symptom result to Firestore', async () => {
      // Arrange
      const mockResult: SymptomAnalysisResult = {
        id: 'test-result-id',
        patientId: 'test-patient-id',
        sessionId: 'test-session-id',
        selectedSymptoms: ['fever', 'cough'],
        matchedRules: [],
        finalAdvice: 'Test advice',
        urgency: 'medium',
        recommendedActions: [],
        specialistReferrals: [],
        followUpRequired: false,
        confidence: 85,
        timestamp: new Date() as any,
        isArchived: false
      }

      // Act
      const result = await service.saveSymptomResult(mockResult)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBe('test-result-id')
    })

    it('should handle save errors gracefully', async () => {
      // Arrange
      const mockResult: SymptomAnalysisResult = {
        id: 'test-result-id',
        patientId: 'test-patient-id',
        sessionId: 'test-session-id',
        selectedSymptoms: ['fever'],
        matchedRules: [],
        finalAdvice: 'Test advice',
        urgency: 'low',
        recommendedActions: [],
        specialistReferrals: [],
        followUpRequired: false,
        confidence: 75,
        timestamp: new Date() as any,
        isArchived: false
      }

      // Mock Firebase error
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockRejectedValueOnce(new Error('Firestore error'))

      // Act
      const result = await service.saveSymptomResult(mockResult)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to save symptom result')
    })
  })

  describe('getPatientSymptomHistory', () => {
    it('should return empty array when no results found', async () => {
      // Arrange
      const patientId = 'test-patient-id'
      
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValueOnce({
        forEach: vi.fn()
      } as any)

      // Act
      const result = await service.getPatientSymptomHistory(patientId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle query errors gracefully', async () => {
      // Arrange
      const patientId = 'test-patient-id'
      
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Query error'))

      // Act
      const result = await service.getPatientSymptomHistory(patientId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to get symptom history')
    })
  })

  describe('getSymptomStatistics', () => {
    it('should calculate statistics correctly', async () => {
      // Arrange
      const mockResults: SymptomAnalysisResult[] = [
        {
          id: '1',
          patientId: 'patient1',
          sessionId: 'session1',
          selectedSymptoms: ['fever', 'cough'],
          matchedRules: [],
          finalAdvice: 'Rest and hydrate',
          urgency: 'low',
          recommendedActions: [],
          specialistReferrals: [],
          followUpRequired: false,
          confidence: 80,
          timestamp: new Date() as any,
          isArchived: false
        },
        {
          id: '2',
          patientId: 'patient2',
          sessionId: 'session2',
          selectedSymptoms: ['headache', 'fever'],
          matchedRules: [],
          finalAdvice: 'Monitor symptoms',
          urgency: 'medium',
          recommendedActions: [],
          specialistReferrals: [],
          followUpRequired: false,
          confidence: 75,
          timestamp: new Date() as any,
          isArchived: false
        }
      ]

      // Mock the service method to return mock results
      vi.spyOn(service, 'getSymptomResultsForProvider').mockResolvedValueOnce({
        success: true,
        data: mockResults
      })

      // Act
      const result = await service.getSymptomStatistics()

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        totalResults: 2,
        urgencyDistribution: {
          low: 1,
          medium: 1,
          high: 0,
          emergency: 0
        },
        mostCommonSymptoms: [
          { symptom: 'fever', count: 2 },
          { symptom: 'cough', count: 1 },
          { symptom: 'headache', count: 1 }
        ],
        averageConfidence: 78 // (80 + 75) / 2 = 77.5, rounded to 78
      })
    })
  })

  describe('archiveSymptomResult', () => {
    it('should mark result as archived', async () => {
      // Arrange
      const resultId = 'test-result-id'
      
      // Mock updateSymptomResult method
      vi.spyOn(service, 'updateSymptomResult').mockResolvedValueOnce({
        success: true
      })

      // Act
      const result = await service.archiveSymptomResult(resultId)

      // Assert
      expect(result.success).toBe(true)
      expect(service.updateSymptomResult).toHaveBeenCalledWith(resultId, { isArchived: true })
    })
  })
})