"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { useParams } from 'next/navigation'
import { 
  DEFAULT_LANGUAGE, 
  isValidLanguageCode, 
  getPreferredLanguage,
  detectBrowserLanguage,
  type Language 
} from '@/lib/i18n/languages'
import { I18N_CONFIG } from '@/lib/i18n/config'
import { useAuth } from '@/components/auth-provider'

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (language: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
  messages: Record<string, any>
  locale: string
}

export function LanguageProvider({ children, messages, locale }: LanguageProviderProps) {
  const { user } = useAuth()
  const [currentLanguage, setCurrentLanguage] = useState<string>(locale)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedMessages, setLoadedMessages] = useState<Record<string, any>>(messages)

  // Import language preference service dynamically to avoid circular dependencies
  const [languageService, setLanguageService] = useState<any>(null)

  useEffect(() => {
    const loadLanguageService = async () => {
      try {
        const service = await import('@/lib/services/language-preference-service')
        setLanguageService(service.languagePreferenceService)
      } catch (err) {
        console.error('Failed to load language preference service:', err)
      }
    }
    loadLanguageService()
  }, [])

  // Initialize language preference on mount and when user changes
  useEffect(() => {
    if (!languageService) return

    const initializeLanguage = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get user's preferred language
        const preferredLanguage = await languageService.getUserLanguage(user?.uid)
        
        if (preferredLanguage && preferredLanguage !== currentLanguage) {
          await handleLanguageChange(preferredLanguage, false) // Don't save to avoid loop
        }
      } catch (err) {
        console.error('Failed to initialize language preference:', err)
        setError('Failed to load language preference')
      } finally {
        setIsLoading(false)
      }
    }

    initializeLanguage()
  }, [user?.uid, languageService])

  const loadMessages = async (language: string): Promise<Record<string, any>> => {
    try {
      // Load messages for the specified language
      const messages = await import(`@/messages/${language}.json`)
      return messages.default
    } catch (err) {
      console.error(`Failed to load messages for language: ${language}`, err)
      
      // Fallback to English if loading fails
      if (language !== DEFAULT_LANGUAGE) {
        try {
          const fallbackMessages = await import(`@/messages/${DEFAULT_LANGUAGE}.json`)
          return fallbackMessages.default
        } catch (fallbackErr) {
          console.error('Failed to load fallback messages:', fallbackErr)
          return {}
        }
      }
      return {}
    }
  }

  const handleLanguageChange = async (language: string, savePreference: boolean = true) => {
    if (!isValidLanguageCode(language)) {
      setError(`Invalid language code: ${language}`)
      return
    }

    if (language === currentLanguage) {
      return // No change needed
    }

    try {
      setIsLoading(true)
      setError(null)

      // Load messages for the new language
      const newMessages = await loadMessages(language)
      
      // Update state
      setCurrentLanguage(language)
      setLoadedMessages(newMessages)

      // Save preference if requested
      if (savePreference && languageService) {
        await languageService.setUserLanguage(language, user?.uid)
      }

      // Update document language attribute for accessibility
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language
      }

    } catch (err) {
      console.error('Failed to change language:', err)
      setError('Failed to change language')
    } finally {
      setIsLoading(false)
    }
  }

  const setLanguage = async (language: string) => {
    await handleLanguageChange(language, true)
  }

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isLoading,
    error
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <NextIntlClientProvider
        locale={currentLanguage}
        messages={loadedMessages}
        timeZone="Asia/Kolkata"
        now={new Date()}
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}