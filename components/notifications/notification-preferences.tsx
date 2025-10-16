// Notification preferences component
// Allows users to configure their notification settings

'use client'

import React, { useState } from 'react'
import { Bell, Mail, MessageSquare, AlertTriangle, Calendar, Pill, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useToast } from '../../hooks/use-toast'
import { useNotificationContext } from '@/components/providers/notification-provider'
import type { NotificationPreferences } from '@/lib/services/notification-service'

export function NotificationPreferences() {
  const { preferences, updatePreferences, isLoading } = useNotificationContext()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading notification preferences...
          </div>
        </CardContent>
      </Card>
    )
  }

  const handlePreferenceChange = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    try {
      setSaving(true)
      await updatePreferences({ [key]: value })
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
        variant: "default"
      })
    } catch (error) {
      console.error('Failed to update preference:', error)
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const preferenceItems = [
    {
      key: 'appointments' as keyof NotificationPreferences,
      label: 'Appointments',
      description: 'Notifications about appointment bookings, confirmations, and reminders',
      icon: Calendar,
      value: preferences.appointments
    },
    {
      key: 'prescriptions' as keyof NotificationPreferences,
      label: 'Prescriptions',
      description: 'Notifications about new prescriptions and pharmacy updates',
      icon: Pill,
      value: preferences.prescriptions
    },
    {
      key: 'consultations' as keyof NotificationPreferences,
      label: 'Consultations',
      description: 'Notifications about video consultations and doctor messages',
      icon: MessageSquare,
      value: preferences.consultations
    },
    {
      key: 'emergencies' as keyof NotificationPreferences,
      label: 'Emergencies',
      description: 'Critical emergency alerts and urgent medical notifications',
      icon: AlertTriangle,
      value: preferences.emergencies
    },
    {
      key: 'general' as keyof NotificationPreferences,
      label: 'General',
      description: 'System updates and general healthcare platform notifications',
      icon: Bell,
      value: preferences.general
    }
  ]

  const deliveryMethods = [
    {
      key: 'pushNotifications' as keyof NotificationPreferences,
      label: 'Push Notifications',
      description: 'Browser notifications that appear on your device',
      icon: Smartphone,
      value: preferences.pushNotifications
    },
    {
      key: 'emailNotifications' as keyof NotificationPreferences,
      label: 'Email Notifications',
      description: 'Notifications sent to your email address',
      icon: Mail,
      value: preferences.emailNotifications
    }
  ]

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferenceItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={item.key} className="text-base font-medium">
                      {item.label}
                    </Label>
                    <Switch
                      id={item.key}
                      checked={item.value}
                      onCheckedChange={(checked: boolean) => 
                        handlePreferenceChange(item.key, checked)
                      }
                      disabled={isLoading || saving}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {deliveryMethods.map((method) => {
            const Icon = method.icon
            return (
              <div key={method.key} className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={method.key} className="text-base font-medium">
                      {method.label}
                    </Label>
                    <Switch
                      id={method.key}
                      checked={method.value}
                      onCheckedChange={(checked: boolean) => 
                        handlePreferenceChange(method.key, checked)
                      }
                      disabled={isLoading || saving}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Status */}
      {saving && (
        <div className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Saving preferences...
          </p>
        </div>
      )}
    </div>
  )
}