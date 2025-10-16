'use client'

import { 
  Query, 
  DocumentData, 
  QuerySnapshot, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore'

// Optimized Firestore subscription with automatic cleanup
export class OptimizedFirestoreSubscription<T = DocumentData> {
  private unsubscribe?: () => void
  private isActive = false
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 1000

  constructor(
    private firestoreQuery: Query<T>,
    private onData: (data: T[]) => void,
    private onError?: (error: Error) => void,
    private onLoading?: (loading: boolean) => void
  ) {}

  start() {
    if (this.isActive) return

    this.isActive = true
    this.onLoading?.(true)
    this.subscribe()
  }

  stop() {
    this.isActive = false
    this.unsubscribe?.()
    this.onLoading?.(false)
  }

  private subscribe() {
    this.unsubscribe = onSnapshot(
      this.firestoreQuery,
      (snapshot: QuerySnapshot<T>) => {
        if (!this.isActive) return

        const data: T[] = []
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as T)
        })

        this.onData(data)
        this.onLoading?.(false)
        this.retryCount = 0 // Reset retry count on success
      },
      (error) => {
        if (!this.isActive) return

        console.error('Firestore subscription error:', error)
        this.onError?.(error)
        this.onLoading?.(false)

        // Implement exponential backoff retry
        if (this.retryCount < this.maxRetries) {
          this.retryCount++
          const delay = this.retryDelay * Math.pow(2, this.retryCount - 1)
          
          setTimeout(() => {
            if (this.isActive) {
              console.log(`Retrying Firestore subscription (attempt ${this.retryCount})`)
              this.subscribe()
            }
          }, delay)
        }
      }
    )
  }
}

// Pagination helper for large datasets
export class FirestorePagination<T = DocumentData> {
  private lastDoc: any = null
  private hasMore = true
  private pageSize: number

  constructor(
    private baseQuery: Query<T>,
    pageSize: number = 20
  ) {
    this.pageSize = pageSize
  }

  async getNextPage(): Promise<{ data: T[]; hasMore: boolean }> {
    if (!this.hasMore) {
      return { data: [], hasMore: false }
    }

    let paginatedQuery = query(this.baseQuery, limit(this.pageSize))
    
    if (this.lastDoc) {
      paginatedQuery = query(paginatedQuery, startAfter(this.lastDoc))
    }

    try {
      const snapshot = await getDocs(paginatedQuery)
      const data: T[] = []
      
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as T)
      })

      // Update pagination state
      if (data.length < this.pageSize) {
        this.hasMore = false
      } else {
        this.lastDoc = snapshot.docs[snapshot.docs.length - 1]
      }

      return { data, hasMore: this.hasMore }
    } catch (error) {
      console.error('Pagination error:', error)
      throw error
    }
  }

  reset() {
    this.lastDoc = null
    this.hasMore = true
  }
}

// Query builder with optimization
export class OptimizedQueryBuilder<T = DocumentData> {
  private constraints: QueryConstraint[] = []
  private baseQuery: Query<T>

  constructor(baseQuery: Query<T>) {
    this.baseQuery = baseQuery
  }

  whereField(field: string, operator: any, value: any) {
    this.constraints.push(where(field, operator, value))
    return this
  }

  orderByField(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.constraints.push(orderBy(field, direction))
    return this
  }

  limitTo(count: number) {
    this.constraints.push(limit(count))
    return this
  }

  // Optimize for today's data
  todayOnly(dateField: string = 'createdAt') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    this.constraints.push(
      where(dateField, '>=', Timestamp.fromDate(today)),
      where(dateField, '<', Timestamp.fromDate(tomorrow))
    )
    return this
  }

  // Optimize for date range
  dateRange(dateField: string, start: Date, end: Date) {
    this.constraints.push(
      where(dateField, '>=', Timestamp.fromDate(start)),
      where(dateField, '<=', Timestamp.fromDate(end))
    )
    return this
  }

  build(): Query<T> {
    return query(this.baseQuery, ...this.constraints)
  }
}

// Batch operations helper
export class FirestoreBatchHelper {
  private operations: Array<() => Promise<void>> = []
  private batchSize: number

  constructor(batchSize: number = 500) {
    this.batchSize = batchSize
  }

  addOperation(operation: () => Promise<void>) {
    this.operations.push(operation)
  }

  async executeBatches(): Promise<void> {
    const batches = []
    
    for (let i = 0; i < this.operations.length; i += this.batchSize) {
      const batch = this.operations.slice(i, i + this.batchSize)
      batches.push(batch)
    }

    for (const batch of batches) {
      await Promise.all(batch.map(op => op()))
      
      // Add small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
}

// Cache for Firestore queries
export class FirestoreQueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  clear() {
    this.cache.clear()
  }

  // Generate cache key from query
  static generateKey(collectionPath: string, constraints: any[]): string {
    return `${collectionPath}:${JSON.stringify(constraints)}`
  }
}

// Performance monitoring for Firestore operations
export const firestorePerformance = {
  measureQuery: async <T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - start
      
      if (duration > 1000) {
        console.warn(`Slow Firestore query "${queryName}" took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`Firestore query "${queryName}" failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  },

  logSlowQueries: (threshold: number = 500) => {
    // This would integrate with your monitoring service
    console.log(`Monitoring Firestore queries slower than ${threshold}ms`)
  }
}

// Import getDocs for pagination
import { getDocs } from 'firebase/firestore'