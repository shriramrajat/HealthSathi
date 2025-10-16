/**
 * Error Recovery Utilities for Dashboard
 * Provides strategies for recovering from different types of errors
 */

export type ErrorType = 
  | 'network' 
  | 'firebase' 
  | 'video' 
  | 'prescription' 
  | 'patient-data' 
  | 'appointment' 
  | 'consultation'
  | 'unknown'

export interface ErrorRecoveryStrategy {
  canRecover: boolean
  maxRetries: number
  retryDelay: number
  fallbackAction?: () => void
  userMessage: string
  technicalMessage: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  jitter: boolean
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true
}

/**
 * Get error recovery strategy based on error type
 */
export function getErrorRecoveryStrategy(
  errorType: ErrorType,
  isOnline: boolean = true
): ErrorRecoveryStrategy {
  switch (errorType) {
    case 'network':
      return {
        canRecover: isOnline,
        maxRetries: 5,
        retryDelay: 2000,
        userMessage: isOnline 
          ? 'Network connection is unstable. Retrying...'
          : 'You are offline. Please check your internet connection.',
        technicalMessage: 'Network request failed. Implementing exponential backoff retry.',
        fallbackAction: () => {
          // Enable offline mode if available
          if (typeof window !== 'undefined') {
            localStorage.setItem('dashboard_offline_mode', 'true')
          }
        }
      }

    case 'firebase':
      return {
        canRecover: true,
        maxRetries: 3,
        retryDelay: 3000,
        userMessage: 'Database service is temporarily unavailable. Retrying...',
        technicalMessage: 'Firebase service error. Attempting reconnection.',
        fallbackAction: () => {
          // Switch to cached data if available
          console.log('Switching to cached data fallback')
        }
      }

    case 'video':
      return {
        canRecover: true,
        maxRetries: 2,
        retryDelay: 1000,
        userMessage: 'Video system is having issues. Trying to reconnect...',
        technicalMessage: 'WebRTC connection failed. Attempting media device reinitialization.',
        fallbackAction: () => {
          // Fallback to audio-only mode
          console.log('Falling back to audio-only consultation')
        }
      }

    case 'prescription':
      return {
        canRecover: true,
        maxRetries: 3,
        retryDelay: 2000,
        userMessage: 'Prescription system is temporarily unavailable. Retrying...',
        technicalMessage: 'Prescription service error. Retrying with exponential backoff.',
        fallbackAction: () => {
          // Save prescription locally for later sync
          console.log('Saving prescription locally for later synchronization')
        }
      }

    case 'patient-data':
      return {
        canRecover: true,
        maxRetries: 3,
        retryDelay: 1500,
        userMessage: 'Patient data is temporarily unavailable. Retrying...',
        technicalMessage: 'Patient data service error. Attempting data refresh.',
        fallbackAction: () => {
          // Use cached patient data if available
          console.log('Using cached patient data')
        }
      }

    case 'appointment':
      return {
        canRecover: true,
        maxRetries: 3,
        retryDelay: 2000,
        userMessage: 'Appointment data is temporarily unavailable. Retrying...',
        technicalMessage: 'Appointment service error. Refreshing appointment data.',
        fallbackAction: () => {
          // Show cached appointments with warning
          console.log('Showing cached appointments with staleness warning')
        }
      }

    case 'consultation':
      return {
        canRecover: true,
        maxRetries: 2,
        retryDelay: 1500,
        userMessage: 'Consultation system is having issues. Retrying...',
        technicalMessage: 'Consultation service error. Attempting service recovery.',
        fallbackAction: () => {
          // Save consultation notes locally
          console.log('Saving consultation notes locally')
        }
      }

    default:
      return {
        canRecover: false,
        maxRetries: 1,
        retryDelay: 1000,
        userMessage: 'An unexpected error occurred. Please refresh the page.',
        technicalMessage: 'Unknown error type. Manual intervention required.',
        fallbackAction: () => {
          // Log error for investigation
          console.error('Unknown error type encountered')
        }
      }
  }
}

/**
 * Exponential backoff retry utility
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error = new Error('No attempts made')

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === finalConfig.maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt),
        finalConfig.maxDelay
      )

      // Add jitter to prevent thundering herd
      if (finalConfig.jitter) {
        delay += Math.random() * 1000
      }

      console.log(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Circuit breaker pattern for error recovery
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

/**
 * Error classification utility
 */
export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  const stack = error.stack?.toLowerCase() || ''

  // Network errors
  if (message.includes('network') || message.includes('fetch') || 
      message.includes('timeout') || message.includes('offline') ||
      message.includes('connection')) {
    return 'network'
  }

  // Firebase errors
  if (message.includes('firestore') || message.includes('auth/') || 
      message.includes('storage/') || message.includes('firebase')) {
    return 'firebase'
  }

  // Video consultation errors
  if (message.includes('webrtc') || message.includes('media') || 
      message.includes('camera') || message.includes('microphone') ||
      stack.includes('video-consultation')) {
    return 'video'
  }

  // Prescription-related errors
  if (message.includes('prescription') || message.includes('medication') ||
      stack.includes('prescription-manager') || stack.includes('prescription-creator')) {
    return 'prescription'
  }

  // Patient data errors
  if (message.includes('patient') || stack.includes('patient-list') || 
      stack.includes('patient-details')) {
    return 'patient-data'
  }

  // Appointment errors
  if (message.includes('appointment') || stack.includes('appointments-display')) {
    return 'appointment'
  }

  // Consultation errors
  if (message.includes('consultation') || stack.includes('consultation-notes') ||
      stack.includes('consultation-history')) {
    return 'consultation'
  }

  return 'unknown'
}

/**
 * Global error handler for dashboard operations
 */
export class DashboardErrorHandler {
  private circuitBreakers = new Map<string, CircuitBreaker>()

  constructor() {
    // Initialize circuit breakers for different services
    this.circuitBreakers.set('firebase', new CircuitBreaker(3, 30000))
    this.circuitBreakers.set('video', new CircuitBreaker(2, 60000))
    this.circuitBreakers.set('prescription', new CircuitBreaker(3, 45000))
  }

  async handleOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(operationName)

    const wrappedOperation = async () => {
      if (circuitBreaker) {
        return circuitBreaker.execute(operation)
      }
      return operation()
    }

    return retryWithBackoff(wrappedOperation, retryConfig)
  }

  getCircuitBreakerState(operationName: string) {
    return this.circuitBreakers.get(operationName)?.getState()
  }
}

// Global instance
export const dashboardErrorHandler = new DashboardErrorHandler()