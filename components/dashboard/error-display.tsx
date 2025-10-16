'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorType, getErrorRecoveryStrategy } from '@/lib/utils/error-recovery'

// Import Progress component
import { Progress } from '@/components/ui/progress'

interface ErrorDisplayProps {
  error: Error
  errorType?: ErrorType
  isOnline?: boolean
  retryCount?: number
  maxRetries?: number
  isRetrying?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
  context?: string
}

/**
 * User-friendly error display component
 */
export function ErrorDisplay({
  error,
  errorType = 'unknown',
  isOnline = true,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false,
  onRetry,
  onDismiss,
  showDetails = false,
  context
}: ErrorDisplayProps) {
  const strategy = getErrorRecoveryStrategy(errorType, isOnline)
  const canRetry = strategy.canRecover && retryCount < maxRetries && onRetry
  const retryProgress = maxRetries > 0 ? (retryCount / maxRetries) * 100 : 0

  const getErrorSeverity = (errorType: ErrorType): 'default' | 'destructive' => {
    switch (errorType) {
      case 'network':
      case 'firebase':
        return 'destructive'
      case 'video':
      case 'prescription':
      case 'consultation':
        return 'default'
      default:
        return 'destructive'
    }
  }

  const getStatusIcon = () => {
    if (isRetrying) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />
    }

    if (retryCount >= maxRetries) {
      return <XCircle className="h-4 w-4" />
    }

    return <AlertTriangle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isRetrying) {
      return 'Retrying...'
    }
    
    if (!isOnline) {
      return 'Offline'
    }

    if (retryCount >= maxRetries) {
      return 'Failed'
    }

    return 'Error'
  }

  return (
    <Alert variant={getErrorSeverity(errorType)} className="relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          {getStatusIcon()}
          <div className="flex-1 space-y-2">
            <AlertTitle className="flex items-center gap-2">
              {strategy.userMessage || 'An error occurred'}
              <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
                {getStatusText()}
              </Badge>
            </AlertTitle>
            
            <AlertDescription className="space-y-2">
              <p>{error.message}</p>
              
              {context && (
                <p className="text-sm text-muted-foreground">
                  Context: {context}
                </p>
              )}

              {/* Retry Progress */}
              {maxRetries > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Retry attempts: {retryCount}/{maxRetries}</span>
                    <span>{Math.round(retryProgress)}%</span>
                  </div>
                  <Progress value={retryProgress} className="h-1" />
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </div>

              {/* Error Details (Development) */}
              {showDetails && process.env.NODE_ENV === 'development' && (
                <details className="mt-2 p-2 bg-muted rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-1">
                    <div><strong>Error Type:</strong> {errorType}</div>
                    <div><strong>Can Recover:</strong> {strategy.canRecover ? 'Yes' : 'No'}</div>
                    <div><strong>Max Retries:</strong> {strategy.maxRetries}</div>
                    <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border mt-2">
                      {error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </AlertDescription>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {canRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isRetrying || !isOnline}
              className="shrink-0"
            >
              {isRetrying ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Retry
            </Button>
          )}
          
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="shrink-0"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}

/**
 * Compact error display for inline use
 */
export function CompactErrorDisplay({
  error,
  errorType = 'unknown',
  onRetry,
  isRetrying = false
}: Pick<ErrorDisplayProps, 'error' | 'errorType' | 'onRetry' | 'isRetrying'>) {
  const strategy = getErrorRecoveryStrategy(errorType)

  return (
    <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="flex-1 text-destructive">
        {strategy.userMessage}
      </span>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
          className="shrink-0 h-6 px-2"
        >
          {isRetrying ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  )
}

/**
 * Success message display
 */
export function SuccessDisplay({
  message,
  onDismiss
}: {
  message: string
  onDismiss?: () => void
}) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Success</AlertTitle>
      <AlertDescription className="text-green-700 flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="shrink-0 text-green-600 hover:text-green-800"
          >
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Loading state with error fallback
 */
export function LoadingWithError({
  isLoading,
  error,
  errorType,
  onRetry,
  children,
  loadingMessage = 'Loading...'
}: {
  isLoading: boolean
  error?: Error | null
  errorType?: ErrorType
  onRetry?: () => void
  children: React.ReactNode
  loadingMessage?: string
}) {
  if (error) {
    return (
      <CompactErrorDisplay
        error={error}
        errorType={errorType}
        onRetry={onRetry}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>{loadingMessage}</span>
      </div>
    )
  }

  return <>{children}</>
}