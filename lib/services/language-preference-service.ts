import { 
  DEFAULT_LANGUAGE, 
  isValidLanguageCode, 
  getPreferredLanguage,
  detectBrowserLanguage 
} from '@/lib/i18n/languages'
import { I18N_CONFIG } from '@/lib/i18n/config'
import { getFirebaseFirestore } from '@/lib/firebase'

interface LanguagePreference {
  language: string
  updatedAt: Date
  source: 'user' | 'browser' | 'default'
}

class LanguagePreferenceService {
  private firestoreModule: any = null
  private db: any = null

  /**
   * Initialize Firestore modules lazily
   */
  private async initializeFirestore() {
    if (!this.db) {
      this.db = await getFirebaseFirestore()
      this.firestoreModule = await import('firebase/firestore')
    }
    return { db: this.db, firestore: this.firestoreModule }
  }

  /**
   * Get user's language preference with fallback chain
   * Priority: Firestore (authenticated) > Local Storage > Browser > Default
   */
  async getUserLanguage(userId?: string): Promise<string> {
    try {
      // 1. Try to get from Firestore if user is authenticated
      if (userId) {
        const firestoreLanguage = await this.getLanguageFromFirestore(userId)
        if (firestoreLanguage && isValidLanguageCode(firestoreLanguage)) {
          return firestoreLanguage
        }
      }

      // 2. Try to get from local storage
      const localLanguage = this.getLocalLanguage()
      if (localLanguage && isValidLanguageCode(localLanguage)) {
        return localLanguage
      }

      // 3. Try to detect from browser
      const browserLanguage = detectBrowserLanguage()
      if (browserLanguage && isValidLanguageCode(browserLanguage)) {
        return browserLanguage
      }

      // 4. Fallback to default language
      return DEFAULT_LANGUAGE
    } catch (error) {
      console.error('Error getting user language:', error)
      return DEFAULT_LANGUAGE
    }
  }

  /**
   * Set user's language preference
   * Saves to both Firestore (if authenticated) and local storage
   */
  async setUserLanguage(language: string, userId?: string): Promise<void> {
    if (!isValidLanguageCode(language)) {
      throw new Error(`Invalid language code: ${language}`)
    }

    try {
      // Always save to local storage for immediate access
      this.setLocalLanguage(language)

      // Save to Firestore if user is authenticated
      if (userId) {
        await this.setLanguageInFirestore(userId, language)
      }
    } catch (error) {
      console.error('Error setting user language:', error)
      throw error
    }
  }

  /**
   * Get language preference from local storage
   */
  getLocalLanguage(): string | null {
    try {
      if (typeof window === 'undefined') return null
      
      const stored = localStorage.getItem(I18N_CONFIG.localeDetection.localStorageKey)
      return stored && isValidLanguageCode(stored) ? stored : null
    } catch (error) {
      console.error('Error reading from local storage:', error)
      return null
    }
  }

  /**
   * Set language preference in local storage
   */
  setLocalLanguage(language: string): void {
    try {
      if (typeof window === 'undefined') return
      
      if (!isValidLanguageCode(language)) {
        throw new Error(`Invalid language code: ${language}`)
      }

      localStorage.setItem(I18N_CONFIG.localeDetection.localStorageKey, language)
    } catch (error) {
      console.error('Error writing to local storage:', error)
      throw error
    }
  }

