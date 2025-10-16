// Optimized Firebase initialization with lazy loading and performance improvements
// This file provides lazy-loaded Firebase services with proper error handling

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { firebaseConfig, validateFirebaseConfig } from './firebase-config'

// Lazy-loaded service imports
let authModule: any = null
let firestoreModule: any = null
let storageModule: any = null

// Service instances (lazy-initialized)
let app: FirebaseApp | null = null
let authInstance: any = null
let dbInstance: any = null
let storageInstance: any = null
let googleProviderInstance: any = null

// Performance monitoring
const performanceMetrics = {
  initTime: 0,
  authLoadTime: 0,
  firestoreLoadTime: 0,
  storageLoadTime: 0
}

/**
 * Initialize Firebase app with validation and error handling
 */
function initializeFirebaseApp(): FirebaseApp {
  const startTime = performance.now()
  
  try {
    // Validate configuration
    if (!validateFirebaseConfig()) {
      throw new Error('Firebase configuration is incomplete. Please check your environment variables.')
    }

    // Initialize app (singleton pattern)
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    performanceMetrics.initTime = performance.now() - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Firebase app initialized in ${performanceMetrics.initTime.toFixed(2)}ms`)
    }

    return app
  } catch (error) {
    console.error('Failed to initialize Firebase app:', error)
    throw error
  }
}

/**
 * Lazy-load Firebase Auth with performance optimization
 */
export async function getFirebaseAuth() {
  if (authInstance) return authInstance

  const startTime = performance.now()
  
  try {
    if (!app) {
      app = initializeFirebaseApp()
    }

    // Lazy load auth module
    if (!authModule) {
      authModule = await import('firebase/auth')
    }

    authInstance = authModule.getAuth(app)
    
    // Configure auth settings for better performance
    authInstance.settings = {
      appVerificationDisabledForTesting: process.env.NODE_ENV === 'test'
    }

    performanceMetrics.authLoadTime = performance.now() - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Firebase Auth loaded in ${performanceMetrics.authLoadTime.toFixed(2)}ms`)
    }

    return authInstance
  } catch (error) {
    console.error('Failed to load Firebase Auth:', error)
    throw error
  }
}

/**
 * Lazy-load Firestore with performance optimization
 */
export async function getFirebaseFirestore() {
  if (dbInstance) return dbInstance

  const startTime = performance.now()
  
  try {
    if (!app) {
      app = initializeFirebaseApp()
    }

    // Lazy load firestore module
    if (!firestoreModule) {
      firestoreModule = await import('firebase/firestore')
    }

    dbInstance = firestoreModule.getFirestore(app)
    
    // Enable offline persistence with enhanced configuration
    try {
      await firestoreModule.enableIndexedDbPersistence(dbInstance, {
        synchronizeTabs: true // Enable multi-tab synchronization
      })
      console.log('Firestore offline persistence enabled')
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open, trying without tab sync')
        try {
          await firestoreModule.enableIndexedDbPersistence(dbInstance, {
            synchronizeTabs: false
          })
          console.log('Firestore offline persistence enabled (single tab)')
        } catch (fallbackErr) {
          console.warn('Firestore persistence completely failed:', fallbackErr)
        }
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser')
      } else {
        console.warn('Firestore persistence failed:', err)
      }
    }

    // Configure offline settings
    try {
      await firestoreModule.enableNetwork(dbInstance)
    } catch (err) {
      console.warn('Failed to enable Firestore network:', err)
    }

    performanceMetrics.firestoreLoadTime = performance.now() - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Firestore loaded in ${performanceMetrics.firestoreLoadTime.toFixed(2)}ms`)
    }

    return dbInstance
  } catch (error) {
    console.error('Failed to load Firestore:', error)
    throw error
  }
}

/**
 * Lazy-load Firebase Storage
 */
export async function getFirebaseStorage() {
  if (storageInstance) return storageInstance

  const startTime = performance.now()
  
  try {
    if (!app) {
      app = initializeFirebaseApp()
    }

    // Lazy load storage module
    if (!storageModule) {
      storageModule = await import('firebase/storage')
    }

    storageInstance = storageModule.getStorage(app)

    performanceMetrics.storageLoadTime = performance.now() - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Firebase Storage loaded in ${performanceMetrics.storageLoadTime.toFixed(2)}ms`)
    }

    return storageInstance
  } catch (error) {
    console.error('Failed to load Firebase Storage:', error)
    throw error
  }
}

/**
 * Get Google Auth Provider with lazy loading
 */
export async function getGoogleProvider() {
  if (googleProviderInstance) return googleProviderInstance

  try {
    if (!authModule) {
      authModule = await import('firebase/auth')
    }

    googleProviderInstance = new authModule.GoogleAuthProvider()
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account'
    })

    return googleProviderInstance
  } catch (error) {
    console.error('Failed to create Google Auth Provider:', error)
    throw error
  }
}

/**
 * Preload Firebase services for better performance
 * Call this during app initialization or on user interaction
 */
export async function preloadFirebaseServices() {
  try {
    // Preload in parallel for better performance
    await Promise.all([
      getFirebaseAuth(),
      getFirebaseFirestore()
    ])
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Firebase services preloaded successfully')
    }
  } catch (error) {
    console.error('Failed to preload Firebase services:', error)
  }
}

/**
 * Get performance metrics for monitoring
 */
export function getFirebasePerformanceMetrics() {
  return { ...performanceMetrics }
}

/**
 * Legacy exports for backward compatibility
 * These will lazy-load the services when accessed
 */
export const auth = new Proxy({} as any, {
  get(target, prop) {
    if (!target._instance) {
      target._instance = getFirebaseAuth()
    }
    return target._instance.then((instance: any) => instance[prop])
  }
})

export const db = new Proxy({} as any, {
  get(target, prop) {
    if (!target._instance) {
      target._instance = getFirebaseFirestore()
    }
    return target._instance.then((instance: any) => instance[prop])
  }
})

export const googleProvider = new Proxy({} as any, {
  get(target, prop) {
    if (!target._instance) {
      target._instance = getGoogleProvider()
    }
    return target._instance.then((instance: any) => instance[prop])
  }
})

// Export the app getter
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeFirebaseApp()
  }
  return app
}

// Default export
export default getFirebaseApp