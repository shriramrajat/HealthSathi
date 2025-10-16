// Symptom Results Firestore Service
// Handles saving, retrieving, and managing symptom checker results in Firestore

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore'

import { getFirebaseFirestore } from '../firebase'
import { COLLECTION_PATHS } from '../types/firestore-schemas'
import type {
  SymptomAnalysisResult,
  SymptomCheckerSession,
  SymptomHistory,
  SymptomTrend,
  SymptomOccurrence,
  SymptomUrgencyLevel
} from '../types/symptom-checker-types'

// Service result interface
export interface SymptomResultsServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Symptom results filters
export interface SymptomResultsFilters {
  urgency?: SymptomUrgencyLevel[]
  dateRange?: {
    start: Timestamp
    end: Timestamp
  }
  symptoms?: string[]
}

// Symptom history options
export interface SymptomHistoryOptions {
  limit?: number
  includeArchived?: boolean
  urgencyFilter?: SymptomUrgencyLevel[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export class SymptomResultsService {
  private db: any

  constructor() {
    // Don't initialize Firebase in constructor to avoid issues in tests
  }

  private async initializeDb() {
    if (!this.db) {
      this.db = await getFirebaseFirestore()
    }
    return this.db
  }

  // Get collection references
  private async getSymptomResultsCollection(): Promise<CollectionReference> {
    const db = await this.initializeDb()
    return collection(db, COLLECTION_PATHS.SYMPTOM_RESULTS)
  }

  private async getSymptomResultDoc(resultId: string): Promise<DocumentReference> {
    const resultsCol = await this.getSymptomResultsCollection()
    return doc(resultsCol, resultId)
  }

  // Save symptom analysis result to Firestore
  async saveSymptomResult(
    result: SymptomAnalysisResult
  ): Promise<SymptomResultsServiceResult<string>> {
    try {
      const resultsCol = await this.getSymptomResultsCollection()
      
      // Prepare data for Firestore
      const firestoreData = {
        patientId: result.patientId,
        sessionId: result.sessionId,
        selectedSymptoms: result.selectedSymptoms,
        matchedRules: result.matchedRules.map(rule => ({
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          matchScore: rule.matchScore,
          triggeredSymptoms: rule.triggeredSymptoms,
          advice: rule.advice,
          urgency: rule.urgency,
          confidence: rule.confidence
        })),
        finalAdvice: result.finalAdvice,
        urgency: result.urgency,
        recommendedActions: result.recommendedActions.map(action => ({
          id: action.id,
          type: action.type,
          title: action.title,
          description: action.description,
          urgency: action.urgency,
          timeframe: action.timeframe,
          priority: action.priority,
          isCompleted: action.isCompleted || false,
          completedAt: action.completedAt || null
        })),
        specialistReferrals: result.specialistReferrals.map(referral => ({
          id: referral.id,
          specialty: referral.specialty,
          reason: referral.reason,
          urgency: referral.urgency,
          notes: referral.notes || '',
          isScheduled: referral.isScheduled || false,
          appointmentId: referral.appointmentId || null
        })),
        followUpRequired: result.followUpRequired,
        followUpDays: result.followUpDays || null,
        confidence: result.confidence,
        timestamp: result.timestamp instanceof Date ? Timestamp.fromDate(result.timestamp) : result.timestamp,
        isArchived: result.isArchived,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(resultsCol, firestoreData)

      return {
        success: true,
        data: docRef.id
      }
    } catch (error) {
      console.error('Error saving symptom result:', error)
      return {
        success: false,
        error: `Failed to save symptom result: ${error}`
      }
    }
  }

  // Get symptom result by ID
  async getSymptomResult(
    resultId: string
  ): Promise<SymptomResultsServiceResult<SymptomAnalysisResult>> {
    try {
      const resultDoc = await this.getSymptomResultDoc(resultId)
      const snapshot = await getDoc(resultDoc)

      if (!snapshot.exists()) {
        return {
          success: false,
          error: 'Symptom result not found'
        }
      }

      const data = snapshot.data()
      if (!data) {
        return {
          success: false,
          error: 'Symptom result data not found'
        }
      }
      
      const result: SymptomAnalysisResult = {
        id: snapshot.id,
        patientId: data.patientId,
        sessionId: data.sessionId,
        selectedSymptoms: data.selectedSymptoms,
        matchedRules: data.matchedRules,
        finalAdvice: data.finalAdvice,
        urgency: data.urgency,
        recommendedActions: data.recommendedActions,
        specialistReferrals: data.specialistReferrals,
        followUpRequired: data.followUpRequired,
        followUpDays: data.followUpDays,
        confidence: data.confidence,
        timestamp: data.timestamp,
        isArchived: data.isArchived
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Error getting symptom result:', error)
      return {
        success: false,
        error: `Failed to get symptom result: ${error}`
      }
    }
  }

  // Get symptom history for a patient
  async getPatientSymptomHistory(
    patientId: string,
    options: SymptomHistoryOptions = {}
  ): Promise<SymptomResultsServiceResult<SymptomAnalysisResult[]>> {
    try {
      const resultsCol = await this.getSymptomResultsCollection()
      const constraints: QueryConstraint[] = [
        where('patientId', '==', patientId),
        orderBy('timestamp', 'desc')
      ]

      // Add archived filter
      if (!options.includeArchived) {
        constraints.push(where('isArchived', '==', false))
      }

      // Add urgency filter
      if (options.urgencyFilter && options.urgencyFilter.length > 0) {
        constraints.push(where('urgency', 'in', options.urgencyFilter))
      }

      // Add date range filter
      if (options.dateRange) {
        constraints.push(
          where('timestamp', '>=', Timestamp.fromDate(options.dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(options.dateRange.end))
        )
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit))
      } else {
        constraints.push(limit(50)) // Default limit
      }

      const q = query(resultsCol, ...constraints)
      const snapshot = await getDocs(q)

      const results: SymptomAnalysisResult[] = []
      snapshot.forEach((doc: DocumentSnapshot) => {
        const data = doc.data()
        if (data) {
          results.push({
            id: doc.id,
            patientId: data.patientId,
            sessionId: data.sessionId,
            selectedSymptoms: data.selectedSymptoms,
            matchedRules: data.matchedRules,
            finalAdvice: data.finalAdvice,
            urgency: data.urgency,
            recommendedActions: data.recommendedActions,
            specialistReferrals: data.specialistReferrals,
            followUpRequired: data.followUpRequired,
            followUpDays: data.followUpDays,
            confidence: data.confidence,
            timestamp: data.timestamp,
            isArchived: data.isArchived
          })
        }
      })

      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('Error getting patient symptom history:', error)
      return {
        success: false,
        error: `Failed to get symptom history: ${error}`
      }
    }
  }

  // Get symptom results for healthcare providers (doctors, CHWs)
  async getSymptomResultsForProvider(
    filters: SymptomResultsFilters = {},
    limitCount: number = 100
  ): Promise<SymptomResultsServiceResult<SymptomAnalysisResult[]>> {
    try {
      const resultsCol = await this.getSymptomResultsCollection()
      const constraints: QueryConstraint[] = [
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      ]

      // Add urgency filter
      if (filters.urgency && filters.urgency.length > 0) {
        constraints.unshift(where('urgency', 'in', filters.urgency))
      }

      // Add date range filter
      if (filters.dateRange) {
        constraints.push(
          where('timestamp', '>=', filters.dateRange.start),
          where('timestamp', '<=', filters.dateRange.end)
        )
      }

      const q = query(resultsCol, ...constraints)
      const snapshot = await getDocs(q)

      const results: SymptomAnalysisResult[] = []
      snapshot.forEach((doc: DocumentSnapshot) => {
        const data = doc.data()
        if (!data) return
        
        // Apply client-side symptom filtering if needed
        if (filters.symptoms && filters.symptoms.length > 0) {
          const hasMatchingSymptom = filters.symptoms.some(symptom =>
            data.selectedSymptoms.includes(symptom)
          )
          if (!hasMatchingSymptom) return
        }

        results.push({
          id: doc.id,
          patientId: data.patientId,
          sessionId: data.sessionId,
          selectedSymptoms: data.selectedSymptoms,
          matchedRules: data.matchedRules,
          finalAdvice: data.finalAdvice,
          urgency: data.urgency,
          recommendedActions: data.recommendedActions,
          specialistReferrals: data.specialistReferrals,
          followUpRequired: data.followUpRequired,
          followUpDays: data.followUpDays,
          confidence: data.confidence,
          timestamp: data.timestamp,
          isArchived: data.isArchived
        })
      })

      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('Error getting symptom results for provider:', error)
      return {
        success: false,
        error: `Failed to get symptom results: ${error}`
      }
    }
  }

  // Update symptom result (e.g., mark as archived, update follow-up status)
  async updateSymptomResult(
    resultId: string,
    updates: Partial<SymptomAnalysisResult>
  ): Promise<SymptomResultsServiceResult<void>> {
    try {
      const resultDoc = await this.getSymptomResultDoc(resultId)
      
      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      }

      // Convert dates to Timestamps if needed
      if (updates.timestamp && updates.timestamp instanceof Date) {
        updateData.timestamp = Timestamp.fromDate(updates.timestamp)
      }

      await updateDoc(resultDoc, updateData)

      return {
        success: true
      }
    } catch (error) {
      console.error('Error updating symptom result:', error)
      return {
        success: false,
        error: `Failed to update symptom result: ${error}`
      }
    }
  }

  // Archive symptom result
  async archiveSymptomResult(resultId: string): Promise<SymptomResultsServiceResult<void>> {
    return this.updateSymptomResult(resultId, { isArchived: true })
  }

  // Delete symptom result
  async deleteSymptomResult(resultId: string): Promise<SymptomResultsServiceResult<void>> {
    try {
      const resultDoc = await this.getSymptomResultDoc(resultId)
      await deleteDoc(resultDoc)

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting symptom result:', error)
      return {
        success: false,
        error: `Failed to delete symptom result: ${error}`
      }
    }
  }

  // Subscribe to patient's symptom results with real-time updates
  async subscribeToPatientSymptomResults(
    patientId: string,
    callback: (results: SymptomAnalysisResult[]) => void,
    options: SymptomHistoryOptions = {}
  ): Promise<Unsubscribe> {
    try {
      const resultsCol = await this.getSymptomResultsCollection()
      const constraints: QueryConstraint[] = [
        where('patientId', '==', patientId),
        orderBy('timestamp', 'desc')
      ]

      // Add archived filter
      if (!options.includeArchived) {
        constraints.push(where('isArchived', '==', false))
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit))
      } else {
        constraints.push(limit(20)) // Default limit for real-time
      }

      const q = query(resultsCol, ...constraints)

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const results: SymptomAnalysisResult[] = []
          snapshot.forEach((doc: DocumentSnapshot) => {
            const data = doc.data()
            if (data) {
              results.push({
                id: doc.id,
                patientId: data.patientId,
                sessionId: data.sessionId,
                selectedSymptoms: data.selectedSymptoms,
                matchedRules: data.matchedRules,
                finalAdvice: data.finalAdvice,
                urgency: data.urgency,
                recommendedActions: data.recommendedActions,
                specialistReferrals: data.specialistReferrals,
                followUpRequired: data.followUpRequired,
                followUpDays: data.followUpDays,
                confidence: data.confidence,
                timestamp: data.timestamp,
                isArchived: data.isArchived
              })
            }
          })
          callback(results)
        },
        (error) => {
          console.error('Error in symptom results subscription:', error)
        }
      )

