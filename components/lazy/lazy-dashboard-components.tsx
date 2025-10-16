"use client"

import { lazy, Suspense, ComponentType } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

// Loading fallback components with accessibility features
const DashboardComponentSkeleton = ({ title }: { title: string }) => (
  <Card className="w-full" role="region" aria-label={`Loading ${title}`}>
    <CardHeader>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
)

const ComponentLoadingSpinner = ({ title }: { title: string }) => (
  <div 
    className="flex flex-col items-center justify-center p-8 space-y-4"
    role="status"
    aria-label={`Loading ${title}`}
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">Loading {title}...</p>
  </div>
)

// Lazy-loaded dashboard components with proper error boundaries
export const LazyAISymptomChecker = lazy(() => 
  import('@/components/ai-symptom-checker').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load AI Symptom Checker:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The symptom checker could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyVideoConsultation = lazy(() => 
  import('@/components/video-consultation').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Video Consultation:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The video consultation could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyAppointmentBooking = lazy(() => 
  import('@/components/dashboard/appointment-booking').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Appointment Booking:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The appointment booking could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyPrescriptionDisplay = lazy(() => 
  import('@/components/dashboard/prescription-display').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Prescription Display:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The prescription display could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyPharmacyFinder = lazy(() => 
  import('@/components/dashboard/pharmacy-finder').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Pharmacy Finder:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The pharmacy finder could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyStockManagement = lazy(() => 
  import('@/components/pharmacy/stock-management').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Stock Management:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The stock management could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyPrescriptionManagement = lazy(() => 
  import('@/components/pharmacy/prescription-management').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Prescription Management:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The prescription management could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyPatientRegistration = lazy(() => 
  import('@/components/chw/patient-registration').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Patient Registration:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The patient registration could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyQRScanner = lazy(() => 
  import('@/components/chw/qr-scanner').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load QR Scanner:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The QR scanner could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

export const LazyEmergencyLogger = lazy(() => 
  import('@/components/chw/emergency-logger').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load Emergency Logger:', error)
    return {
      default: () => (
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load</CardTitle>
            <CardDescription>
              The emergency logger could not be loaded. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
  })
)

// Higher-order component for lazy loading with accessibility
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  displayName: string,
  LoadingComponent?: ComponentType<{ title: string }>
) {
  const LazyComponent = (props: T) => (
    <Suspense 
      fallback={
        LoadingComponent ? 
          <LoadingComponent title={displayName} /> : 
          <ComponentLoadingSpinner title={displayName} />
      }
    >
      <Component {...props} />
    </Suspense>
  )

  LazyComponent.displayName = `Lazy(${displayName})`
  return LazyComponent
}

// Wrapped components with suspense and accessibility
export const AISymptomCheckerWithSuspense = withLazyLoading(
  LazyAISymptomChecker, 
  'AI Symptom Checker',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const VideoConsultationWithSuspense = withLazyLoading(
  LazyVideoConsultation, 
  'Video Consultation',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const AppointmentBookingWithSuspense = withLazyLoading(
  LazyAppointmentBooking, 
  'Appointment Booking',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const PrescriptionDisplayWithSuspense = withLazyLoading(
  LazyPrescriptionDisplay, 
  'Prescription Display',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const PharmacyFinderWithSuspense = withLazyLoading(
  LazyPharmacyFinder, 
  'Pharmacy Finder',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const StockManagementWithSuspense = withLazyLoading(
  LazyStockManagement, 
  'Stock Management',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const PrescriptionManagementWithSuspense = withLazyLoading(
  LazyPrescriptionManagement, 
  'Prescription Management',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const PatientRegistrationWithSuspense = withLazyLoading(
  LazyPatientRegistration, 
  'Patient Registration',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const QRScannerWithSuspense = withLazyLoading(
  LazyQRScanner, 
  'QR Scanner',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)

export const EmergencyLoggerWithSuspense = withLazyLoading(
  LazyEmergencyLogger, 
  'Emergency Logger',
  ({ title }) => <DashboardComponentSkeleton title={title} />
)