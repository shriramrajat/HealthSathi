// Notification setup guide component
// Helps users understand and set up notifications

'use client'

import React, { useState } from 'react'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  Monitor, 
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useNotificationContext } from '@/components/providers/notification-provider'

export function NotificationSetupGuide() {
  const { hasPermission, requestPermission, isLoading } = useNotificationContext()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const setupSteps = [
    {
      id: 'permission',
      title: 'Enable Browser Notifications',
      description: 'Allow the healthcare platform to send you notifications',
      completed: hasPermission,
      action: hasPermission ? null : requestPermission,
      actionLabel: 'Enable Notifications',
      icon: Bell
    },
    {
      id: 'preferences',
      title: 'Configure Notification Types',
      description: 'Choose which types of notifications you want to receive',
      completed: hasPermission, // Assume completed if permission is granted
      action: () => window.location.href = '/settings/notifications',
      actionLabel: 'Set Preferences',
      icon: Settings
    }
  ]

  const browserInstructions = [
    {
      browser: 'Chrome',
      icon: Monitor,
      steps: [
        'Click the lock icon in the address bar',
        'Select "Allow" for notifications',
        'Refresh the page if needed'
      ]
    },
    {
      browser: 'Firefox',
      icon: Monitor,
      steps: [
        'Click the shield icon in the address bar',
        'Click "Allow" when prompted for notifications',
        'Refresh the page if needed'
      ]
    },
    {
      browser: 'Safari',
      icon: Monitor,
      steps: [
        'Go to Safari > Preferences > Websites',
        'Select "Notifications" from the left sidebar',
        'Find this website and select "Allow"'
      ]
    },
    {
      browser: 'Mobile',
      icon: Smartphone,
      steps: [
        'Tap the menu button in your browser',
        'Go to Site Settings or Permissions',
        'Enable notifications for this site'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Setup Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Setup
          </CardTitle>
          <CardDescription>
            Follow these steps to enable real-time healthcare notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h3 className="font-medium">{step.title}</h3>
                    {step.completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>

                {step.action && !step.completed && (
                  <Button
                    onClick={step.action}
                    disabled={isLoading}
                    size="sm"
                  >
                    {step.actionLabel}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Browser Instructions */}
      {!hasPermission && (
        <Card>
          <CardHeader>
            <CardTitle>Browser-Specific Instructions</CardTitle>
            <CardDescription>
              If notifications aren't working, try these browser-specific steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {browserInstructions.map((instruction) => {
              const Icon = instruction.icon
              const isExpanded = expandedSection === instruction.browser
              
              return (
                <div key={instruction.browser} className="border rounded-lg">
                  <button
                    onClick={() => toggleSection(instruction.browser)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{instruction.browser}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        {instruction.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Not receiving notifications?</strong> Make sure your browser allows notifications 
              and that you haven't accidentally blocked them for this site.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Notifications not working on mobile?</strong> Some mobile browsers require 
              you to add the site to your home screen for notifications to work properly.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Still having issues?</strong> Try clearing your browser cache and cookies, 
              then refresh the page and try enabling notifications again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Benefits */}
      {hasPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">🎉 You're All Set!</CardTitle>
            <CardDescription>
              You'll now receive real-time notifications for:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Appointment confirmations and reminders
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                New prescriptions and pharmacy updates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Video consultation invitations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Emergency alerts and urgent messages
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}