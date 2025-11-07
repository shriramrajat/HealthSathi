'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  History, 
  Download,
  Eye
} from 'lucide-react'
import { Consultation } from '@/lib/types/dashboard-models'
import { ConsultationNotes } from './consultation-notes'
import { ConsultationHistory } from './consultation-history'
import { useConsultationNotes } from '@/hooks/use-consultation-notes'
import { exportPatientConsultationNotes } from '@/lib/services/consultation-service'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface ConsultationDocumentationProps {
  doctorId: string
  activeConsultationId?: string
  patientId?: string
  onConsultationSelect?: (consultation: Consultation) => void
  className?: string
}

export function ConsultationDocumentation({ 
  doctorId, 
  activeConsultationId,
  patientId,
  onConsultationSelect,
  className 
}: ConsultationDocumentationProps) {
  const t = useTranslations('consultation.documentation')
  const tCommon = useTranslations('common')
  
  const [activeTab, setActiveTab] = useState(activeConsultationId ? 'notes' : 'history')
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)

  // Use consultation notes hook for active consultation
  const { 
    consultation: activeConsultation,
    hasUnsavedChanges,
    syncStatus
  } = useConsultationNotes({
    consultationId: activeConsultationId || '',
    autoSave: true
  })

  // Handle consultation selection from history
  const handleConsultationSelect = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    onConsultationSelect?.(consultation)
    
    // If selecting a different consultation, switch to notes tab
    if (consultation.id !== activeConsultationId) {
      setActiveTab('notes')
    }
  }

  // Export all consultation notes for a patient
  const exportAllConsultationNotes = async () => {
    if (!patientId) {
      toast.error(tCommon('messages.noData'))
      return
    }

    try {
      toast.loading(tCommon('status.loading'))
      
      const exportContent = await exportPatientConsultationNotes(doctorId, patientId)
      
      // Create and download file
      const blob = new Blob([exportContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consultation-notes-${patientId}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(tCommon('messages.success'))
    } catch (error) {
      console.error('Error exporting consultation notes:', error)
      toast.error(tCommon('messages.error'))
    }
  }

  // Get the consultation to display in notes tab
  const notesConsultation = selectedConsultation || activeConsultation

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('notes')}
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  •
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('history')}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Sync status indicator */}
            {activeConsultationId && (
              <Badge 
                variant={syncStatus === 'connected' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {syncStatus === 'connected' ? t('synced') : 
                 syncStatus === 'syncing' ? t('syncing') : 
                 syncStatus === 'error' ? t('error') : t('offline')}
              </Badge>
            )}

            {/* Export button */}
            {patientId && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportAllConsultationNotes}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('exportAll')}
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="notes" className="mt-0">
          {notesConsultation ? (
            <ConsultationNotes
              consultation={notesConsultation}
              onNotesUpdate={(updatedNotes) => {
                // Handle notes update if needed
                console.log('Notes updated:', updatedNotes)
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">{t('noActiveConsultation')}</h3>
                  <p className="mb-4">
                    {activeConsultationId 
                      ? t('loadingNotes') 
                      : t('selectFromHistory')
                    }
                  </p>
                  {!activeConsultationId && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('history')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      {t('viewHistory')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <ConsultationHistory
            doctorId={doctorId}
            patientId={patientId}
            onConsultationSelect={handleConsultationSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Selected consultation info */}
      {selectedConsultation && selectedConsultation.id !== activeConsultationId && (
        <Card className="mt-4 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('viewingConsultation')}{' '}
                  {selectedConsultation.startTime.toDate().toLocaleDateString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {selectedConsultation.status}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedConsultation(null)
                  if (activeConsultationId) {
                    setActiveTab('notes')
                  }
                }}
              >
                {t('clearSelection')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}