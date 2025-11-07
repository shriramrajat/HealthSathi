'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import { 
  Save, 
  Clock, 
  FileText, 
  Plus, 
  Loader2,
  CheckCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react'
import { Consultation } from '@/lib/types/dashboard-models'
import { updateConsultationNotes } from '@/lib/services/consultation-service'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface ConsultationNotesProps {
  consultation: Consultation
  onNotesUpdate?: (notes: string) => void
  className?: string
}

// Note templates for quick insertion
const NOTE_TEMPLATES = [
  {
    id: 'chief-complaint',
    title: 'Chief Complaint',
    template: 'Chief Complaint: \n\nHistory of Present Illness: \n\nReview of Systems: '
  },
  {
    id: 'physical-exam',
    title: 'Physical Examination',
    template: 'Vital Signs: \n- BP: \n- HR: \n- Temp: \n- RR: \n- O2 Sat: \n\nPhysical Examination: \n- General: \n- HEENT: \n- Cardiovascular: \n- Respiratory: \n- Abdomen: \n- Neurological: '
  },
  {
    id: 'assessment-plan',
    title: 'Assessment & Plan',
    template: 'Assessment: \n\nDifferential Diagnosis: \n1. \n2. \n3. \n\nPlan: \n- Medications: \n- Follow-up: \n- Patient Education: \n- Additional Testing: '
  },
  {
    id: 'follow-up',
    title: 'Follow-up',
    template: 'Follow-up Visit\n\nInterval History: \n\nCurrent Medications: \n\nCompliance: \n\nSymptom Review: \n\nPlan: '
  }
]

export function ConsultationNotes({ 
  consultation, 
  onNotesUpdate,
  className 
}: ConsultationNotesProps) {
  const t = useTranslations('consultation.notes')
  const tCommon = useTranslations('common')
  
  const [notes, setNotes] = useState(consultation.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-save functionality
  const saveNotes = useCallback(async (notesToSave: string) => {
    if (!consultation.id || notesToSave === consultation.notes) {
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)
      
      await updateConsultationNotes(consultation.id, notesToSave)
      
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      onNotesUpdate?.(notesToSave)
      
      toast.success(t('saved'))
    } catch (error) {
      console.error('Error saving notes:', error)
      setSaveError(error instanceof Error ? error.message : t('unsavedChanges'))
      toast.error(tCommon('messages.saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [consultation.id, consultation.notes, onNotesUpdate])

  // Handle notes change with auto-save
  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
    setHasUnsavedChanges(value !== consultation.notes)
    setSaveError(null)

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new auto-save timeout (2 seconds after user stops typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveNotes(value)
    }, 2000)
  }, [consultation.notes, saveNotes])

  // Manual save
  const handleManualSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    saveNotes(notes)
  }, [notes, saveNotes])

  // Insert template
  const insertTemplate = useCallback((template: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentNotes = notes
    
    const newNotes = currentNotes.substring(0, start) + 
                    (start > 0 && currentNotes[start - 1] !== '\n' ? '\n\n' : '') +
                    template + 
                    (end < currentNotes.length && currentNotes[end] !== '\n' ? '\n\n' : '') +
                    currentNotes.substring(end)
    
    setNotes(newNotes)
    handleNotesChange(newNotes)
    setShowTemplates(false)
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + template.length + 2
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }, [notes, handleNotesChange])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Update notes when consultation changes
  useEffect(() => {
    if (consultation.notes !== notes && !hasUnsavedChanges) {
      setNotes(consultation.notes || '')
    }
  }, [consultation.notes, notes, hasUnsavedChanges])

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 1) return t('justNow')
    if (diffMinutes < 60) return `${diffMinutes}m ${t('ago')}`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ${t('ago')}`
    
    return date.toLocaleDateString()
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Save status indicator */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Clock className="h-4 w-4" />
                  {t('unsavedChanges')}
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t('saved')} {formatLastSaved(lastSaved)}
                </>
              ) : null}
            </div>

            {/* Manual save button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="h-4 w-4" />
            </Button>

            {/* Templates button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Consultation info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={consultation.status === 'active' ? 'default' : 'secondary'}>
            {t('status')}
          </Badge>
          {consultation.patientName && (
            <span>{t('patient')}: {consultation.patientName}</span>
          )}
          {consultation.startTime && (
            <span>{t('started')}: {consultation.startTime.toDate().toLocaleTimeString()}</span>
          )}
        </div>

        {/* Error message */}
        {saveError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {saveError}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Templates dropdown */}
        {showTemplates && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('templates.title')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NOTE_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-2 text-left"
                    onClick={() => insertTemplate(template.template)}
                  >
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{t(`templates.${template.id}` as any)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {template.template.split('\n')[0]}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes textarea */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={t('placeholder')}
            className="min-h-[300px] resize-none"
            disabled={isSaving}
          />
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{notes.length} {t('characters')}</span>
            <span>{t('autoSaveInfo')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}