  /**
   * Get language preference from Firestore
   */
  private async getLanguageFromFirestore(userId: string): Promise<string | null> {
    try {
      const { db, firestore } = await this.initializeFirestore()
      
      const userDocRef = firestore.doc(db, 'users', userId)
      const userDoc = await firestore.getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const language = userData?.[I18N_CONFIG.localeDetection.firestoreField]
        return language && isValidLanguageCode(language) ? language : null
      }
      
      return null
    } catch (error) {
      console.error('Error reading language from Firestore:', error)
      return null
    }
  }

  /**
   * Set language preference in Firestore
   */
  private async setLanguageInFirestore(userId: string, language: string): Promise<void> {
    try {
      const { db, firestore } = await this.initializeFirestore()
      
      const userDocRef = firestore.doc(db, 'users', userId)
      
      // Update the user document with the new language preference
      await firestore.updateDoc(userDocRef, {
        [I18N_CONFIG.localeDetection.firestoreField]: language,
        languageUpdatedAt: firestore.serverTimestamp(),
      })
    } catch (error) {
      // If document doesn't exist, create it with the language preference
      if (error instanceof Error && error.message.includes('No document to update')) {
        try {
          const { db, firestore } = await this.initializeFirestore()
          const userDocRef = firestore.doc(db, 'users', userId)
          
          await firestore.setDoc(userDocRef, {
            [I18N_CONFIG.localeDetection.firestoreField]: language,
            languageUpdatedAt: firestore.serverTimestamp(),
          }, { merge: true })
        } catch (setError) {
          console.error('Error creating user document with language preference:', setError)
          throw setError
        }
      } else {
        console.error('Error setting language in Firestore:', error)
        throw error
      }
    }
  }

  /**
   * Synchronize language preference between local storage and Firestore
   * Useful when user logs in/out
   */
  async synchronizeLanguagePreference(userId?: string): Promise<string> {
    try {
      if (userId) {
        // User is authenticated - sync from Firestore to local storage
        const firestoreLanguage = await this.getLanguageFromFirestore(userId)
        const localLanguage = this.getLocalLanguage()
        
        if (firestoreLanguage && firestoreLanguage !== localLanguage) {
          // Firestore has different preference, update local storage
          this.setLocalLanguage(firestoreLanguage)
          return firestoreLanguage
        } else if (localLanguage && !firestoreLanguage) {
          // Local storage has preference but Firestore doesn't, update Firestore
          await this.setLanguageInFirestore(userId, localLanguage)
          return localLanguage
        }
        
        return firestoreLanguage || localLanguage || DEFAULT_LANGUAGE
      } else {
        // User is not authenticated - use local storage or default
        return this.getLocalLanguage() || DEFAULT_LANGUAGE
      }
    } catch (error) {
      console.error('Error synchronizing language preference:', error)
      return DEFAULT_LANGUAGE
    }
  }

  /**
   * Clear language preferences (useful for testing or reset functionality)
   */
  async clearLanguagePreferences(userId?: string): Promise<void> {
    try {
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(I18N_CONFIG.localeDetection.localStorageKey)
      }

      // Clear Firestore if user is authenticated
      if (userId) {
        const { db, firestore } = await this.initializeFirestore()
        const userDocRef = firestore.doc(db, 'users', userId)
        
        await firestore.updateDoc(userDocRef, {
          [I18N_CONFIG.localeDetection.firestoreField]: firestore.deleteField(),
          languageUpdatedAt: firestore.deleteField(),
        })
      }
    } catch (error) {
      console.error('Error clearing language preferences:', error)
      throw error
    }
  }

  /**
   * Get language preference metadata
   */
  async getLanguagePreferenceMetadata(userId?: string): Promise<LanguagePreference | null> {
    try {
      if (userId) {
        const { db, firestore } = await this.initializeFirestore()
        const userDocRef = firestore.doc(db, 'users', userId)
        const userDoc = await firestore.getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const language = userData?.[I18N_CONFIG.localeDetection.firestoreField]
          const updatedAt = userData?.languageUpdatedAt?.toDate()
          
          if (language) {
            return {
              language,
              updatedAt: updatedAt || new Date(),
              source: 'user'
            }
          }
        }
      }

      // Check local storage
      const localLanguage = this.getLocalLanguage()
      if (localLanguage) {
        return {
          language: localLanguage,
          updatedAt: new Date(), // We don't store timestamp in localStorage
          source: 'browser'
        }
      }

      // Default fallback
      return {
        language: DEFAULT_LANGUAGE,
        updatedAt: new Date(),
        source: 'default'
      }
    } catch (error) {
      console.error('Error getting language preference metadata:', error)
      return null
    }
  }
}

// Export singleton instance
export const languagePreferenceService = new LanguagePreferenceService()

// Export class for testing
export { LanguagePreferenceService }