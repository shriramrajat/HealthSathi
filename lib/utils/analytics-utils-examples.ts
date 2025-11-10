/**
 * Analytics Utilities Usage Examples
 * Demonstrates how to use the analytics transformation, validation, and error handling utilities
 */

import type { DailyMetrics, DoctorAnalytics } from '@/lib/types/analytics-models';
import {
  // Transformers
  transformDailyMetricsToTimeSeries,
  transformConsultationTypesToPieChart,
  calculateTrend,
  aggregateMetricsByPeriod,
  
  // Validators
  validateDailyMetrics,
  sanitizeDailyMetrics,
  batchValidateMetrics,
  
  // Error handlers
  withErrorHandling,
  handleMissingData,
  createEmptyDailyMetrics,
  retryWithBackoff,
  AnalyticsErrorType,
} from './analytics-utils';

/**
 * Example 1: Transform daily metrics to time-series chart data
 */
export async function exampleTransformToTimeSeries(metrics: DailyMetrics[]) {
  // Transform consultation data for line chart
  const consultationData = transformDailyMetricsToTimeSeries(metrics, 'consultations');
  
  // Use with Recharts LineChart
  // <LineChart data={consultationData}>
  //   <XAxis dataKey="label" />
  //   <YAxis />
  //   <Line dataKey="value" />
  // </LineChart>
  
  return consultationData;
}

/**
 * Example 2: Transform consultation types to pie chart
 */
export async function exampleTransformToPieChart(metrics: DailyMetrics[]) {
  // Transform consultation types for pie chart
  const pieData = transformConsultationTypesToPieChart(metrics);
  
  // Use with Recharts PieChart
  // <PieChart>
  //   <Pie data={pieData} dataKey="value" nameKey="name" />
  // </PieChart>
  
  return pieData;
}

/**
 * Example 3: Calculate trend with error handling
 */
export async function exampleCalculateTrendSafely(
  currentMetrics: DailyMetrics[],
  previousMetrics: DailyMetrics[]
) {
  const result = await withErrorHandling(
    async () => calculateTrend(currentMetrics, previousMetrics, 'consultations'),
    AnalyticsErrorType.TRANSFORMATION_ERROR,
    { operation: 'calculateTrend' },
    // Fallback value if error occurs
    {
      current: 0,
      previous: 0,
      change: 0,
      changePercentage: 0,
      direction: 'neutral' as const,
    }
  );
  
  if (result.success) {
    console.log('Trend calculated:', result.data);
  } else {
    console.error('Failed to calculate trend:', result.error);
  }
  
  return result.data;
}

/**
 * Example 4: Validate and sanitize metrics before processing
 */
export async function exampleValidateAndSanitize(rawMetrics: any) {
  // First, validate the data
  const validation = validateDailyMetrics(rawMetrics);
  
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    console.warn('Validation warnings:', validation.warnings);
    
    // Try to sanitize the data
    const sanitized = sanitizeDailyMetrics(rawMetrics);
    
    if (sanitized) {
      console.log('Data sanitized successfully');
      return sanitized;
    } else {
      // Use empty metrics as fallback
      return createEmptyDailyMetrics(new Date().toISOString().split('T')[0]);
    }
  }
  
  return rawMetrics as DailyMetrics;
}

/**
 * Example 5: Batch validate multiple metrics
 */
export async function exampleBatchValidation(metricsArray: any[]) {
  const { valid, invalid, errors } = batchValidateMetrics(metricsArray, 'daily');
  
  console.log(`Validated ${metricsArray.length} metrics:`);
  console.log(`- Valid: ${valid.length}`);
  console.log(`- Invalid: ${invalid.length}`);
  
  if (invalid.length > 0) {
    console.error('Validation errors by index:', errors);
  }
  
  return valid as DailyMetrics[];
}

/**
 * Example 6: Fetch data with retry and error handling
 */
export async function exampleFetchWithRetry(
  fetchFunction: () => Promise<DailyMetrics[]>
) {
  try {
    // Retry up to 3 times with exponential backoff
    const metrics = await retryWithBackoff(
      fetchFunction,
      3,
      1000,
      'daily metrics fetch'
    );
    
    return metrics;
  } catch (error) {
    console.error('Failed to fetch metrics after retries:', error);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Example 7: Handle missing data with defaults
 */
export async function exampleHandleMissingData(
  metrics: DailyMetrics | null | undefined
) {
  const safeMetrics = handleMissingData(
    metrics,
    createEmptyDailyMetrics(new Date().toISOString().split('T')[0]),
    'daily metrics'
  );
  
  return safeMetrics;
}

/**
 * Example 8: Aggregate metrics by different time periods
 */
export async function exampleAggregateByPeriod(dailyMetrics: DailyMetrics[]) {
  // Aggregate by week
  const weeklyMetrics = aggregateMetricsByPeriod(dailyMetrics, 'weekly');
  
  // Aggregate by month
  const monthlyMetrics = aggregateMetricsByPeriod(dailyMetrics, 'monthly');
  
  return {
    daily: dailyMetrics,
    weekly: weeklyMetrics,
    monthly: monthlyMetrics,
  };
}

/**
 * Example 9: Complete data processing pipeline
 */
export async function exampleCompleteDataPipeline(
  fetchMetrics: () => Promise<any[]>
) {
  // Step 1: Fetch data with retry
  const result = await withErrorHandling(
    async () => retryWithBackoff(fetchMetrics, 3, 1000, 'metrics fetch'),
    AnalyticsErrorType.DATA_FETCH_ERROR,
    { operation: 'fetchMetrics' },
    []
  );
  
  if (!result.success || !result.data) {
    console.error('Failed to fetch metrics');
    return null;
  }
  
  // Step 2: Validate and sanitize
  const { valid, invalid } = batchValidateMetrics(result.data, 'daily');
  
  if (invalid.length > 0) {
    console.warn(`Filtered out ${invalid.length} invalid metrics`);
  }
  
  // Step 3: Transform for charts
  const timeSeriesData = transformDailyMetricsToTimeSeries(valid, 'consultations');
  const pieChartData = transformConsultationTypesToPieChart(valid);
  
  // Step 4: Calculate trends
  const currentWeek = valid.slice(-7);
  const previousWeek = valid.slice(-14, -7);
  const trend = calculateTrend(currentWeek, previousWeek, 'consultations');
  
  return {
    timeSeries: timeSeriesData,
    pieChart: pieChartData,
    trend,
    validMetricsCount: valid.length,
    invalidMetricsCount: invalid.length,
  };
}

/**
 * Example 10: Error handling in React component
 */
export async function exampleReactComponentUsage(
  metricsData: DailyMetrics[] | null
) {
  // Handle null/undefined data
  const metrics = handleMissingData(metricsData, [], 'metrics data');
  
  if (metrics.length === 0) {
    return {
      isEmpty: true,
      chartData: [],
      error: 'No data available',
    };
  }
  
  // Validate data
  const { valid } = batchValidateMetrics(metrics, 'daily');
  
  if (valid.length === 0) {
    return {
      isEmpty: true,
      chartData: [],
      error: 'All metrics data is invalid',
    };
  }
  
  // Transform for display
  const chartData = transformDailyMetricsToTimeSeries(valid, 'consultations');
  
  return {
    isEmpty: false,
    chartData,
    error: null,
  };
}
