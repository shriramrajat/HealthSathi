/**
 * Analytics Data Validation and Sanitization Utilities
 * Validates and sanitizes analytics data to ensure data integrity
 */

import type {
  DailyMetrics,
  DoctorAnalytics,
  PharmacyAnalytics,
  DateRange,
  AnalyticsFilters,
} from '@/lib/types/analytics-models';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates DailyMetrics object
 */
export function validateDailyMetrics(metrics: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if metrics exists
  if (!metrics) {
    errors.push('Metrics object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Validate date field
  if (!metrics.date || typeof metrics.date !== 'string') {
    errors.push('Invalid or missing date field');
  } else if (!isValidDateString(metrics.date)) {
    errors.push(`Invalid date format: ${metrics.date}. Expected YYYY-MM-DD`);
  }

  // Validate consultations
  if (!metrics.consultations) {
    errors.push('Missing consultations field');
  } else {
    const consultationErrors = validateConsultationsData(metrics.consultations);
    errors.push(...consultationErrors);
  }

  // Validate prescriptions
  if (!metrics.prescriptions) {
    errors.push('Missing prescriptions field');
  } else {
    const prescriptionErrors = validatePrescriptionsData(metrics.prescriptions);
    errors.push(...prescriptionErrors);
  }

  // Validate users
  if (!metrics.users) {
    errors.push('Missing users field');
  } else {
    const userErrors = validateUsersData(metrics.users);
    errors.push(...userErrors);
  }

  // Validate geography (optional but should be valid if present)
  if (metrics.geography) {
    const geoErrors = validateGeographyData(metrics.geography);
    if (geoErrors.length > 0) {
      warnings.push(...geoErrors);
    }
  }

  // Validate timestamps
  if (!metrics.createdAt) {
    warnings.push('Missing createdAt timestamp');
  }
  if (!metrics.updatedAt) {
    warnings.push('Missing updatedAt timestamp');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates DoctorAnalytics object
 */
export function validateDoctorAnalytics(analytics: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!analytics) {
    errors.push('Analytics object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Validate doctorId
  if (!analytics.doctorId || typeof analytics.doctorId !== 'string') {
    errors.push('Invalid or missing doctorId');
  }

  // Validate period
  if (!analytics.period || typeof analytics.period !== 'string') {
    errors.push('Invalid or missing period field');
  } else if (!isValidDateString(analytics.period)) {
    errors.push(`Invalid period format: ${analytics.period}. Expected YYYY-MM-DD`);
  }

  // Validate consultations
  if (!analytics.consultations) {
    errors.push('Missing consultations field');
  } else {
    if (typeof analytics.consultations.total !== 'number' || analytics.consultations.total < 0) {
      errors.push('Invalid consultations.total value');
    }
    if (typeof analytics.consultations.completed !== 'number' || analytics.consultations.completed < 0) {
      errors.push('Invalid consultations.completed value');
    }
    if (analytics.consultations.completed > analytics.consultations.total) {
      errors.push('Completed consultations cannot exceed total consultations');
    }
  }

  // Validate ratings
  if (!analytics.ratings) {
    warnings.push('Missing ratings field');
  } else {
    if (typeof analytics.ratings.average !== 'number' || analytics.ratings.average < 0 || analytics.ratings.average > 5) {
      warnings.push('Invalid ratings.average value (should be 0-5)');
    }
    if (typeof analytics.ratings.count !== 'number' || analytics.ratings.count < 0) {
      warnings.push('Invalid ratings.count value');
    }
  }

  // Validate availability
  if (!analytics.availability) {
    warnings.push('Missing availability field');
  } else {
    if (typeof analytics.availability.utilizationRate !== 'number' || 
        analytics.availability.utilizationRate < 0 || 
        analytics.availability.utilizationRate > 100) {
      warnings.push('Invalid utilizationRate (should be 0-100)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates PharmacyAnalytics object
 */
export function validatePharmacyAnalytics(analytics: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!analytics) {
    errors.push('Analytics object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Validate pharmacyId
  if (!analytics.pharmacyId || typeof analytics.pharmacyId !== 'string') {
    errors.push('Invalid or missing pharmacyId');
  }

  // Validate period
  if (!analytics.period || typeof analytics.period !== 'string') {
    errors.push('Invalid or missing period field');
  } else if (!isValidDateString(analytics.period)) {
    errors.push(`Invalid period format: ${analytics.period}. Expected YYYY-MM-DD`);
  }

  // Validate prescriptions
  if (!analytics.prescriptions) {
    errors.push('Missing prescriptions field');
  } else {
    if (typeof analytics.prescriptions.dispensed !== 'number' || analytics.prescriptions.dispensed < 0) {
      errors.push('Invalid prescriptions.dispensed value');
    }
    if (typeof analytics.prescriptions.pending !== 'number' || analytics.prescriptions.pending < 0) {
      errors.push('Invalid prescriptions.pending value');
    }
  }

  // Validate inventory
  if (!analytics.inventory) {
    warnings.push('Missing inventory field');
  } else {
    if (typeof analytics.inventory.totalItems !== 'number' || analytics.inventory.totalItems < 0) {
      warnings.push('Invalid inventory.totalItems value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates DateRange object
 */
export function validateDateRange(dateRange: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateRange) {
    errors.push('DateRange is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (!(dateRange.start instanceof Date) || isNaN(dateRange.start.getTime())) {
    errors.push('Invalid start date');
  }

  if (!(dateRange.end instanceof Date) || isNaN(dateRange.end.getTime())) {
    errors.push('Invalid end date');
  }

  if (dateRange.start && dateRange.end && dateRange.start > dateRange.end) {
    errors.push('Start date cannot be after end date');
  }

  if (dateRange.preset && !['today', 'week', 'month', 'quarter', 'year', 'custom'].includes(dateRange.preset)) {
    warnings.push(`Unknown preset value: ${dateRange.preset}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates AnalyticsFilters object
 */
export function validateAnalyticsFilters(filters: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!filters) {
    errors.push('Filters object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Validate dateRange
  if (!filters.dateRange) {
    errors.push('Missing dateRange in filters');
  } else {
    const dateRangeValidation = validateDateRange(filters.dateRange);
    errors.push(...dateRangeValidation.errors);
    warnings.push(...dateRangeValidation.warnings);
  }

  // Validate userType if present
  if (filters.userType && !['patient', 'doctor', 'pharmacy', 'chw'].includes(filters.userType)) {
    warnings.push(`Unknown userType: ${filters.userType}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitizes DailyMetrics object, fixing common issues
 */
export function sanitizeDailyMetrics(metrics: any): DailyMetrics | null {
  try {
    if (!metrics) return null;

    const sanitized: DailyMetrics = {
      date: sanitizeString(metrics.date, ''),
      consultations: {
        total: sanitizePositiveNumber(metrics.consultations?.total),
        completed: sanitizePositiveNumber(metrics.consultations?.completed),
        cancelled: sanitizePositiveNumber(metrics.consultations?.cancelled),
        byType: sanitizeRecord(metrics.consultations?.byType),
      },
      prescriptions: {
        issued: sanitizePositiveNumber(metrics.prescriptions?.issued),
        dispensed: sanitizePositiveNumber(metrics.prescriptions?.dispensed),
        pending: sanitizePositiveNumber(metrics.prescriptions?.pending),
      },
      users: {
        active: sanitizePositiveNumber(metrics.users?.active),
        new: sanitizePositiveNumber(metrics.users?.new),
        byType: sanitizeRecord(metrics.users?.byType),
      },
      geography: {
        byState: sanitizeRecord(metrics.geography?.byState),
        byDistrict: sanitizeRecord(metrics.geography?.byDistrict),
      },
      createdAt: sanitizeDate(metrics.createdAt),
      updatedAt: sanitizeDate(metrics.updatedAt),
    };

    // Validate sanitized data
    const validation = validateDailyMetrics(sanitized);
    if (!validation.isValid) {
      console.error('Sanitized metrics still invalid:', validation.errors);
      return null;
    }

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing daily metrics:', error);
    return null;
  }
}

/**
 * Sanitizes DoctorAnalytics object
 */
export function sanitizeDoctorAnalytics(analytics: any): DoctorAnalytics | null {
  try {
    if (!analytics) return null;

    const sanitized: DoctorAnalytics = {
      doctorId: sanitizeString(analytics.doctorId, ''),
      period: sanitizeString(analytics.period, ''),
      consultations: {
        total: sanitizePositiveNumber(analytics.consultations?.total),
        completed: sanitizePositiveNumber(analytics.consultations?.completed),
        averageDuration: sanitizePositiveNumber(analytics.consultations?.averageDuration),
        responseTime: sanitizePositiveNumber(analytics.consultations?.responseTime),
      },
      ratings: {
        average: sanitizeNumberInRange(analytics.ratings?.average, 0, 5),
        count: sanitizePositiveNumber(analytics.ratings?.count),
        distribution: sanitizeRecord(analytics.ratings?.distribution),
      },
      availability: {
        hoursActive: sanitizePositiveNumber(analytics.availability?.hoursActive),
        slotsOffered: sanitizePositiveNumber(analytics.availability?.slotsOffered),
        utilizationRate: sanitizeNumberInRange(analytics.availability?.utilizationRate, 0, 100),
      },
      createdAt: sanitizeDate(analytics.createdAt),
      updatedAt: sanitizeDate(analytics.updatedAt),
    };

    const validation = validateDoctorAnalytics(sanitized);
    if (!validation.isValid) {
      console.error('Sanitized doctor analytics still invalid:', validation.errors);
      return null;
    }

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing doctor analytics:', error);
    return null;
  }
}

/**
 * Sanitizes PharmacyAnalytics object
 */
export function sanitizePharmacyAnalytics(analytics: any): PharmacyAnalytics | null {
  try {
    if (!analytics) return null;

    const sanitized: PharmacyAnalytics = {
      pharmacyId: sanitizeString(analytics.pharmacyId, ''),
      period: sanitizeString(analytics.period, ''),
      prescriptions: {
        dispensed: sanitizePositiveNumber(analytics.prescriptions?.dispensed),
        pending: sanitizePositiveNumber(analytics.prescriptions?.pending),
        averageTurnaroundTime: sanitizePositiveNumber(analytics.prescriptions?.averageTurnaroundTime),
      },
      inventory: {
        totalItems: sanitizePositiveNumber(analytics.inventory?.totalItems),
        lowStockItems: sanitizePositiveNumber(analytics.inventory?.lowStockItems),
        expiringItems: sanitizePositiveNumber(analytics.inventory?.expiringItems),
      },
      createdAt: sanitizeDate(analytics.createdAt),
      updatedAt: sanitizeDate(analytics.updatedAt),
    };

    const validation = validatePharmacyAnalytics(sanitized);
    if (!validation.isValid) {
      console.error('Sanitized pharmacy analytics still invalid:', validation.errors);
      return null;
    }

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing pharmacy analytics:', error);
    return null;
  }
}

/**
 * Batch validates an array of metrics
 */
export function batchValidateMetrics(
  metrics: any[],
  type: 'daily' | 'doctor' | 'pharmacy'
): { valid: any[]; invalid: any[]; errors: Record<number, string[]> } {
  const valid: any[] = [];
  const invalid: any[] = [];
  const errors: Record<number, string[]> = {};

  if (!Array.isArray(metrics)) {
    return { valid: [], invalid: [metrics], errors: { 0: ['Input is not an array'] } };
  }

  metrics.forEach((metric, index) => {
    let validation: ValidationResult;

    switch (type) {
      case 'daily':
        validation = validateDailyMetrics(metric);
        break;
      case 'doctor':
        validation = validateDoctorAnalytics(metric);
        break;
      case 'pharmacy':
        validation = validatePharmacyAnalytics(metric);
        break;
      default:
        validation = { isValid: false, errors: ['Unknown validation type'], warnings: [] };
    }

    if (validation.isValid) {
      valid.push(metric);
    } else {
      invalid.push(metric);
      errors[index] = validation.errors;
    }
  });

  return { valid, invalid, errors };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates consultations data structure
 */
function validateConsultationsData(consultations: any): string[] {
  const errors: string[] = [];

  if (typeof consultations.total !== 'number' || consultations.total < 0) {
    errors.push('Invalid consultations.total value');
  }
  if (typeof consultations.completed !== 'number' || consultations.completed < 0) {
    errors.push('Invalid consultations.completed value');
  }
  if (typeof consultations.cancelled !== 'number' || consultations.cancelled < 0) {
    errors.push('Invalid consultations.cancelled value');
  }

  if (consultations.completed + consultations.cancelled > consultations.total) {
    errors.push('Sum of completed and cancelled consultations exceeds total');
  }

  if (!consultations.byType || typeof consultations.byType !== 'object') {
    errors.push('Invalid or missing consultations.byType');
  }

  return errors;
}

/**
 * Validates prescriptions data structure
 */
function validatePrescriptionsData(prescriptions: any): string[] {
  const errors: string[] = [];

  if (typeof prescriptions.issued !== 'number' || prescriptions.issued < 0) {
    errors.push('Invalid prescriptions.issued value');
  }
  if (typeof prescriptions.dispensed !== 'number' || prescriptions.dispensed < 0) {
    errors.push('Invalid prescriptions.dispensed value');
  }
  if (typeof prescriptions.pending !== 'number' || prescriptions.pending < 0) {
    errors.push('Invalid prescriptions.pending value');
  }

  if (prescriptions.dispensed + prescriptions.pending > prescriptions.issued) {
    errors.push('Sum of dispensed and pending prescriptions exceeds issued');
  }

  return errors;
}

/**
 * Validates users data structure
 */
function validateUsersData(users: any): string[] {
  const errors: string[] = [];

  if (typeof users.active !== 'number' || users.active < 0) {
    errors.push('Invalid users.active value');
  }
  if (typeof users.new !== 'number' || users.new < 0) {
    errors.push('Invalid users.new value');
  }

  if (!users.byType || typeof users.byType !== 'object') {
    errors.push('Invalid or missing users.byType');
  }

  return errors;
}

/**
 * Validates geography data structure
 */
function validateGeographyData(geography: any): string[] {
  const errors: string[] = [];

  if (!geography.byState || typeof geography.byState !== 'object') {
    errors.push('Invalid or missing geography.byState');
  }
  if (!geography.byDistrict || typeof geography.byDistrict !== 'object') {
    errors.push('Invalid or missing geography.byDistrict');
  }

  return errors;
}

/**
 * Checks if string is valid YYYY-MM-DD date format
 */
function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Sanitizes a string value
 */
function sanitizeString(value: any, defaultValue: string): string {
  if (typeof value === 'string') return value;
  return defaultValue;
}

/**
 * Sanitizes a positive number
 */
function sanitizePositiveNumber(value: any): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num) || num < 0) return 0;
  return num;
}

/**
 * Sanitizes a number within a range
 */
function sanitizeNumberInRange(value: any, min: number, max: number): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitizes a record object
 */
function sanitizeRecord(record: any): Record<string, number> {
  if (!record || typeof record !== 'object') return {};

  const sanitized: Record<string, number> = {};
  Object.entries(record).forEach(([key, value]) => {
    sanitized[key] = sanitizePositiveNumber(value);
  });

  return sanitized;
}

/**
 * Sanitizes a date value
 */
function sanitizeDate(value: any): Date {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (value?.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return new Date();
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}
