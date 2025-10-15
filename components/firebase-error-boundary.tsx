'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isOnline: boolean
  retryCount: number
}

/**
 * Firebase Error Boundary Component
 * Catches and handles Firebase-related errors with user-friendly fallbacks
 */
export class FirebaseErrorBoundary extends Component<Props, State> {
  private maxRetries = 3
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      retryCount: 0
    }
  }

  componentDidMount() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Firebase Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true })
    
    // Auto-retry if we were offline
    if (this.state.hasError && this.isNetworkError(this.state.error)) {
      this.handleRetry()
    }
  }

  private handleOffline = () => {
    this.setState({ isOnline: false })
  }

  private isFirebaseError(error: Error | null): boolean {
    if (!error) return false
    
    const firebaseErrorCodes = [
      'auth/',
      'firestore/',
      'storage/',
      'functions/',
      'messaging/',
      'database/'
    ]
    
    return firebaseErrorCodes.some(code => error.message.includes(code))
  }

  private isNetworkError(error: Error | null): boolean {
    if (!error) return false
    
    const networkErrorMessages = [
      'network-request-failed',
      'offline',
      'unavailable',
      'timeout',
      'connection',
      'fetch'
    ]
    
    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    )
  }

  private getErrorType(error: Error | null): string {
    if (!error) return 'unknown'
    
    if (this.isNetworkError(error)) return 'network'
    if (this.isFirebaseError(error)) return 'firebase'
    return 'application'
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'An unknown error occurred'
    
    const errorType = this.getErrorType(error)
    
    switch (errorType) {
      case 'network':
        return this.state.isOnline 
          ? 'Network connection is unstable. Please check your internet connection.'
          : 'You are currently offline. Please check your internet connection.'
      
      case 'firebase':
        if (error.message.includes('auth/network-request-failed')) {
          return 'Authentication service is temporarily unavailable. Please try again.'
        }
        if (error.message.includes('firestore/unavailable')) {
          return 'Database service is temporarily unavailable. Please try again.'
        }
        return 'Firebase service is temporarily unavailable. Please try again.'
      
      default:
        return 'An unexpected error occurred. Please try refreshing the page.'
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }))

    // Exponential backoff for retries
    const delay = Math.pow(2, this.state.retryCount) * 1000
    
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      })
    }, delay)
  }

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In production, log to external error tracking service
    // Example: Sentry, LogRocket, etc.
    console.error('Logging error to external service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.getErrorType(this.state.error)
      const errorMessage = this.getErrorMessage(this.state.error)
      const canRetry = this.state.retryCount < this.maxRetries
      const isNetworkIssue = errorType === 'network'

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                Something went wrong
                {!this.state.isOnline && <WifiOff className="h-4 w-4" />}
                {this.state.isOnline && <Wifi className="h-4 w-4" />}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {errorMessage}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry}
                  disabled={!this.state.isOnline && isNetworkIssue}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={this.handleRefresh}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded-md text-sm">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="text-center text-sm text-gray-500">
              {!this.state.isOnline && (
                <p>You are currently offline. Some features may not work.</p>
              )}
              {this.state.retryCount >= this.maxRetries && (
                <p>Maximum retry attempts reached. Please refresh the page or contact support.</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook version of Firebase Error Boundary for functional components
 */
export function useFirebaseErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('Firebase operation failed:', error)
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isOnline,
    handleError,
    clearError
  }
}