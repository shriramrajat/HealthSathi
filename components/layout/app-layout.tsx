"use client"

import React from 'react'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { NotificationDisplay } from '@/components/notifications/notification-display'
import { Toaster } from '@/components/ui/toaster'

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * App layout component that wraps the application with notification providers
 * This should be used in pages that need notification functionality
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <NotificationProvider>
      {children}
      {/* Toast notifications for real-time display */}
      <NotificationDisplay />
      {/* Toaster for preference updates and other UI toasts */}
      <Toaster />
    </NotificationProvider>
  )
}