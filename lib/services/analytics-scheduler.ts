/**
 * Analytics Scheduler Service
 * 
 * This module provides scheduling utilities for analytics batch processing.
 * It can be used with Firebase Cloud Functions scheduled triggers.
 */

import { runDailyBatchProcessing, getRealTimeMetrics } from './analytics-aggregation-service';

/**
 * Scheduled function to run daily analytics aggregation
 * This should be called by a Cloud Function with a cron schedule
 * 
 * Example Cloud Function (functions/src/index.ts):
 * ```
 * export const scheduledAnalytics = functions.pubsub
 *   .schedule('0 1 * * *') // Run at 1 AM every day
 *   .timeZone('UTC')
 *   .onRun(async (context) => {
 *     await runScheduledAnalytics();
 *   });
 * ```
 */
export async function runScheduledAnalytics(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  console.log('Starting scheduled analytics aggregation');
  
  try {
    await runDailyBatchProcessing(yesterday);
    console.log('Scheduled analytics aggregation completed successfully');
  } catch (error) {
    console.error('Scheduled analytics aggregation failed:', error);
    throw error;
  }
}

/**
 * Backfill analytics data for a date range
 * Useful for populating historical data or recovering from failures
 */
export async function backfillAnalytics(
  startDate: Date,
  endDate: Date
): Promise<void> {
  console.log(`Backfilling analytics from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  const currentDate = new Date(startDate);
  const errors: Array<{ date: string; error: any }> = [];

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
      console.log(`Processing ${dateStr}...`);
      await runDailyBatchProcessing(new Date(currentDate));
      console.log(`✓ Completed ${dateStr}`);
    } catch (error) {
      console.error(`✗ Failed ${dateStr}:`, error);
      errors.push({ date: dateStr, error });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (errors.length > 0) {
    console.error(`Backfill completed with ${errors.length} errors:`, errors);
    throw new Error(`Backfill failed for ${errors.length} dates`);
  }

  console.log('Backfill completed successfully');
}

/**
 * Refresh current day metrics
 * Can be called periodically throughout the day to update real-time metrics
 */
export async function refreshCurrentDayMetrics(): Promise<void> {
  console.log('Refreshing current day metrics');
  
  try {
    await getRealTimeMetrics();
    console.log('Current day metrics refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh current day metrics:', error);
    throw error;
  }
}

/**
 * Health check for analytics system
 * Verifies that analytics data is being generated correctly
 */
export async function analyticsHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastProcessedDate: string | null;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    // Check if yesterday's data was processed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const metrics = await getRealTimeMetrics();
    
    if (!metrics) {
      issues.push('No metrics data available');
      return { status: 'unhealthy', lastProcessedDate: null, issues };
    }

    // Check data freshness
    const updatedAt = new Date(metrics.updatedAt);
    const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24) {
      issues.push(`Metrics data is stale (${Math.round(hoursSinceUpdate)} hours old)`);
    }

    // Check data completeness
    if (metrics.consultations.total === 0 && metrics.users.active === 0) {
      issues.push('Metrics show no activity - possible data collection issue');
    }

    const status = issues.length === 0 ? 'healthy' : 
                   issues.length <= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      lastProcessedDate: metrics.date,
      issues,
    };
  } catch (error) {
    issues.push(`Health check failed: ${error}`);
    return { status: 'unhealthy', lastProcessedDate: null, issues };
  }
}
