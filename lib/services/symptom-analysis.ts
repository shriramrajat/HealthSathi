import { SymptomRule, SymptomAnalysisResult, MatchedRule, RecommendedAction, SymptomUrgencyLevel } from '@/lib/types/symptom-checker-types'
import symptomRulesData from '@/lib/data/symptom-rules.json'
import { symptomResultsService } from './symptom-results-service'

interface SymptomRulesConfig {
  rules: SymptomRule[]
  emergencySymptoms: string[]
  urgencyLevels: Record<string, {
    color: string
    description: string
    timeframe: string
  }>
}

const config = symptomRulesData as SymptomRulesConfig

export class SymptomAnalysisService {
  private rules: SymptomRule[]
  private emergencySymptoms: string[]

  constructor() {
    this.rules = config.rules.filter(rule => rule.isActive)
    this.emergencySymptoms = config.emergencySymptoms
  }

  /**
   * Analyzes selected symptoms and returns matched rules with recommendations
   */
  analyzeSymptoms(selectedSymptoms: string[], patientAge?: number, patientGender?: string): SymptomAnalysisResult {
    // Check for emergency symptoms first
    const hasEmergencySymptoms = this.checkEmergencySymptoms(selectedSymptoms)
    
    // Find matching rules
    const matchedRules = this.findMatchingRules(selectedSymptoms, patientAge, patientGender)
    
    // Determine overall urgency and advice
    const { urgency, advice, recommendedActions } = this.determineOverallAssessment(matchedRules, hasEmergencySymptoms)
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(matchedRules, selectedSymptoms)

    const result: SymptomAnalysisResult = {
      id: this.generateId(),
      patientId: '', // Will be set by the calling component
      sessionId: '', // Will be set by the calling component
      selectedSymptoms,
      matchedRules,
      finalAdvice: advice,
      urgency,
      recommendedActions,
      specialistReferrals: this.extractSpecialistReferrals(matchedRules),
      followUpRequired: this.determineFollowUpRequired(matchedRules),
      followUpDays: this.determineFollowUpDays(matchedRules),
      confidence,
      timestamp: new Date() as any, // Will be converted to Firestore Timestamp
      isArchived: false
    }

    return result
  }

  /**
   * Analyzes symptoms and saves the result to Firestore
   */
  async analyzeAndSaveSymptoms(
    selectedSymptoms: string[], 
    patientId: string,
    patientAge?: number, 
    patientGender?: string
  ): Promise<{ result: SymptomAnalysisResult; firestoreId?: string; error?: string }> {
    try {
      // Perform analysis
      const result = this.analyzeSymptoms(selectedSymptoms, patientAge, patientGender)
      
      // Set patient ID and session ID
      result.patientId = patientId
      result.sessionId = `session-${patientId}-${Date.now()}`
      
      // Save to Firestore
      const saveResult = await symptomResultsService.saveSymptomResult(result)
      
      if (saveResult.success && saveResult.data) {
        return {
          result,
          firestoreId: saveResult.data
        }
      } else {
        return {
          result,
          error: saveResult.error || 'Failed to save to Firestore'
        }
      }
    } catch (error) {
      console.error('Error analyzing and saving symptoms:', error)
      const result = this.analyzeSymptoms(selectedSymptoms, patientAge, patientGender)
      result.patientId = patientId
      result.sessionId = `session-${patientId}-${Date.now()}`
      
      return {
        result,
        error: `Failed to save result: ${error}`
      }
    }
  }

  /**
   * Checks if any selected symptoms are emergency symptoms
   */
  private checkEmergencySymptoms(selectedSymptoms: string[]): boolean {
    return selectedSymptoms.some(symptom => 
      this.emergencySymptoms.some(emergency => 
        emergency.toLowerCase() === symptom.toLowerCase()
      )
    )
  }

