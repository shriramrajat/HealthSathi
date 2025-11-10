# Performance Monitoring Guide

This guide explains how to use the performance monitoring utilities in the NeuraNovaa application.

## Overview

The performance monitoring system provides:

- **Core Web Vitals tracking** (FCP, LCP, FID, CLS, TTFB, TTI)
- **Custom performance metrics**
- **Performance reporting and analysis**
- **Real-time monitoring components**

## Core Components

### 1. Performance Monitor (`lib/performance.ts`)

The main performance monitoring utility that tracks Core Web Vitals and custom metrics.

```typescript
import { performanceMonitor, measureExecutionTime } from '@/lib/performance'

// Add custom metric
performanceMonitor.addCustomMetric('api_call_duration', 150)

// Get performance summary
const summary = performanceMonitor.getSummary()
console.log('Performance Score:', summary.overallScore)
```

### 2. Performance Report Script (`scripts/performance-report.js`)

A Node.js script for analyzing build performance and bundle size.

```bash
# Run full performance analysis
npm run performance:report

# Check only build performance
npm run performance:build

# Check only bundle size
npm run performance:bundle

# Check configuration only
node scripts/performance-report.js --config-only
```

### 3. Performance Monitor Component (`components/performance/performance-monitor.tsx`)

A React component for real-time performance monitoring (development only).

```typescript
import { PerformanceMonitor } from '@/components/performance/performance-monitor'

// Add to your layout or page
<PerformanceMonitor />
```

## Usage Examples

### Measuring Function Performance

```typescript
import { measureExecutionTime, performanceTiming } from '@/lib/performance'

// Method 1: Wrapper function
const optimizedFunction = measureExecutionTime('myFunction', myFunction)

// Method 2: Decorator
class MyService {
  @performanceTiming('MyService')
  async processData(data: any[]) {
    // Your code here
  }
}
```

### Performance Milestones

```typescript
import { markPerformanceMilestone, measurePerformanceBetweenMarks } from '@/lib/performance'

// Mark important points
markPerformanceMilestone('data_fetch_start')
await fetchData()
markPerformanceMilestone('data_fetch_end')

// Measure duration between marks
measurePerformanceBetweenMarks('data_fetch_duration', 'data_fetch_start', 'data_fetch_end')
```

### React Hook Usage

```typescript
import { usePerformanceMonitoring } from '@/lib/performance'

function MyComponent() {
  const { metrics, summary, clearMetrics, exportData } = usePerformanceMonitoring()

  return (
    <div>
      <p>Performance Score: {summary.overallScore}/100</p>
      <p>Total Metrics: {metrics.length}</p>
      <button onClick={clearMetrics}>Clear Metrics</button>
      <button onClick={() => console.log(exportData())}>Export Data</button>
    </div>
  )
}
```

## Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **TTFB** (Time to First Byte) | ≤ 800ms | 800ms - 1.8s | > 1.8s |
| **TTI** (Time to Interactive) | ≤ 3.8s | 3.8s - 7.3s | > 7.3s |

## Performance Report Features

The performance report script analyzes:

### Build Performance
- Build time measurement
- Build output analysis
- Route-level metrics

### Bundle Analysis
- Total bundle size
- Largest chunks identification
- Size optimization recommendations

### Dependency Analysis
- Heavy dependency detection
- Duplicate functionality identification
- Optimization suggestions

### Configuration Check
- Next.js optimization settings
- Performance monitoring setup
- Bundle analyzer availability

## Integration with Development Workflow

### 1. Add to Layout (Development Only)

```typescript
// app/layout.tsx
import { PerformanceMonitor } from '@/components/performance/performance-monitor'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <PerformanceMonitor />
      </body>
    </html>
  )
}
```

### 2. Pre-deployment Performance Check

```bash
# Add to your CI/CD pipeline
npm run performance:report
```

### 3. Continuous Monitoring

```typescript
// Monitor API calls
import { withPerformanceTracking } from '@/lib/firebase-performance'

const trackedApiCall = withPerformanceTracking('api_user_fetch', fetchUserData)
```

## Best Practices

### 1. Development Monitoring
- Use `PerformanceMonitor` component during development
- Monitor Core Web Vitals in real-time
- Export performance data for analysis

### 2. Production Optimization
- Run performance reports before deployment
- Monitor bundle size growth
- Track build time increases

### 3. Custom Metrics
- Measure critical user journeys
- Track API response times
- Monitor component render times

### 4. Performance Budgets
- Set bundle size limits (< 500KB initial load)
- Maintain build time under 30 seconds
- Keep Core Web Vitals in "good" range

## Troubleshooting

### Common Issues

1. **No metrics appearing**
   - Ensure you're in a browser environment
   - Check browser support for Performance Observer API
   - Verify component is mounted

2. **Build analysis fails**
   - Run `npm run build` first
   - Check `.next` directory exists
   - Verify file permissions

3. **Performance score low**
   - Review bundle size recommendations
   - Optimize images and assets
   - Implement code splitting

### Debug Mode

Enable detailed logging in development:

```typescript
// Set in environment or code
process.env.NODE_ENV = 'development'

// Performance events will be logged to console
```

## API Reference

### PerformanceMonitor Class

```typescript
class PerformanceMonitor {
  addCustomMetric(name: string, value: number): void
  getReport(): PerformanceReport
  getSummary(): PerformanceSummary
  addListener(callback: (metric: WebVitalMetric) => void): () => void
  clear(): void
  disconnect(): void
}
```

### Utility Functions

```typescript
// Measure execution time
measureExecutionTime<T>(name: string, fn: T): T

// Performance timing decorator
performanceTiming(name: string): MethodDecorator

// Mark milestones
markPerformanceMilestone(name: string): void

// Measure between marks
measurePerformanceBetweenMarks(name: string, start: string, end: string): void

// Export data
exportPerformanceData(): string

// Navigation timing
getNavigationTiming(): NavigationTiming | null
```

### React Hook

```typescript
usePerformanceMonitoring(): {
  metrics: WebVitalMetric[]
  summary: PerformanceSummary
  report: PerformanceReport | null
  clearMetrics: () => void
  exportData: () => string
}
```

## Performance Monitoring in Production

For production environments, consider:

1. **Sampling**: Only monitor a percentage of users
2. **Privacy**: Ensure no PII is collected in metrics
3. **Storage**: Implement proper data retention policies
4. **Alerting**: Set up alerts for performance degradation

Example production configuration:

```typescript
// Only monitor 10% of users in production
if (Math.random() < 0.1 || process.env.NODE_ENV === 'development') {
  performanceMonitor.addListener(sendToAnalytics)
}
```