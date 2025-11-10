/**
 * Analytics Utilities Index
 * Central export point for all analytics transformation, validation, and error handling utilities
 */

// Export transformation utilities
export {
  transformDailyMetricsToTimeSeries,
  transformConsultationTypesToPieChart,
  transformUserTypesToPieChart,
  transformGeographicData,
  calculateTrend,
  transformDoctorAnalyticsToTable,
  transformPharmacyAnalyticsToMetrics,
  aggregateMetricsByPeriod,
  type ChartDataPoint,
  type PieChartData,
  type TrendData,
} from './analytics-transformers';

// Export validation utilities
export {
  validateDailyMetrics,
  validateDoctorAnalytics,
  validatePharmacyAnalytics,
  validateDateRange,
  validateAnalyticsFilters,
  sanitizeDailyMetrics,
  sanitizeDoctorAnalytics,
  sanitizePharmacyAnalytics,
  batchValidateMetrics,
  type ValidationResult,
} from './analytics-validators';

// Export error handling utilities
export {
  AnalyticsError,
  AnalyticsErrorType,
  withErrorHandling,
  handleMissingData,
  createEmptyDailyMetrics,
  createEmptyDoctorAnalytics,
  createEmptyPharmacyAnalytics,
  handleCorruptedData,
  retryWithBackoff,
  handleBatchErrors,
  filterInvalidData,
  mergeWithDefaults,
  logError,
  safeAccess,
  repairArrayData,
  withTimeout,
  aggregateErrors,
  type ErrorHandlerResult,
} from './analytics-error-handler';
