"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAccessibility } from './accessibility-provider'
import { 
  Settings, 
  Eye, 
  Type, 
  Zap, 
  Volume2, 
  Keyboard, 
  Focus,
  RotateCcw,
  Info
} from 'lucide-react'

export function AccessibilitySettings() {
  const { settings, updateSetting, resetSettings } = useAccessibility()
  const [isOpen, setIsOpen] = useState(false)

  const accessibilityOptions = [
    {
      id: 'highContrast' as const,
      title: 'High Contrast Mode',
      description: 'Increases contrast for better visibility',
      icon: Eye,
      category: 'Visual',
      healthcareNote: 'Recommended for users with visual impairments or when working in bright environments'
    },
    {
      id: 'largeText' as const,
      title: 'Large Text',
      description: 'Increases text size throughout the application',
      icon: Type,
      category: 'Visual',
      healthcareNote: 'Helpful for elderly patients and healthcare workers with vision difficulties'
    },
    {
      id: 'reducedMotion' as const,
      title: 'Reduced Motion',
      description: 'Minimizes animations and transitions',
      icon: Zap,
      category: 'Motion',
      healthcareNote: 'Reduces motion sickness and helps users with vestibular disorders'
    },
    {
      id: 'screenReaderMode' as const,
      title: 'Screen Reader Optimization',
      description: 'Optimizes interface for screen readers',
      icon: Volume2,
      category: 'Audio',
      healthcareNote: 'Essential for visually impaired healthcare professionals and patients'
    },
    {
      id: 'keyboardNavigation' as const,
      title: 'Enhanced Keyboard Navigation',
      description: 'Improves keyboard-only navigation',
      icon: Keyboard,
      category: 'Input',
      healthcareNote: 'Allows hands-free operation, useful during medical procedures'
    },
    {
      id: 'focusVisible' as const,
      title: 'Enhanced Focus Indicators',
      description: 'Makes focus indicators more visible',
      icon: Focus,
      category: 'Visual',
      healthcareNote: 'Helps track current position when navigating with keyboard or assistive devices'
    }
  ]

  const categories = ['Visual', 'Motion', 'Audio', 'Input']

  return (
    <Dialog open={isOpen} onValueChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          aria-label="Open accessibility settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Accessibility</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize the interface to meet your accessibility needs. These settings are saved locally and will persist across sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Healthcare-specific notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Healthcare Accessibility</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    These settings are designed to support healthcare professionals and patients with diverse accessibility needs. 
                    Changes take effect immediately and are optimized for medical workflows.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings by category */}
          {categories.map(category => {
            const categoryOptions = accessibilityOptions.filter(option => option.category === category)
            
            return (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  {category} Settings
                </h3>
                
                <div className="grid gap-4">
                  {categoryOptions.map(option => {
                    const IconComponent = option.icon
                    const isEnabled = settings[option.id]
                    
                    return (
                      <Card key={option.id} className={`transition-colors ${isEnabled ? 'border-primary bg-primary/5' : ''}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Label 
                                    htmlFor={option.id}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {option.title}
                                  </Label>
                                  {isEnabled && (
                                    <Badge variant="secondary" className="text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {option.description}
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                                  <p className="text-xs text-amber-800">
                                    <strong>Healthcare Note:</strong> {option.healthcareNote}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Switch
                              id={option.id}
                              checked={isEnabled}
                              onCheckedChange={(checked) => updateSetting(option.id, checked)}
                              aria-describedby={`${option.id}-description`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Current settings summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Settings Summary</CardTitle>
              <CardDescription>
                Overview of your active accessibility settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(settings).map(([key, value]) => {
                  if (!value) return null
                  
                  const option = accessibilityOptions.find(opt => opt.id === key)
                  if (!option) return null
                  
                  return (
                    <Badge key={key} variant="secondary" className="flex items-center gap-1">
                      <option.icon className="h-3 w-3" />
                      {option.title}
                    </Badge>
                  )
                })}
                {Object.values(settings).every(value => !value) && (
                  <p className="text-sm text-muted-foreground">No accessibility settings are currently active</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reset button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">
                Reset all accessibility settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={resetSettings}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
          </div>

          {/* Keyboard shortcuts info */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <h4 className="font-medium text-green-900 mb-2">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-green-700">
                <div><kbd className="bg-green-100 px-1 rounded">Tab</kbd> - Navigate forward</div>
                <div><kbd className="bg-green-100 px-1 rounded">Shift+Tab</kbd> - Navigate backward</div>
                <div><kbd className="bg-green-100 px-1 rounded">Enter/Space</kbd> - Activate buttons</div>
                <div><kbd className="bg-green-100 px-1 rounded">Esc</kbd> - Close dialogs</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Floating accessibility button for easy access
export function AccessibilityFloatingButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AccessibilitySettings />
    </div>
  )
}

// Accessibility status indicator
export function AccessibilityStatusIndicator() {
  const { settings } = useAccessibility()
  
  const activeCount = Object.values(settings).filter(Boolean).length
  
  if (activeCount === 0) return null
  
  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Settings className="h-3 w-3" />
      {activeCount} accessibility setting{activeCount !== 1 ? 's' : ''} active
    </Badge>
  )
}