'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Activity, Users, FileText, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: 'dashboard' | 'appointments' | 'patients' | 'prescriptions' | 'consultations'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isOnline: boolean
  retryCount: number
  errorType: DashboardErrorType
}

type DashboardErrorType = 
  | 'network' 
  | 'firebase' 
  | 'video' 
  | 'prescription' 
  | 'patient-data' 
  | 'appointment' 
  | 'consultation'
  | 'unknown'

/**
 * Dashboard-specific Error Boundary Component
 * Provides specialized error handling for different dashboard contexts
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  private maxRetries = 3
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      retryCount: 0,
      errorType: 'unknown'
    }
  }

  componentDidMount() {
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
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo)
    
    const errorType = this.classifyError(error)
    
    this.setState({
      error,
      errorInfo,
      errorType
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log dashboard-specific error details
    this.logDashboardError(error, errorInfo, errorType)
  }

  private handleOnline = () => {
    this.setState({ isOnline: true })
    
    // Auto-retry for network-related errors
    if (this.state.hasError && this.state.errorType === 'network') {
      this.handleRetry()
    }
  }

  private handleOffline = () => {
    this.setState({ isOnline: false })
  }

  private classifyError(error: Error): DashboardErrorType {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    // Network errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('timeout') || message.includes('offline')) {
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

  private getErrorIcon(errorType: DashboardErrorType) {
    switch (errorType) {
      case 'network':
        return this.state.isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      case 'patient-data':
        return <Users className="h-5 w-5" />
      case 'prescription':
        return <FileText className="h-5 w-5" />
      case 'appointment':
      case 'consultation':
        return <Activity className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  private getErrorTitle(errorType: DashboardErrorType): string {
    switch (errorType) {
      case 'network':
        return 'Connection Issue'
      case 'firebase':
        return 'Database Service Issue'
      case 'video':
        return 'Video Consultation Issue'
      case 'prescription':
        return 'Prescription System Issue'
      case 'patient-data':
        return 'Patient Data Issue'
      case 'appointment':
        return 'Appointment System Issue'
      case 'consultation':
        return 'Consultation System Issue'
      default:
        return 'Dashboard Error'
    }
  }

  private getErrorMessage(errorType: DashboardErrorType): string {
    if (!this.state.isOnline) {
      return 'You are currently offline. Some dashboard features may not work properly. Please check your internet connection.'
    }

    switch (errorType) {
      case 'network':
        return 'Network connection is unstable. Dashboard data may not be up to date. Please check your internet connection.'
      
      case 'firebase':
        return 'Database service is temporarily unavailable. Your dashboard data cannot be loaded or saved right now.'
      
      case 'video':
        return 'Video consultation system is experiencing issues. You may not be able to start or join video calls.'
      
      case 'prescription':
        return 'Prescription management system is temporarily unavailable. You may not be able to create or view prescriptions.'
      
      case 'patient-data':
        return 'Patient data system is experiencing issues. Patient information may not load properly.'
      
      case 'appointment':
        return 'Appointment system is temporarily unavailable. Appointment data may not be current.'
      
      case 'consultation':
        return 'Consultation system is experiencing issues. Consultation notes and history may not be available.'
      
      default:
        return 'The dashboard encountered an unexpected error. Some features may not work properly.'
    }
  }

  private getRecoveryActions(errorType: DashboardErrorType): string[] {
    const baseActions = ['Try refreshing the page', 'Check your internet connection']
    
    switch (errorType) {
      case 'video':
        return [
          ...baseActions,
          'Check camera and microphone permissions',
          'Try using a different browser',
          'Contact technical support if the issue persists'
        ]
      
      case 'prescription':
        return [
          ...baseActions,
          'Try creating prescriptions later',
          'Use alternative prescription methods if urgent',
          'Contact IT support for prescription system issues'
        ]
      
      case 'patient-data':
        return [
          ...baseActions,
          'Try searching for patients again',
          'Verify patient information manually if needed',
          'Contact support if patient data is missing'
        ]
      
      case 'appointment':
        return [
          ...baseActions,
          'Check appointment status manually',
          'Contact patients directly if needed',
          'Use alternative scheduling methods'
        ]
      
      case 'consultation':
        return [
          ...baseActions,
          'Save consultation notes locally as backup',
          'Try accessing consultation history later',
          'Contact support for data recovery'
        ]
      
      default:
        return baseActions
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }))

    // Exponential backoff with jitter
    const baseDelay = Math.pow(2, this.state.retryCount) * 1000
    const jitter = Math.random() * 1000
    const delay = baseDelay + jitter
    
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: 'unknown'
      })
    }, delay)
  }

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private logDashboardError(error: Error, errorInfo: ErrorInfo, errorType: DashboardErrorType) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      isOnline: this.state.isOnline,
      retryCount: this.state.retryCount
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard Error Details:', errorData)
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, or custom error service
      this.sendErrorToService(errorData)
    }
  }

  private sendErrorToService(errorData: any) {
    // Implementation for sending errors to external service
    // This would typically be Sentry, LogRocket, or a custom error tracking service
    console.error('Sending error to tracking service:', errorData)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { errorType } = this.state
      const errorTitle = this.getErrorTitle(errorType)
      const errorMessage = this.getErrorMessage(errorType)
      const recoveryActions = this.getRecoveryActions(errorType)
      const canRetry = this.state.retryCount < this.maxRetries
      const errorIcon = this.getErrorIcon(errorType)

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                {errorIcon}
                {errorTitle}
              </CardTitle>
              <CardDescription>
                {errorMessage}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    disabled={!this.state.isOnline && errorType === 'network'}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleRefresh}
                  className="flex-1"
                >
                  Refresh Dashboard
                </Button>
              </div>

              {/* Recovery Actions */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Suggested Actions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {recoveryActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Information */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  {this.state.isOnline ? (
                    <><Wifi className="h-3 w-3" /> Online</>
                  ) : (
                    <><WifiOff className="h-3 w-3" /> Offline</>
                  )}
                </div>
                {this.state.retryCount > 0 && (
                  <div>Retry attempts: {this.state.retryCount}/{this.maxRetries}</div>
                )}
              </div>

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error Type:</strong> {errorType}
                    </div>
                    <div>
                      <strong>Context:</strong> {this.props.context || 'dashboard'}
                    </div>
                    <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for dashboard error handling in functional components
 */
export function useDashboardErrorHandler(context?: Props['context']) {
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
    console.error(`Dashboard ${context || 'general'} error:`, error)
    setError(error)
  }, [context])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const retryOperation = React.useCallback(async (operation: () => Promise<void>) => {
    try {
      clearError()
      await operation()
    } catch (err) {
      handleError(err as Error)
    }
  }, [handleError, clearError])

  return {
    error,
    isOnline,
    handleError,
    clearError,
    retryOperation
  }
}