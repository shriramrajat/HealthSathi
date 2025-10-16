/**
 * Optimized Firestore service with caching, batching, and performance improvements
 * Implements healthcare-specific query optimizations and caching strategies
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  writeBatch,
  onSnapshot,
  QueryConstraint,
  enableNetwork,
  disableNetwork,
  terminate
} from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'

// Cache configuration
interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum number of cached items
  enabled: boolean
}

interface CachedItem<T> {
  data: T
  timestamp: number
  ttl: number
}



// Performance monitoring
interface QueryMetrics {
  queryTime: number
  cacheHit: boolean
  resultCount: number
  fromCache: boolean
}

class OptimizedFirestoreService {
  private cache = new Map<string, CachedItem<any>>()
  private queryCache = new Map<string, CachedItem<any>>()
  private listeners = new Map<string, () => void>()

  private batchTimeout: NodeJS.Timeout | null = null
  private metrics = new Map<string, QueryMetrics[]>()

  private defaultCacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enabled: true
  }

  private healthcareCacheConfig: Record<string, CacheConfig> = {
    // Patient data - longer cache for stable data
    patients: {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 50,
      enabled: true
    },
    // Appointments - shorter cache for dynamic data
    appointments: {
      ttl: 2 * 60 * 1000, // 2 minutes
      maxSize: 100,
      enabled: true
    },
    // Prescriptions - medium cache
    prescriptions: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 75,
      enabled: true
    },
    // Stock data - very short cache for real-time updates
    'pharmacy-stock': {
      ttl: 30 * 1000, // 30 seconds
      maxSize: 200,
      enabled: true
    },
    // Emergency logs - no cache for critical data
    'emergency-logs': {
      ttl: 0,
      maxSize: 0,
      enabled: false
    },
    // CHW logs - short cache
    'chw-logs': {
      ttl: 1 * 60 * 1000, // 1 minute
      maxSize: 50,
      enabled: true
    }
  }

  /**
   * Get cached configuration for a collection
   */
  private getCacheConfig(collectionName: string): CacheConfig {
    return this.healthcareCacheConfig[collectionName] || this.defaultCacheConfig
  }

  /**
   * Generate cache key for queries
   */
  private generateCacheKey(collectionName: string, constraints: QueryConstraint[]): string {
    const constraintString = constraints
      .map(constraint => constraint.toString())
      .sort()
      .join('|')
    
    return `${collectionName}:${constraintString}`
  }

  /**
   * Check if cached item is valid
   */
  private isCacheValid<T>(item: CachedItem<T>): boolean {
    if (item.ttl === 0) return false
    return Date.now() - item.timestamp < item.ttl
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache() {
    // Clean document cache
    for (const [key, item] of this.cache.entries()) {
      if (!this.isCacheValid(item)) {
        this.cache.delete(key)
      }
    }

    // Clean query cache
    for (const [key, item] of this.queryCache.entries()) {
      if (!this.isCacheValid(item)) {
        this.queryCache.delete(key)
      }
    }

    // Limit cache size
    if (this.cache.size > this.defaultCacheConfig.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, entries.length - this.defaultCacheConfig.maxSize)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Record query metrics for performance monitoring
   */
  private recordMetrics(key: string, metrics: QueryMetrics) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const keyMetrics = this.metrics.get(key)!
    keyMetrics.push(metrics)
    
    // Keep only last 10 metrics per key
    if (keyMetrics.length > 10) {
      keyMetrics.shift()
    }
  }

  /**
   * Optimized document retrieval with caching
   */
  async getDocument<T>(collectionName: string, documentId: string): Promise<T | null> {
    const startTime = performance.now()
    const cacheKey = `${collectionName}:${documentId}`
    const config = this.getCacheConfig(collectionName)

    // Check cache first
    if (config.enabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (this.isCacheValid(cached)) {
        this.recordMetrics(cacheKey, {
          queryTime: performance.now() - startTime,
          cacheHit: true,
          resultCount: 1,
          fromCache: true
        })
        return cached.data
      }
    }

    try {
      const db = await getFirebaseFirestore()
      const docRef = doc(db, collectionName, documentId)
      const docSnap = await getDoc(docRef)

      const result = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null

      // Cache the result
      if (config.enabled && result) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: config.ttl
        })
      }

      this.recordMetrics(cacheKey, {
        queryTime: performance.now() - startTime,
        cacheHit: false,
        resultCount: result ? 1 : 0,
        fromCache: false
      })

      return result
    } catch (error) {
      console.error(`Error fetching document ${documentId} from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Optimized query execution with caching and indexing hints
   */
  async queryCollection<T>(
    collectionName: string, 
    constraints: QueryConstraint[] = [],
    useCache: boolean = true
  ): Promise<T[]> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(collectionName, constraints)
    const config = this.getCacheConfig(collectionName)

    // Check cache first
    if (useCache && config.enabled && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!
      if (this.isCacheValid(cached)) {
        this.recordMetrics(cacheKey, {
          queryTime: performance.now() - startTime,
          cacheHit: true,
          resultCount: cached.data.length,
          fromCache: true
        })
        return cached.data
      }
    }

    try {
      const db = await getFirebaseFirestore()
      const q = query(collection(db, collectionName), ...constraints)
      const querySnapshot = await getDocs(q)

      const results: T[] = []
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as T)
      })

      // Cache the results
      if (useCache && config.enabled) {
        this.queryCache.set(cacheKey, {
          data: results,
          timestamp: Date.now(),
          ttl: config.ttl
        })
      }

      this.recordMetrics(cacheKey, {
        queryTime: performance.now() - startTime,
        cacheHit: false,
        resultCount: results.length,
        fromCache: false
      })

      // Clean cache periodically
      if (Math.random() < 0.1) { // 10% chance
        this.cleanCache()
      }

      return results
    } catch (error) {
      console.error(`Error querying collection ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Healthcare-specific optimized queries
   */
  async getPatientAppointments(patientId: string, limit_count: number = 10) {
    return this.queryCollection('appointments', [
      where('patientId', '==', patientId),
      where('status', 'in', ['scheduled', 'confirmed', 'in-progress']),
      orderBy('scheduledAt', 'desc'),
      limit(limit_count)
    ])
  }

  async getPatientPrescriptions(patientId: string, status?: string) {
    const constraints = [
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
      limit(20)
    ]

    if (status) {
      constraints.splice(1, 0, where('status', '==', status))
    }

    return this.queryCollection('prescriptions', constraints)
  }

  async getPharmacyStock(pharmacyId: string, lowStockOnly: boolean = false) {
    const constraints = [
      where('pharmacyId', '==', pharmacyId),
      where('isActive', '==', true),
      orderBy('medicineName', 'asc')
    ]

    const results = await this.queryCollection('pharmacy-stock', constraints)

    if (lowStockOnly) {
      return results.filter((item: any) => item.quantity <= item.minStockLevel)
    }

    return results
  }

  async getCHWLogs(chwId: string, actionType?: string, limit_count: number = 20) {
    const constraints = [
      where('chwId', '==', chwId),
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    ]

    if (actionType) {
      constraints.splice(1, 0, where('action', '==', actionType))
    }

    return this.queryCollection('chw-logs', constraints)
  }

  /**
   * Batch operations for better performance
   */
  async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete'
    collection: string
    id: string
    data?: any
  }>) {
    try {
      const db = await getFirebaseFirestore()
      const batch = writeBatch(db)

      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.id)
        
        switch (op.type) {
          case 'set':
            batch.set(docRef, op.data)
            break
          case 'update':
            batch.update(docRef, op.data)
            break
          case 'delete':
            batch.delete(docRef)
            break
        }
      })

      await batch.commit()

      // Invalidate cache for affected collections
      const affectedCollections = new Set(operations.map(op => op.collection))
      affectedCollections.forEach(collectionName => {
        this.invalidateCollectionCache(collectionName)
      })

    } catch (error) {
      console.error('Batch write failed:', error)
      throw error
    }
  }

  /**
   * Real-time listeners with automatic cleanup
   */
  subscribeToCollection<T>(
    collectionName: string,
    constraints: QueryConstraint[],
    callback: (data: T[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `${collectionName}:${Date.now()}`

    const setupListener = async () => {
      try {
        const db = await getFirebaseFirestore()
        const q = query(collection(db, collectionName), ...constraints)
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const results: T[] = []
            snapshot.forEach((docSnapshot) => {
              results.push({ id: docSnapshot.id, ...docSnapshot.data() } as T)
            })
            callback(results)
          },
          (error) => {
            console.error(`Listener error for ${collectionName}:`, error)
            onError?.(error)
          }
        )

        this.listeners.set(listenerId, unsubscribe)
        return unsubscribe
      } catch (error) {
        console.error(`Failed to setup listener for ${collectionName}:`, error)
        onError?.(error as Error)
        return () => {}
      }
    }

    setupListener()

    // Return cleanup function
    return () => {
      const unsubscribe = this.listeners.get(listenerId)
      if (unsubscribe) {
        unsubscribe()
        this.listeners.delete(listenerId)
      }
    }
  }

  /**
   * Cache management
   */
  invalidateCache(key: string) {
    this.cache.delete(key)
    this.queryCache.delete(key)
  }

  invalidateCollectionCache(collectionName: string) {
    // Remove all cache entries for this collection
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${collectionName}:`)) {
        this.cache.delete(key)
      }
    }

    for (const key of this.queryCache.keys()) {
      if (key.startsWith(`${collectionName}:`)) {
        this.queryCache.delete(key)
      }
    }
  }

  clearAllCache() {
    this.cache.clear()
    this.queryCache.clear()
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics() {
    const summary = new Map<string, {
      avgQueryTime: number
      cacheHitRate: number
      totalQueries: number
    }>()

    for (const [key, metrics] of this.metrics.entries()) {
      const totalQueries = metrics.length
      const avgQueryTime = metrics.reduce((sum, m) => sum + m.queryTime, 0) / totalQueries
      const cacheHits = metrics.filter(m => m.cacheHit).length
      const cacheHitRate = (cacheHits / totalQueries) * 100

      summary.set(key, {
        avgQueryTime,
        cacheHitRate,
        totalQueries
      })
    }

    return summary
  }

  /**
   * Network management for offline support
   */
  async enableOfflineMode() {
    try {
      const db = await getFirebaseFirestore()
      await disableNetwork(db)
      console.log('Firestore offline mode enabled')
    } catch (error) {
      console.error('Failed to enable offline mode:', error)
    }
  }

  async enableOnlineMode() {
    try {
      const db = await getFirebaseFirestore()
      await enableNetwork(db)
      console.log('Firestore online mode enabled')
    } catch (error) {
      console.error('Failed to enable online mode:', error)
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Cleanup all listeners
    for (const [id, unsubscribe] of this.listeners.entries()) {
      unsubscribe()
    }
    this.listeners.clear()

    // Clear caches
    this.clearAllCache()

    // Clear metrics
    this.metrics.clear()

    // Clear batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    try {
      const db = await getFirebaseFirestore()
      await terminate(db)
    } catch (error) {
      console.error('Failed to terminate Firestore:', error)
    }
  }
}

// Singleton instance
export const optimizedFirestore = new OptimizedFirestoreService()

// Export commonly used functions
export const {
  getDocument,
  queryCollection,
  getPatientAppointments,
  getPatientPrescriptions,
  getPharmacyStock,
  getCHWLogs,
  batchWrite,
  subscribeToCollection,
  invalidateCache,
  invalidateCollectionCache,
  clearAllCache,
  getPerformanceMetrics,
  enableOfflineMode,
  enableOnlineMode,
  cleanup
} = optimizedFirestore