  /**
   * Finds all rules that match the selected symptoms
   */
  private findMatchingRules(selectedSymptoms: string[], patientAge?: number, patientGender?: string): MatchedRule[] {
    const matchedRules: MatchedRule[] = []

    for (const rule of this.rules) {
      const matchResult = this.evaluateRule(rule, selectedSymptoms, patientAge, patientGender)
      if (matchResult.matches) {
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matchScore: matchResult.score,
          triggeredSymptoms: matchResult.triggeredSymptoms,
          advice: rule.advice,
          urgency: rule.urgency,
          confidence: matchResult.confidence
        })
      }
    }

    // Sort by priority and match score
    return matchedRules.sort((a, b) => {
      const ruleA = this.rules.find(r => r.id === a.ruleId)
      const ruleB = this.rules.find(r => r.id === b.ruleId)
      
      if (ruleA && ruleB) {
        // First sort by priority (higher priority first)
        if (ruleA.priority !== ruleB.priority) {
          return ruleB.priority - ruleA.priority
        }
        // Then by match score (higher score first)
        return b.matchScore - a.matchScore
      }
      
      return 0
    })
  }

  /**
   * Evaluates if a rule matches the selected symptoms
   */
  private evaluateRule(
    rule: SymptomRule, 
    selectedSymptoms: string[], 
    patientAge?: number, 
    patientGender?: string
  ): { matches: boolean; score: number; confidence: number; triggeredSymptoms: string[] } {
    let matches = false
    let score = 0
    let confidence = 0
    const triggeredSymptoms: string[] = []

    for (const condition of rule.conditions) {
      const conditionResult = this.evaluateCondition(condition, selectedSymptoms, patientAge, patientGender)
      
      if (conditionResult.matches) {
        matches = true
        score += conditionResult.score
        confidence += conditionResult.confidence
        triggeredSymptoms.push(...conditionResult.triggeredSymptoms)
      }
    }

    // Calculate final scores
    const finalScore = Math.min(100, score / rule.conditions.length)
    const finalConfidence = Math.min(100, confidence / rule.conditions.length)

    return {
      matches,
      score: finalScore,
      confidence: finalConfidence,
      triggeredSymptoms: [...new Set(triggeredSymptoms)] // Remove duplicates
    }
  }

  /**
   * Evaluates a specific condition within a rule
   */
  private evaluateCondition(
    condition: any,
    selectedSymptoms: string[],
    patientAge?: number,
    patientGender?: string
  ): { matches: boolean; score: number; confidence: number; triggeredSymptoms: string[] } {
    const triggeredSymptoms: string[] = []

    switch (condition.type) {
      case 'all':
        if (condition.symptoms) {
          const matchingSymptoms = condition.symptoms.filter((symptom: string) =>
            selectedSymptoms.some(selected => selected.toLowerCase() === symptom.toLowerCase())
          )
          triggeredSymptoms.push(...matchingSymptoms)
          
          if (matchingSymptoms.length === condition.symptoms.length) {
            return {
              matches: true,
              score: 100,
              confidence: 90,
              triggeredSymptoms
            }
          }
        }
        break

      case 'any':
        if (condition.symptoms) {
          const matchingSymptoms = condition.symptoms.filter((symptom: string) =>
            selectedSymptoms.some(selected => selected.toLowerCase() === symptom.toLowerCase())
          )
          triggeredSymptoms.push(...matchingSymptoms)
          
          if (matchingSymptoms.length > 0) {
            const score = (matchingSymptoms.length / condition.symptoms.length) * 100
            return {
              matches: true,
              score,
              confidence: Math.min(80, score),
              triggeredSymptoms
            }
          }
        }
        break

      case 'count':
        if (condition.count && condition.count.symptoms) {
          const matchingSymptoms = condition.count.symptoms.filter((symptom: string) =>
            selectedSymptoms.some(selected => selected.toLowerCase() === symptom.toLowerCase())
          )
          triggeredSymptoms.push(...matchingSymptoms)
          
          const count = matchingSymptoms.length
          const minCount = condition.count.min || 0
          const maxCount = condition.count.max || Infinity
          
          if (count >= minCount && count <= maxCount) {
            const score = Math.min(100, (count / condition.count.symptoms.length) * 100)
            return {
              matches: true,
              score,
              confidence: Math.min(85, score),
              triggeredSymptoms
            }
          }
        }
        break

      case 'age':
        if (condition.age && patientAge !== undefined) {
          const minAge = condition.age.min || 0
          const maxAge = condition.age.max || 150
          
          if (patientAge >= minAge && patientAge <= maxAge) {
            return {
              matches: true,
              score: 50, // Age conditions contribute less to overall score
              confidence: 70,
              triggeredSymptoms: []
            }
          }
        }
        break

      case 'gender':
        if (condition.gender && patientGender) {
          if (condition.gender.toLowerCase() === patientGender.toLowerCase()) {
            return {
              matches: true,
              score: 30, // Gender conditions contribute less to overall score
              confidence: 60,
              triggeredSymptoms: []
            }
          }
        }
        break
    }

    return {
      matches: false,
      score: 0,
      confidence: 0,
      triggeredSymptoms: []
    }
  }

  /**
   * Determines overall assessment based on matched rules
   */
  private determineOverallAssessment(matchedRules: MatchedRule[], hasEmergencySymptoms: boolean): {
    urgency: SymptomUrgencyLevel
    advice: string
    recommendedActions: RecommendedAction[]
  } {
    if (hasEmergencySymptoms || matchedRules.some(rule => rule.urgency === 'emergency')) {
      return {
        urgency: 'emergency',
        advice: 'You have symptoms that may indicate a medical emergency. Seek immediate medical attention.',
        recommendedActions: [{
          id: this.generateId(),
          type: 'emergency_care',
          title: 'Seek Emergency Care',
          description: 'Go to the nearest emergency room or call emergency services immediately.',
          urgency: 'emergency',
          timeframe: 'immediately',
          priority: 10
        }]
      }
    }

    if (matchedRules.length === 0) {
      return {
        urgency: 'low',
        advice: 'Based on your selected symptoms, no specific health concerns were identified. However, if symptoms persist or worsen, consider consulting a healthcare provider.',
        recommendedActions: [{
          id: this.generateId(),
          type: 'self_care',
          title: 'Monitor Symptoms',
          description: 'Keep track of your symptoms and seek medical advice if they persist or worsen.',
          urgency: 'low',
          timeframe: 'as needed',
          priority: 1
        }]
      }
    }

    // Get the highest priority rule
    const primaryRule = matchedRules[0]
    const rule = this.rules.find(r => r.id === primaryRule.ruleId)

    if (!rule) {
      return {
        urgency: 'low',
        advice: 'Unable to provide specific advice. Please consult a healthcare provider.',
        recommendedActions: []
      }
    }

    const recommendedActions: RecommendedAction[] = [{
      id: this.generateId(),
      type: this.getActionTypeFromUrgency(rule.urgency),
      title: rule.name,
      description: rule.recommendedAction,
      urgency: rule.urgency,
      timeframe: this.getTimeframeFromUrgency(rule.urgency),
      priority: rule.priority
    }]

    return {
      urgency: rule.urgency,
      advice: rule.advice,
      recommendedActions
    }
  }

  /**
   * Calculates confidence score based on matched rules and symptoms
   */
  private calculateConfidence(matchedRules: MatchedRule[], selectedSymptoms: string[]): number {
    if (matchedRules.length === 0) {
      return 30 // Low confidence when no rules match
    }

    const avgConfidence = matchedRules.reduce((sum, rule) => sum + rule.confidence, 0) / matchedRules.length
    const symptomCoverage = Math.min(100, (selectedSymptoms.length / 5) * 100) // Assume 5 symptoms give good coverage
    
    return Math.round((avgConfidence + symptomCoverage) / 2)
  }

  /**
   * Extracts specialist referrals from matched rules
   */
  private extractSpecialistReferrals(matchedRules: MatchedRule[]) {
    const referrals = []
    
    for (const matchedRule of matchedRules) {
      const rule = this.rules.find(r => r.id === matchedRule.ruleId)
      if (rule && rule.specialistReferral) {
        referrals.push({
          id: this.generateId(),
          specialty: rule.specialistReferral,
          reason: rule.advice,
          urgency: rule.urgency,
          notes: `Based on symptoms: ${matchedRule.triggeredSymptoms.join(', ')}`
        })
      }
    }

    return referrals
  }

  /**
   * Determines if follow-up is required
   */
  private determineFollowUpRequired(matchedRules: MatchedRule[]): boolean {
    return matchedRules.some(rule => {
      const fullRule = this.rules.find(r => r.id === rule.ruleId)
      return fullRule && fullRule.followUpDays !== undefined
    })
  }

  /**
   * Determines follow-up days from matched rules
   */
  private determineFollowUpDays(matchedRules: MatchedRule[]): number | undefined {
    const followUpDays = matchedRules
      .map(rule => {
        const fullRule = this.rules.find(r => r.id === rule.ruleId)
        return fullRule?.followUpDays
      })
      .filter(days => days !== undefined) as number[]

    return followUpDays.length > 0 ? Math.min(...followUpDays) : undefined
  }

  /**
   * Gets action type based on urgency level
   */
  private getActionTypeFromUrgency(urgency: SymptomUrgencyLevel): RecommendedAction['type'] {
    switch (urgency) {
      case 'emergency':
        return 'emergency_care'
      case 'high':
        return 'doctor_appointment'
      case 'medium':
        return 'doctor_appointment'
      case 'low':
      default:
        return 'self_care'
    }
  }

  /**
   * Gets timeframe based on urgency level
   */
  private getTimeframeFromUrgency(urgency: SymptomUrgencyLevel): string {
    const urgencyConfig = config.urgencyLevels[urgency]
    return urgencyConfig?.timeframe || 'as needed'
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Gets urgency level configuration
   */
  static getUrgencyConfig(urgency: SymptomUrgencyLevel) {
    return config.urgencyLevels[urgency]
  }

  /**
   * Gets all available symptom rules
   */
  static getAllRules(): SymptomRule[] {
    return config.rules
  }

  /**
   * Gets emergency symptoms list
   */
  static getEmergencySymptoms(): string[] {
    return config.emergencySymptoms
  }
}

export const symptomAnalysisService = new SymptomAnalysisService()