"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { NotificationBell, NotificationDisplay } from '@/components/notifications'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useNotificationContext } from '@/components/providers/notification-provider'
import { notificationService } from '@/lib/services/notification-service'

function NotificationUIDemo() {
  const { showTestNotification } = useNotificationContext()

  const handleTestNotification = async (type: string) => {
    try {
      const testNotifications = {
        appointment: {
          title: 'Appointment Booked',
          body: 'Your appointment with Dr. Smith has been confirmed for tomorrow at 2:00 PM.',
          data: { type: 'appointment_booked', appointmentId: 'test-123' }
        },
        prescription: {
          title: 'Prescription Ready',
          body: 'Your prescription for Amoxicillin is ready for pickup at Central Pharmacy.',
          data: { type: 'prescription_ready', prescriptionId: 'rx-456' }
        },
        emergency: {
          title: 'Emergency Alert',
          body: 'Emergency situation reported in your area. Please stay alert.',
          data: { type: 'emergency_alert', emergencyId: 'em-789' }
        },
        consultation: {
          title: 'Consultation Started',
          body: 'Dr. Johnson has started your video consultation. Click to join.',
          data: { type: 'consultation_started', consultationId: 'cons-101' }
        }
      }

      const notification = testNotifications[type as keyof typeof testNotifications]
      if (notification) {
        await notificationService.showNotification(notification)
      }
    } catch (error) {
      console.error('Failed to show test notification:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <LanguageSwitcher variant="compact" size="sm" />
        </div>
        <h1 className="text-3xl font-bold">Notification UI Components Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test and preview the notification system components
        </p>
      </div>

      {/* Notification Bell Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Bell</CardTitle>
          <CardDescription>
            Click the bell icon to open the notification drawer with message history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4 py-8">
            <NotificationBell />
            <p className="text-sm text-muted-foreground">
              Click the bell to view notifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Generate test notifications to see how they appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleTestNotification('appointment')}
            >
              Appointment
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleTestNotification('prescription')}
            >
              Prescription
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleTestNotification('emergency')}
            >
              Emergency
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleTestNotification('consultation')}
            >
              Consultation
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center">
            <Button onClick={showTestNotification}>
              Show Generic Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Display */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>
            Real-time toast notifications appear automatically for new messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Toast notifications will appear in the top-right corner when new notifications arrive
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Notification system capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Toast Notifications</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time toast display</li>
                <li>• Auto-hide after 5 seconds</li>
                <li>• Click to view details</li>
                <li>• Different variants for urgency</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Notification Drawer</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete message history</li>
                <li>• Mark as read functionality</li>
                <li>• Notification preferences</li>
                <li>• Responsive mobile design</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Notification Bell</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unread count badge</li>
                <li>• Accessible design</li>
                <li>• Multiple size variants</li>
                <li>• Loading states</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Preferences</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Notification type controls</li>
                <li>• Delivery method settings</li>
                <li>• Real-time updates</li>
                <li>• User-friendly interface</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Display Component */}
      <NotificationDisplay />
    </div>
  )
}

export default function NotificationUIDemoPage() {
  return <NotificationUIDemo />
}