      return unsubscribe
    } catch (error) {
      console.error('Error subscribing to symptom results:', error)
      throw error
    }
  }

  // Get symptom trends for a patient
  async getPatientSymptomTrends(
    patientId: string,
    daysBack: number = 30
  ): Promise<SymptomResultsServiceResult<SymptomTrend[]>> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (daysBack * 24 * 60 * 60 * 1000))

      const historyResult = await this.getPatientSymptomHistory(patientId, {
        dateRange: { start: startDate, end: endDate },
        includeArchived: false,
        limit: 100
      })

      if (!historyResult.success || !historyResult.data) {
        return {
          success: false,
          error: historyResult.error || 'Failed to get symptom history'
        }
      }

      const results = historyResult.data
      const symptomMap = new Map<string, SymptomOccurrence[]>()

      // Group symptoms by name
      results.forEach(result => {
        result.selectedSymptoms.forEach(symptom => {
          if (!symptomMap.has(symptom)) {
            symptomMap.set(symptom, [])
          }
          symptomMap.get(symptom)!.push({
            date: result.timestamp,
            severity: result.urgency,
            sessionId: result.sessionId,
            resultId: result.id,
            notes: result.finalAdvice
          })
        })
      })

      // Calculate trends
      const trends: SymptomTrend[] = []
      symptomMap.forEach((occurrences, symptomName) => {
        if (occurrences.length < 2) return // Need at least 2 occurrences for trend

        // Sort by date
        occurrences.sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date
          const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date
          return dateA.getTime() - dateB.getTime()
        })

        const firstOccurrence = occurrences[0]
        const lastOccurrence = occurrences[occurrences.length - 1]
        
        // Determine frequency trend
        const timeSpan = daysBack
        const frequency = occurrences.length / timeSpan
        let frequencyTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
        
        if (occurrences.length >= 3) {
          const firstHalf = occurrences.slice(0, Math.floor(occurrences.length / 2))
          const secondHalf = occurrences.slice(Math.floor(occurrences.length / 2))
          
          if (secondHalf.length > firstHalf.length) {
            frequencyTrend = 'increasing'
          } else if (secondHalf.length < firstHalf.length) {
            frequencyTrend = 'decreasing'
          }
        }

        // Determine severity trend
        const severityMap = { low: 1, medium: 2, high: 3, emergency: 4 }
        const firstSeverity = severityMap[firstOccurrence.severity]
        const lastSeverity = severityMap[lastOccurrence.severity]
        
        let severityTrend: 'improving' | 'worsening' | 'stable' = 'stable'
        if (lastSeverity > firstSeverity) {
          severityTrend = 'worsening'
        } else if (lastSeverity < firstSeverity) {
          severityTrend = 'improving'
        }

        trends.push({
          symptomId: symptomName.toLowerCase().replace(/\s+/g, '-'),
          symptomName,
          occurrences,
          frequency: frequencyTrend,
          severity: severityTrend,
          lastOccurrence: lastOccurrence.date
        })
      })

      return {
        success: true,
        data: trends
      }
    } catch (error) {
      console.error('Error getting symptom trends:', error)
      return {
        success: false,
        error: `Failed to get symptom trends: ${error}`
      }
    }
  }

  // Get symptom statistics for healthcare providers
  async getSymptomStatistics(
    dateRange?: { start: Date; end: Date }
  ): Promise<SymptomResultsServiceResult<{
    totalResults: number
    urgencyDistribution: Record<SymptomUrgencyLevel, number>
    mostCommonSymptoms: Array<{ symptom: string; count: number }>
    averageConfidence: number
  }>> {
    try {
      const filters: SymptomResultsFilters = {}
      
      if (dateRange) {
        filters.dateRange = {
          start: Timestamp.fromDate(dateRange.start),
          end: Timestamp.fromDate(dateRange.end)
        }
      }

      const resultsResponse = await this.getSymptomResultsForProvider(filters, 1000)
      
      if (!resultsResponse.success || !resultsResponse.data) {
        return {
          success: false,
          error: resultsResponse.error || 'Failed to get results'
        }
      }

      const results = resultsResponse.data
      
      // Calculate statistics
      const urgencyDistribution: Record<SymptomUrgencyLevel, number> = {
        low: 0,
        medium: 0,
        high: 0,
        emergency: 0
      }

      const symptomCounts = new Map<string, number>()
      let totalConfidence = 0

      results.forEach(result => {
        urgencyDistribution[result.urgency]++
        totalConfidence += result.confidence
        
        result.selectedSymptoms.forEach(symptom => {
          symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1)
        })
      })

      // Get most common symptoms
      const mostCommonSymptoms = Array.from(symptomCounts.entries())
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const statistics = {
        totalResults: results.length,
        urgencyDistribution,
        mostCommonSymptoms,
        averageConfidence: results.length > 0 ? Math.round(totalConfidence / results.length) : 0
      }

      return {
        success: true,
        data: statistics
      }
    } catch (error) {
      console.error('Error getting symptom statistics:', error)
      return {
        success: false,
        error: `Failed to get symptom statistics: ${error}`
      }
    }
  }
}

// Export singleton instance
export const symptomResultsService = new SymptomResultsService()

// Export types for external use
export type {
  SymptomResultsServiceResult as SymptomResultsServiceResultType,
  SymptomResultsFilters as SymptomResultsFiltersType,
  SymptomHistoryOptions as SymptomHistoryOptionsType
}