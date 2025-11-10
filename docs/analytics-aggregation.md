# Analytics Aggregation Service

## Overview

The Analytics Aggregation Service provides comprehensive data aggregation and processing for the NeuraNovaa admin analytics dashboard. It collects data from various Firestore collections (consultations, prescriptions, users, etc.) and aggregates them into optimized collections for efficient querying and visualization.

## Architecture

### Collections

The service manages three main aggregation collections:

1. **daily-metrics**: Platform-wide daily statistics
2. **doctor-analytics**: Individual doctor performance metrics
3. **pharmacy-analytics**: Individual pharmacy performance metrics

### Processing Modes

1. **Batch Processing**: Daily aggregation of historical data
2. **Real-time Processing**: On-demand calculation of current day metrics
3. **Backfill Processing**: Historical data population for date ranges

## Usage

### Daily Batch Processing

Run the daily batch processing manually:

```bash
# Process today's data
npm run analytics:batch

# Process specific date
npm run analytics:batch 2024-01-15
```

### Programmatic Usage

```typescript
import {
  runDailyBatchProcessing,
  getRealTimeMetrics,
  aggregateDailyMetrics,
  aggregateDoctorAnalytics,
  aggregatePharmacyAnalytics,
} from '@/lib/services/analytics-aggregation-service';

// Run batch processing for a specific date
await runDailyBatchProcessing(new Date('2024-01-15'));

// Get real-time metrics for today
const metrics = await getRealTimeMetrics();

// Aggregate specific metrics
const dailyMetrics = await aggregateDailyMetrics(new Date());
const doctorMetrics = await aggregateDoctorAnalytics('doctor-id', new Date());
const pharmacyMetrics = await aggregatePharmacyAnalytics('pharmacy-id', new Date());
```

### Scheduled Processing

For production environments, set up a Cloud Function with a scheduled trigger:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { runScheduledAnalytics } from './analytics-scheduler';

export const scheduledAnalytics = functions.pubsub
  .schedule('0 1 * * *') // Run at 1 AM UTC every day
  .timeZone('UTC')
  .onRun(async (context) => {
    await runScheduledAnalytics();
  });
```

### Backfilling Historical Data

```typescript
import { backfillAnalytics } from '@/lib/services/analytics-scheduler';

// Backfill data for a date range
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
await backfillAnalytics(startDate, endDate);
```

## Data Models

### DailyMetrics

```typescript
interface DailyMetrics {
  date: string; // YYYY-MM-DD
  consultations: {
    total: number;
    completed: number;
    cancelled: number;
    byType: Record<string, number>;
  };
  prescriptions: {
    issued: number;
    dispensed: number;
    pending: number;
  };
  users: {
    active: number;
    new: number;
    byType: Record<string, number>;
  };
  geography: {
    byState: Record<string, number>;
    byDistrict: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### DoctorAnalytics

```typescript
interface DoctorAnalytics {
  doctorId: string;
  period: string; // YYYY-MM-DD
  consultations: {
    total: number;
    completed: number;
    averageDuration: number;
    responseTime: number;
  };
  ratings: {
    average: number;
    count: number;
    distribution: Record<string, number>;
  };
  availability: {
    hoursActive: number;
    slotsOffered: number;
    utilizationRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### PharmacyAnalytics

```typescript
interface PharmacyAnalytics {
  pharmacyId: string;
  period: string; // YYYY-MM-DD
  prescriptions: {
    dispensed: number;
    pending: number;
    averageTurnaroundTime: number;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    expiringItems: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Performance Considerations

### Caching

Real-time metrics are cached for 5 minutes to reduce Firestore reads:

```typescript
// Cached metrics are returned if updated within last 5 minutes
const metrics = await getRealTimeMetrics();
```

### Batch Processing

- Processes all doctors and pharmacies in parallel
- Includes error handling to prevent single failures from blocking entire batch
- Logs progress and errors for monitoring

### Query Optimization

- Uses Firestore composite indexes for efficient querying
- Aggregates data at write time to optimize read performance
- Stores pre-computed metrics to avoid expensive queries at read time

## Monitoring

### Health Check

```typescript
import { analyticsHealthCheck } from '@/lib/services/analytics-scheduler';

const health = await analyticsHealthCheck();
console.log(health);
// {
//   status: 'healthy' | 'degraded' | 'unhealthy',
//   lastProcessedDate: '2024-01-15',
//   issues: []
// }
```

### Logging

The service logs important events:

- Batch processing start/completion
- Individual aggregation successes/failures
- Data freshness warnings
- Error details for debugging

## Error Handling

The service includes comprehensive error handling:

1. **Individual Failures**: Doctor/pharmacy aggregation failures don't block the entire batch
2. **Missing Data**: Gracefully handles missing or incomplete data
3. **Query Timeouts**: Implements appropriate timeouts and retries
4. **Data Validation**: Validates data before storage

## Security

### Firestore Rules

Ensure proper security rules are configured:

```javascript
// firestore.rules
match /daily-metrics/{date} {
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if false; // Only server-side writes
}

match /doctor-analytics/{docId} {
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if false; // Only server-side writes
}

match /pharmacy-analytics/{docId} {
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if false; // Only server-side writes
}
```

## Troubleshooting

### Batch Processing Fails

1. Check Firestore indexes are deployed
2. Verify source collections have data
3. Check Cloud Function logs for errors
4. Ensure sufficient permissions

### Stale Data

1. Verify scheduled function is running
2. Check last processed date in health check
3. Manually trigger batch processing
4. Review error logs

### Performance Issues

1. Monitor Firestore read/write operations
2. Check for missing indexes
3. Review query patterns
4. Consider increasing cache duration

## Future Enhancements

- [ ] Incremental aggregation (only process new data)
- [ ] Real-time streaming aggregation
- [ ] Advanced caching strategies (Redis)
- [ ] Aggregation for additional metrics
- [ ] Data retention policies
- [ ] Automated alerting on failures
