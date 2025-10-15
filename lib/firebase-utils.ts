// Firebase utility functions
// Helper functions for Firebase operations and checks

import { auth, db } from './firebase'
import { validateFirebaseConfig } from './firebase-config'

/**
 * Check if Firebase is properly initialized
 * @returns boolean indicating if Firebase is ready
 */
export function isFirebaseInitialized(): boolean {
  try {
    return !!(auth && db && validateFirebaseConfig())
  } catch (error) {
    console.error('Firebase initialization check failed:', error)
    return false
  }
}

/**
 * Get Firebase connection status
 * @returns object with connection details
 */
export function getFirebaseStatus() {
  return {
    isConfigured: validateFirebaseConfig(),
    hasAuth: !!auth,
    hasFirestore: !!db,
    isReady: isFirebaseInitialized()
  }
}

/**
 * Log Firebase configuration status (for debugging)
 */
export function logFirebaseStatus() {
  const status = getFirebaseStatus()
  console.log('Firebase Status:', status)
  
  if (!status.isReady) {
    console.warn('Firebase is not properly configured. Please check your environment variables.')
  }
}