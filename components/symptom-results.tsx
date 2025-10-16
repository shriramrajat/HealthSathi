'use client'

import { 
  CheckIcon, 
  AlertTriangleIcon, 
  AlertCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  BookOpenIcon,
  TrendingUpIcon
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { 
  SymptomAnalysisResult, 
  SymptomUrgencyLevel,
  RecommendedAction,
  SpecialistReferral
} from '@/lib/types/symptom-checker-types'
import { SymptomAnalysisService } from '@/lib/services/symptom-analysis'

interface SymptomResultsProps {
  result: SymptomAnalysisResult
  onBookAppointment?: (specialistType?: string) => void
  onSaveResult?: () => void
  onStartNewCheck?: () => void
  onClose?: () => void
}

// Urgency level styling configurations
const URGENCY_STYLES = {
  low: {
    icon: CheckIcon,
    iconColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    badgeVariant: 'default' as const,
    alertVariant: 'default' as const
  },
  medium: {
    icon: ClockIcon,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    badgeVariant: 'secondary' as const,
    alertVariant: 'default' as const
  },
  high: {
    icon: AlertTriangleIcon,
    iconColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-800 dark:text-orange-200',
    badgeVariant: 'secondary' as const,
    alertVariant: 'default' as const
  },
  emergency: {
    icon: XCircleIcon,
    iconColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    badgeVariant: 'destructive' as const,
    alertVariant: 'destructive' as const
  }
}

function UrgencyBadge({ urgency }: { urgency: SymptomUrgencyLevel }) {
  const style = URGENCY_STYLES[urgency]
  const Icon = style.icon
  const config = SymptomAnalysisService.getUrgencyConfig(urgency)

  return (
    <Badge variant={style.badgeVariant} className="flex items-center gap-1.5 px-3 py-1">
      <Icon className="size-3.5" />
      <span className="capitalize font-medium">{urgency}</span>
      {config && (
        <span className="text-xs opacity-80">• {config.timeframe}</span>
      )}
    </Badge>
  )
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'High Confidence'
    if (score >= 60) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <div className="flex items-center gap-2">
      <TrendingUpIcon className={cn('size-4', getConfidenceColor(confidence))} />
      <span className="text-sm font-medium">{getConfidenceLabel(confidence)}</span>
      <span className="text-xs text-muted-foreground">({confidence}%)</span>
    </div>
  )
}

