import { describe, it, expect } from 'vitest'
import { SymptomAnalysisService } from '../symptom-analysis'

describe('SymptomAnalysisService', () => {
  const service = new SymptomAnalysisService()

  it('should analyze symptoms and return results', () => {
    const symptoms = ['Fever', 'Cough', 'Sore throat']
    const result = service.analyzeSymptoms(symptoms)

    expect(result).toBeDefined()
    expect(result.selectedSymptoms).toEqual(symptoms)
    expect(result.urgency).toBeDefined()
    expect(result.finalAdvice).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should detect emergency symptoms', () => {
    const emergencySymptoms = ['Chest pain', 'Shortness of breath']
    const result = service.analyzeSymptoms(emergencySymptoms)

    expect(result.urgency).toBe('emergency')
    expect(result.recommendedActions).toHaveLength(1)
    expect(result.recommendedActions[0].type).toBe('emergency_care')
  })

  it('should handle no matching symptoms', () => {
    const unknownSymptoms = ['Unknown symptom']
    const result = service.analyzeSymptoms(unknownSymptoms)

    expect(result.urgency).toBe('low')
    expect(result.matchedRules).toHaveLength(0)
    expect(result.finalAdvice).toContain('no specific health concerns')
  })

  it('should match respiratory infection rule', () => {
    const respiratorySymptoms = ['Fever', 'Cough']
    const result = service.analyzeSymptoms(respiratorySymptoms)

    expect(result.matchedRules.length).toBeGreaterThan(0)
    expect(result.matchedRules[0].ruleName).toContain('Respiratory')
    expect(result.urgency).toBe('low')
  })

  it('should prioritize high urgency rules', () => {
    const highUrgencySymptoms = ['Fever', 'Shortness of breath', 'Chest pain']
    const result = service.analyzeSymptoms(highUrgencySymptoms)

    expect(result.urgency).toBe('emergency')
    expect(result.matchedRules[0].urgency).toBe('emergency')
  })

  it('should calculate confidence scores', () => {
    const symptoms = ['Joint pain', 'Stiffness', 'Swelling']
    const result = service.analyzeSymptoms(symptoms)

    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should extract specialist referrals', () => {
    const cardiacSymptoms = ['Chest pain']
    const result = service.analyzeSymptoms(cardiacSymptoms)

    expect(result.specialistReferrals.length).toBeGreaterThan(0)
    expect(result.specialistReferrals[0].specialty).toBe('Cardiologist')
  })

  it('should determine follow-up requirements', () => {
    const symptoms = ['Fatigue', 'Weakness']
    const result = service.analyzeSymptoms(symptoms)

    expect(result.followUpRequired).toBe(true)
    expect(result.followUpDays).toBeDefined()
    expect(result.followUpDays).toBeGreaterThan(0)
  })
})

describe('SymptomAnalysisService static methods', () => {
  it('should get urgency configuration', () => {
    const lowConfig = SymptomAnalysisService.getUrgencyConfig('low')
    expect(lowConfig).toBeDefined()
    expect(lowConfig.color).toBe('green')
    expect(lowConfig.description).toBeDefined()

    const emergencyConfig = SymptomAnalysisService.getUrgencyConfig('emergency')
    expect(emergencyConfig).toBeDefined()
    expect(emergencyConfig.color).toBe('red')
  })

  it('should get all rules', () => {
    const rules = SymptomAnalysisService.getAllRules()
    expect(rules).toBeDefined()
    expect(rules.length).toBeGreaterThan(0)
    expect(rules[0]).toHaveProperty('id')
    expect(rules[0]).toHaveProperty('symptoms')
    expect(rules[0]).toHaveProperty('urgency')
  })

  it('should get emergency symptoms', () => {
    const emergencySymptoms = SymptomAnalysisService.getEmergencySymptoms()
    expect(emergencySymptoms).toBeDefined()
    expect(emergencySymptoms.length).toBeGreaterThan(0)
    expect(emergencySymptoms).toContain('Chest pain')
  })
})