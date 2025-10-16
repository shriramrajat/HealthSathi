# Notification UI Components

This document describes the notification UI components implemented for the healthcare platform. These components provide a complete notification system with toast displays, notification history, and user preferences.

## Components Overview

### 1. NotificationDisplay
Real-time toast notifications that appear automatically for new messages.

**Features:**
- Auto-display for unread notifications
- Configurable auto-hide duration (default: 5 seconds)
- Click-to-view functionality
- Different variants based on notification urgency
- Automatic navigation to relevant pages

**Usage:**
```tsx
import { NotificationDisplay } from '@/components/notifications'

// Basic usage
<NotificationDisplay />

// With custom settings
<NotificationDisplay 
  maxToasts={5} 
  autoHideDuration={8000} 
/>
```

### 2. NotificationDrawer
A slide-up drawer containing notification history and preferences.

**Features:**
- Complete notification history
- Mark as read/unread functionality
- Mark all as read option
- Notification preferences access
- Responsive mobile design
- Empty state handling

**Usage:**
```tsx
import { NotificationDrawer } from '@/components/notifications'

<NotificationDrawer>
  <Button>Open Notifications</Button>
</NotificationDrawer>
```

### 3. NotificationBell
A bell icon button with unread count badge that triggers the notification drawer.

**Features:**
- Unread count badge
- Multiple size variants
- Accessible design
- Loading states
- Screen reader support

**Usage:**
```tsx
import { NotificationBell } from '@/components/notifications'

// Basic usage
<NotificationBell />

// With custom styling
<NotificationBell 
  variant="outline"
  size="lg"
  showBadge={true}
  className="custom-class"
/>
```

### 4. NotificationPreferences
User interface for managing notification settings.

**Features:**
- Notification type toggles (appointments, prescriptions, etc.)
- Delivery method settings (push, email)
- Real-time preference updates
- Loading states and error handling
- Toast feedback for changes

**Usage:**
```tsx
import { NotificationPreferences } from '@/components/notifications'

<NotificationPreferences />
```

## Integration Guide

### 1. Basic Setup

Wrap your application with the notification provider:

```tsx
import { NotificationProvider } from '@/components/providers/notification-provider'
import { NotificationDisplay } from '@/components/notifications'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <NotificationProvider>
      <YourAppContent />
      <NotificationDisplay />
      <Toaster />
    </NotificationProvider>
  )
}
```

### 2. Adding Notification Bell to Navigation

```tsx
import { NotificationBell } from '@/components/notifications'

function Navigation() {
  return (
    <nav className="flex items-center space-x-4">
      <NavItems />
      <NotificationBell />
    </nav>
  )
}
```

### 3. Dashboard Integration

```tsx
import { NotificationBell, NotificationDisplay } from '@/components/notifications'
import { AppLayout } from '@/components/layout/app-layout'

function Dashboard() {
  return (
    <AppLayout>
      <div className="dashboard">
        <header className="flex justify-between items-center">
          <h1>Dashboard</h1>
          <NotificationBell />
        </header>
        <main>
          {/* Dashboard content */}
        </main>
      </div>
    </AppLayout>
  )
}
```

## Notification Types

The system supports the following notification types:

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `appointment_booked` | Calendar | Blue | New appointment scheduled |
| `appointment_confirmed` | CheckCircle | Green | Appointment confirmed |
| `appointment_cancelled` | X | Red | Appointment cancelled |
| `appointment_reminder` | Bell | Yellow | Upcoming appointment |
| `consultation_started` | MessageSquare | Blue | Video consultation started |
| `consultation_ended` | MessageSquare | Gray | Consultation completed |
| `prescription_issued` | Pill | Purple | New prescription available |
| `prescription_ready` | Pill | Green | Prescription ready for pickup |
| `prescription_dispensed` | CheckCircle | Green | Prescription dispensed |
| `emergency_alert` | AlertTriangle | Red | Emergency situation |
| `symptom_check_urgent` | AlertTriangle | Orange | Urgent symptom check result |
| `qr_code_scanned` | Info | Blue | QR code accessed |
| `system_maintenance` | Info | Yellow | System maintenance notice |
| `general` | Bell | Gray | General notification |

## Customization

### Toast Variants

The notification display supports different toast variants:

- `default` - Standard notification
- `destructive` - Error or urgent notifications
- `success` - Success notifications
- `warning` - Warning notifications
- `info` - Informational notifications

### Styling

All components use Tailwind CSS and can be customized through:

1. **CSS Classes**: Pass custom className props
2. **CSS Variables**: Modify design tokens
3. **Component Props**: Use built-in variant props

### Navigation Handling

Notifications automatically navigate to relevant pages based on type:

```tsx
// Custom navigation handler
const handleNotificationAction = (notification: StoredNotification) => {
  switch (notification.type) {
    case 'appointment_booked':
      router.push('/dashboard/patient?tab=appointments')
      break
    case 'prescription_ready':
      router.push('/dashboard/patient?tab=prescriptions')
      break
    // ... other cases
  }
}
```

## Accessibility

All components follow accessibility best practices:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus flow
- **Color Contrast**: WCAG 2.1 AA compliant colors
- **Reduced Motion**: Respects user motion preferences

## Performance

The notification system is optimized for performance:

- **Lazy Loading**: Components load only when needed
- **Efficient Updates**: Minimal re-renders with React optimization
- **Memory Management**: Proper cleanup of listeners and timers
- **Batch Operations**: Efficient handling of multiple notifications

## Testing

Test the notification components using the demo page:

```
/notifications-ui-demo
```

This page provides:
- Interactive component testing
- Sample notification generation
- Feature demonstration
- Performance testing

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check if NotificationProvider is properly wrapped
2. **Toast not showing**: Ensure Toaster component is included
3. **Permission denied**: Check browser notification permissions
4. **Styling issues**: Verify Tailwind CSS is properly configured

### Debug Mode

Enable debug logging:

```tsx
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Notification system debug mode enabled')
}
```

## Requirements Fulfilled

This implementation fulfills requirement 7.4:

✅ **Create notification display using existing Radix Toast components**
- Implemented NotificationDisplay with Radix Toast
- Multiple toast variants for different notification types
- Auto-hide and click-to-view functionality

✅ **Implement notification drawer for message history**
- NotificationDrawer with complete message history
- Mark as read/unread functionality
- Responsive mobile design

✅ **Add notification preferences and settings interface**
- NotificationPreferences component
- Notification type toggles
- Delivery method settings
- Real-time preference updates

The notification UI system is now complete and ready for use across the healthcare platform.