function RecommendedActionCard({ action }: { action: RecommendedAction }) {
  const style = URGENCY_STYLES[action.urgency]
  const Icon = style.icon

  const getActionIcon = (type: RecommendedAction['type']) => {
    switch (type) {
      case 'emergency_care':
        return PhoneIcon
      case 'doctor_appointment':
        return CalendarIcon
      case 'specialist_referral':
        return UserIcon
      case 'pharmacy_visit':
        return BookOpenIcon
      default:
        return CheckIcon
    }
  }

  const ActionIcon = getActionIcon(action.type)

  return (
    <Card className={cn('transition-all duration-200', style.bgColor, style.borderColor)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-full', style.bgColor)}>
            <ActionIcon className={cn('size-4', style.iconColor)} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className={cn('font-medium', style.textColor)}>{action.title}</h4>
              <Badge variant={style.badgeVariant} className="text-xs">
                {action.timeframe}
              </Badge>
            </div>
            <p className={cn('text-sm', style.textColor, 'opacity-90')}>
              {action.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SpecialistReferralCard({ referral }: { referral: SpecialistReferral }) {
  const style = URGENCY_STYLES[referral.urgency]

  return (
    <Card className={cn('transition-all duration-200', style.bgColor, style.borderColor)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-full', style.bgColor)}>
            <UserIcon className={cn('size-4', style.iconColor)} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className={cn('font-medium', style.textColor)}>{referral.specialty}</h4>
              <UrgencyBadge urgency={referral.urgency} />
            </div>
            <p className={cn('text-sm', style.textColor, 'opacity-90')}>
              {referral.reason}
            </p>
            {referral.notes && (
              <p className={cn('text-xs', style.textColor, 'opacity-75')}>
                {referral.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SymptomResults({
  result,
  onBookAppointment,
  onSaveResult,
  onStartNewCheck,
  onClose
}: SymptomResultsProps) {
  const style = URGENCY_STYLES[result.urgency]
  const Icon = style.icon
  const config = SymptomAnalysisService.getUrgencyConfig(result.urgency)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with urgency indicator */}
      <Card className={cn('transition-all duration-300', style.bgColor, style.borderColor)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Icon className={cn('size-6', style.iconColor)} />
              <span className={style.textColor}>Symptom Analysis Complete</span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <ConfidenceIndicator confidence={result.confidence} />
              <UrgencyBadge urgency={result.urgency} />
            </div>
          </div>
          <CardDescription className={cn(style.textColor, 'opacity-80')}>
            {config?.description || 'Analysis completed successfully'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Emergency Alert */}
      {result.urgency === 'emergency' && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
          <XCircleIcon className="size-4" />
          <AlertTitle>Medical Emergency Detected</AlertTitle>
          <AlertDescription>
            Your symptoms may indicate a medical emergency. Please seek immediate medical attention 
            by calling emergency services or going to the nearest emergency room.
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selected Symptoms</CardTitle>
          <CardDescription>
            You reported {result.selectedSymptoms.length} symptom{result.selectedSymptoms.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.selectedSymptoms.map((symptom) => (
              <Badge key={symptom} variant="outline" className="text-sm">
                {symptom}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Advice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={style.alertVariant}>
            <Icon className="size-4" />
            <AlertTitle>Assessment Result</AlertTitle>
            <AlertDescription className="text-base leading-relaxed">
              {result.finalAdvice}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      {result.recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Actions</CardTitle>
            <CardDescription>
              Follow these recommendations based on your symptoms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.recommendedActions.map((action) => (
              <RecommendedActionCard key={action.id} action={action} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Specialist Referrals */}
      {result.specialistReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Specialist Referrals</CardTitle>
            <CardDescription>
              Consider consulting these specialists for your symptoms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.specialistReferrals.map((referral) => (
              <SpecialistReferralCard key={referral.id} referral={referral} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Matched Rules (for transparency) */}
      {result.matchedRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Details</CardTitle>
            <CardDescription>
              Rules that matched your symptoms (for transparency)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.matchedRules.map((rule, index) => (
              <div key={rule.ruleId} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{rule.ruleName}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(rule.matchScore)}% match
                    </Badge>
                    <UrgencyBadge urgency={rule.urgency} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rule.advice}</p>
                <div className="flex flex-wrap gap-1">
                  {rule.triggeredSymptoms.map((symptom) => (
                    <Badge key={symptom} variant="secondary" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Follow-up Information */}
      {result.followUpRequired && result.followUpDays && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClockIcon className="size-5" />
              Follow-up Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Follow-up Reminder</AlertTitle>
              <AlertDescription>
                Please follow up on your symptoms in {result.followUpDays} day{result.followUpDays !== 1 ? 's' : ''}. 
                If symptoms worsen or new symptoms appear, seek medical attention sooner.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {result.urgency !== 'emergency' && onBookAppointment && (
              <Button onClick={() => onBookAppointment()} className="flex-1 max-w-xs">
                <CalendarIcon className="size-4 mr-2" />
                Book Appointment
              </Button>
            )}
            
            {onSaveResult && (
              <Button variant="outline" onClick={onSaveResult} className="flex-1 max-w-xs">
                <BookOpenIcon className="size-4 mr-2" />
                Save Results
              </Button>
            )}
            
            {onStartNewCheck && (
              <Button variant="outline" onClick={onStartNewCheck} className="flex-1 max-w-xs">
                Check Again
              </Button>
            )}
            
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Medical Disclaimer:</strong> This symptom checker is for informational purposes only and 
            does not constitute medical advice. Always consult with a qualified healthcare provider for 
            proper diagnosis and treatment. In case of emergency, call emergency services immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}