// Demo page for testing notification functionality
// This page demonstrates how to use the notification system

'use client'

// Force dynamic rendering to prevent static generation errors with auth
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import React from 'react'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { NotificationPermission } from '@/components/notifications/notification-permission'
import { NotificationPreferences } from '@/components/notifications/notification-preferences'
import { NotificationSetupGuide } from '@/components/notifications/notification-setup-guide'
import NotificationTriggersDemo from '@/components/notifications/notification-triggers-demo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export default function NotificationsDemoPage() {
  return (
    <NotificationProvider>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notification System Demo</h1>
              <p className="text-muted-foreground">
                Test and configure the Firebase Cloud Messaging notification system
              </p>
            </div>
            <LanguageSwitcher variant="compact" size="sm" />
          </div>

          <Tabs defaultValue="setup" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
              <TabsTrigger value="permission">Permission</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="triggers">Test Triggers</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <NotificationSetupGuide />
            </TabsContent>

            <TabsContent value="permission" className="space-y-6">
              <NotificationPermission showSettings={true} compact={false} />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="triggers" className="space-y-6">
              <NotificationTriggersDemo />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </NotificationProvider>
  )
}