'use client'

import { useState, useCallback } from 'react'
import { 
  AlertTriangleIcon, 
  HeartIcon, 
  BrainIcon, 
  EyeIcon, 
  ThermometerIcon, 
  ActivityIcon,
  StethoscopeIcon,
  ZapIcon,
  ShieldIcon,
  SearchIcon
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { 
  SymptomCheckerProps, 
  SymptomAnalysisResult
} from '@/lib/types/symptom-checker-types'
import { symptomAnalysisService } from '@/lib/services/symptom-analysis'
import SymptomResults from '@/components/symptom-results'

// Local interface definition to avoid import issues
interface SymptomCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  symptoms: string[]
  isActive: boolean
}

// Symptom categories with icons and colors
const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'general',
    name: 'General Symptoms',
    description: 'Common symptoms affecting overall well-being',
    icon: 'ActivityIcon',
    color: 'blue',
    isActive: true,
    symptoms: [
      'Fever',
      'Fatigue',
      'Weakness',
      'Loss of appetite',
      'Weight loss',
      'Night sweats',
      'Chills',
      'Body aches'
    ]
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    description: 'Breathing and lung-related symptoms',
    icon: 'StethoscopeIcon',
    color: 'green',
    isActive: true,
    symptoms: [
      'Cough',
      'Shortness of breath',
      'Chest pain',
      'Wheezing',
      'Sore throat',
      'Runny nose',
      'Congestion',
      'Sneezing'
    ]
  },
  {
    id: 'cardiovascular',
    name: 'Heart & Circulation',
    description: 'Heart and blood circulation symptoms',
    icon: 'HeartIcon',
    color: 'red',
    isActive: true,
    symptoms: [
      'Chest pain',
      'Heart palpitations',
      'Dizziness',
      'Fainting',
      'Swelling in legs',
      'Rapid heartbeat',
      'Irregular heartbeat',
      'High blood pressure'
    ]
  },
  {
    id: 'neurological',
    name: 'Neurological',
    description: 'Brain and nervous system symptoms',
    icon: 'BrainIcon',
    color: 'purple',
    isActive: true,
    symptoms: [
      'Headache',
      'Migraine',
      'Confusion',
      'Memory problems',
      'Seizures',
      'Numbness',
      'Tingling',
      'Balance problems'
    ]
  },
  {
    id: 'gastrointestinal',
    name: 'Digestive',
    description: 'Stomach and digestive system symptoms',
    icon: 'ZapIcon',
    color: 'orange',
    isActive: true,
    symptoms: [
      'Nausea',
      'Vomiting',
      'Diarrhea',
      'Constipation',
      'Abdominal pain',
      'Bloating',
      'Heartburn',
      'Loss of appetite'
    ]
  },
  {
    id: 'sensory',
    name: 'Eyes & Ears',
    description: 'Vision and hearing related symptoms',
    icon: 'EyeIcon',
    color: 'teal',
    isActive: true,
    symptoms: [
      'Blurred vision',
      'Eye pain',
      'Hearing loss',
      'Ear pain',
      'Ringing in ears',
      'Double vision',
      'Light sensitivity',
      'Discharge from ear'
    ]
  },
  {
    id: 'musculoskeletal',
    name: 'Muscles & Joints',
    description: 'Muscle, bone, and joint symptoms',
    icon: 'ShieldIcon',
    color: 'gray',
    isActive: true,
    symptoms: [
      'Joint pain',
      'Muscle pain',
      'Back pain',
      'Stiffness',
      'Swelling',
      'Limited mobility',
      'Muscle weakness',
      'Cramps'
    ]
  },
  {
    id: 'skin',
    name: 'Skin & Hair',
    description: 'Skin, hair, and nail symptoms',
    icon: 'ThermometerIcon',
    color: 'pink',
    isActive: true,
    symptoms: [
      'Rash',
      'Itching',
      'Dry skin',
      'Hair loss',
      'Skin discoloration',
      'Wounds not healing',
      'Unusual moles',
      'Nail changes'
    ]
  }
]

// Icon mapping
const ICON_MAP = {
  ActivityIcon,
  StethoscopeIcon,
  HeartIcon,
  BrainIcon,
  ZapIcon,
  EyeIcon,
  ShieldIcon,
  ThermometerIcon
}

// Color mapping for categories
const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
  green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
  red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
  purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200',
  orange: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200',
  teal: 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200',
  gray: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200',
  pink: 'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-200'
}

