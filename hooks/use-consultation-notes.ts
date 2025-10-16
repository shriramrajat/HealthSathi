'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Unsubscribe } from 'firebase/firestore'
import { Consultation } from '@/lib/types/dashboard-models'
import { 
  subscribeToConsultation, 
  updateConsultationNotes 
} from '@/lib/services/consultation-service'

interface UseConsultationNotesProps {
  consultationId: string
  autoSave?: boolean
  autoSaveDelay?: number // in milliseconds
}

interface UseConsultationNotesReturn {
  consultation: Consultation | null
  notes: string
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  error: string | null
  isConnected: boolean
  // Actions
  updateNotes: (notes: string) => void
  saveNotes: () => Promise<void>
  insertTemplate: (template: string, position?: number) => void
  // Real-time sync status
  syncStatus: 'connected' | 'disconnected' | 'syncing' | 'error'
}

export function useConsultationNotes({
  consultationId,
  autoSave = true,
  autoSaveDelay = 2000
}: UseConsultationNotesProps): UseConsultationNotesReturn {
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing' | 'error'>('disconnected')

  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastServerNotesRef = useRef<string>('')

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }
    setIsConnected(false)
    setSyncStatus('disconnected')
  }, [])

  // Save notes to server
  const saveNotes = useCallback(async (notesToSave?: string): Promise<void> => {
    const currentNotes = notesToSave || notes
    
    if (!consultationId || currentNotes === lastServerNotesRef.current) {
      return
    }

    try {
      setIsSaving(true)
      setSyncStatus('syncing')
      setError(null)

      await updateConsultationNotes(consultationId, currentNotes)
      
      lastServerNotesRef.current = currentNotes
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      setSyncStatus('connected')
    } catch (err) {
      console.error('Error saving consultation notes:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save notes'
      setError(errorMessage)
      setSyncStatus('error')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [consultationId, notes])

  // Update notes with auto-save
  const updateNotes = useCallback((newNotes: string) => {
    setNotes(newNotes)
    setHasUnsavedChanges(newNotes !== lastServerNotesRef.current)
    setError(null)

    if (autoSave) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Set new auto-save timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveNotes(newNotes).catch(console.error)
      }, autoSaveDelay)
    }
  }, [autoSave, autoSaveDelay, saveNotes])

  // Insert template at specific position
  const insertTemplate = useCallback((template: string, position?: number) => {
    const insertPos = position !== undefined ? position : notes.length
    const newNotes = notes.slice(0, insertPos) + 
                    (insertPos > 0 && notes[insertPos - 1] !== '\n' ? '\n\n' : '') +
                    template + 
                    (insertPos < notes.length && notes[insertPos] !== '\n' ? '\n\n' : '') +
                    notes.slice(insertPos)
    
    updateNotes(newNotes)
  }, [notes, updateNotes])

  // Subscribe to consultation updates
  useEffect(() => {
    if (!consultationId) {
      setError('Consultation ID is required')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    cleanup()

    try {
      const unsubscribe = subscribeToConsultation(
        consultationId,
        (updatedConsultation) => {
          if (updatedConsultation) {
            setConsultation(updatedConsultation)
            
            // Update notes if they changed on the server and we don't have unsaved changes
            if (updatedConsultation.notes !== lastServerNotesRef.current) {
              lastServerNotesRef.current = updatedConsultation.notes || ''
              
              // Only update local notes if we don't have unsaved changes
              if (!hasUnsavedChanges) {
                setNotes(updatedConsultation.notes || '')
              }
            }
            
            setIsConnected(true)
            setSyncStatus('connected')
          } else {
            setConsultation(null)
            setIsConnected(false)
            setSyncStatus('error')
            setError('Consultation not found')
          }
          setIsLoading(false)
        }
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to consultation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load consultation')
      setIsLoading(false)
      setSyncStatus('error')
    }

    return cleanup
  }, [consultationId, cleanup, hasUnsavedChanges])

  // Handle manual save
  const handleManualSave = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    await saveNotes()
  }, [saveNotes])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    consultation,
    notes,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    error,
    isConnected,
    updateNotes,
    saveNotes: handleManualSave,
    insertTemplate,
    syncStatus
  }
}