interface SymptomSelectionProps {
  selectedSymptoms: string[]
  onSymptomToggle: (symptom: string) => void
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

function SymptomSelection({
  selectedSymptoms,
  onSymptomToggle,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchChange
}: SymptomSelectionProps) {
  // Filter symptoms based on search query and selected category
  const filteredCategories = SYMPTOM_CATEGORIES.filter(category => {
    if (!selectedCategory || selectedCategory === category.id) {
      if (!searchQuery) return true
      return category.symptoms.some(symptom => 
        symptom.toLowerCase().includes(searchQuery.toLowerCase())
      ) || category.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return false
  })

  const getFilteredSymptoms = (category: SymptomCategory) => {
    if (!searchQuery) return category.symptoms
    return category.symptoms.filter(symptom =>
      symptom.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <input
          type="text"
          placeholder="Search symptoms..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategorySelect(null)}
          className="transition-all duration-200"
        >
          All Categories
        </Button>
        {SYMPTOM_CATEGORIES.map((category) => {
          const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP]
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategorySelect(category.id)}
              className="transition-all duration-200"
            >
              <IconComponent className="size-3.5" />
              {category.name}
            </Button>
          )
        })}
      </div>

      {/* Symptom Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => {
          const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP]
          const filteredSymptoms = getFilteredSymptoms(category)
          
          if (filteredSymptoms.length === 0) return null

          return (
            <Card 
              key={category.id} 
              className={cn(
                "transition-all duration-300 hover:shadow-md",
                COLOR_MAP[category.color as keyof typeof COLOR_MAP]
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <IconComponent className="size-4" />
                  {category.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredSymptoms.map((symptom) => (
                  <div
                    key={symptom}
                    className="flex items-center space-x-2 group cursor-pointer"
                    onClick={() => onSymptomToggle(symptom)}
                  >
                    <Checkbox
                      id={`${category.id}-${symptom}`}
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => onSymptomToggle(symptom)}
                      className="transition-all duration-200"
                    />
                    <label
                      htmlFor={`${category.id}-${symptom}`}
                      className={cn(
                        "text-sm cursor-pointer transition-all duration-200 group-hover:text-foreground",
                        selectedSymptoms.includes(symptom) 
                          ? "font-medium text-foreground" 
                          : "text-muted-foreground"
                      )}
                    >
                      {symptom}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No results message */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <SearchIcon className="mx-auto size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No symptoms found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or selecting a different category.
          </p>
        </div>
      )}
    </div>
  )
}

export default function AISymptomChecker({ 
  patientId, 
  onComplete, 
  onCancel,
  initialSymptoms = [],
  mode = 'full'
}: SymptomCheckerProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(initialSymptoms)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentStep, setCurrentStep] = useState<'selection' | 'analysis' | 'results'>('selection')
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null)

  const handleSymptomToggle = useCallback((symptom: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom)
      } else {
        // Limit to maximum 10 symptoms for better analysis
        if (prev.length >= 10) {
          return prev
        }
        return [...prev, symptom]
      }
    })
  }, [])

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (selectedSymptoms.length === 0) return
    setCurrentStep('analysis')
    
    // Perform actual symptom analysis using the rule-based system with Firestore integration
    setTimeout(async () => {
      try {
        const analysisResult = await symptomAnalysisService.analyzeAndSaveSymptoms(
          selectedSymptoms,
          patientId
        )
        
        if (analysisResult.error) {
          console.warn('Warning saving to Firestore:', analysisResult.error)
          // Continue with the result even if Firestore save failed
        }
        
        setAnalysisResult(analysisResult.result)
        setCurrentStep('results')
      } catch (error) {
        console.error('Error analyzing symptoms:', error)
        // Fallback to basic result
        setAnalysisResult({
          id: `result-${Date.now()}`,
          patientId,
          sessionId: `session-${Date.now()}`,
          selectedSymptoms,
          matchedRules: [],
          finalAdvice: 'Unable to analyze symptoms at this time. Please consult a healthcare provider.',
          urgency: 'medium',
          recommendedActions: [],
          specialistReferrals: [],
          followUpRequired: false,
          confidence: 0,
          timestamp: new Date() as any,
          isArchived: false
        })
        setCurrentStep('results')
      }
    }, 1500)
  }, [selectedSymptoms, patientId])

  const handleReset = useCallback(() => {
    setSelectedSymptoms([])
    setSelectedCategory(null)
    setSearchQuery('')
    setCurrentStep('selection')
    setAnalysisResult(null)
  }, [])

  const handleSaveResult = useCallback(() => {
    if (analysisResult && onComplete) {
      onComplete(analysisResult)
    }
  }, [analysisResult, onComplete])

  const handleBookAppointment = useCallback((specialistType?: string) => {
    // This would integrate with the appointment booking system
    console.log('Booking appointment for specialist:', specialistType)
    // For now, just call onComplete to close the symptom checker
    if (analysisResult && onComplete) {
      onComplete(analysisResult)
    }
  }, [analysisResult, onComplete])

  if (currentStep === 'analysis') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Analyzing your symptoms...</h3>
          <p className="text-muted-foreground text-center">
            Please wait while we process your information and provide personalized health advice.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (currentStep === 'results' && analysisResult) {
    return (
      <SymptomResults
        result={analysisResult}
        onBookAppointment={handleBookAppointment}
        onSaveResult={handleSaveResult}
        onStartNewCheck={handleReset}
        onClose={onCancel}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StethoscopeIcon className="size-5 text-primary" />
            AI Symptom Checker
          </CardTitle>
          <CardDescription>
            Select the symptoms you're experiencing. Choose up to 10 symptoms for the most accurate assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {selectedSymptoms.length}/10 symptoms selected
              </Badge>
              {selectedSymptoms.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={selectedSymptoms.length === 0}
                className="transition-all duration-200"
              >
                Analyze Symptoms
                {selectedSymptoms.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {selectedSymptoms.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptom Selection */}
      <SymptomSelection
        selectedSymptoms={selectedSymptoms}
        onSymptomToggle={handleSymptomToggle}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
    </div>
  )
}