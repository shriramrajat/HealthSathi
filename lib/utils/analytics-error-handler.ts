/**
 * Analytics Error Handling Utilities
 * Handles errors and provides fallbacks for missing or corrupted data
 */

import type {
  DailyMetrics,
  DoctorAnalytics,
  PharmacyAnalytics,
} from '@/lib/types/analytics-models';

/**
 * Error types for analytics processing
 */
export enum AnalyticsErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  TRANSFORMATION_ERROR = 'TRANSFORMATION_ERROR',
  AGGREGATION_ERROR = 'AGGREGATION_ERROR',
  MISSING_DATA = 'MISSING_DATA',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

/**
 * Analytics error class
 */
export class AnalyticsError extends Error {
  type: AnalyticsErrorType;
  originalError?: Error;
  context?: Record<string, any>;

  constructor(
    message: string,
    type: AnalyticsErrorType,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnalyticsError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
  }
}

/**
 * Error handler result
 */
export interface ErrorHandlerResult<T> {
  success: boolean;
  data?: T;
  error?: AnalyticsError;
  fallbackUsed: boolean;
}

/**
 * Wraps an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorType: AnalyticsErrorType,
  context?: Record<string, any>,
  fallback?: T
): Promise<ErrorHandlerResult<T>> {
  try {
    const data = await fn();
    return {
      success: true,
      data,
      fallbackUsed: false,
    };
  } catch (error) {
    const analyticsError = new AnalyticsError(
      error instanceof Error ? error.message : 'Unknown error',
      errorType,
      error instanceof Error ? error : undefined,
      context
    );

    logError(analyticsError);

    if (fallback !== undefined) {
      return {
        success: false,
        data: fallback,
        error: analyticsError,
        fallbackUsed: true,
      };
    }

    return {
      success: false,
      error: analyticsError,
      fallbackUsed: false,
    };
  }
}

/**
 * Handles missing data by providing default values
 */
export function handleMissingData<T>(
  data: T | null | undefined,
  defaultValue: T,
  context?: string
): T {
  if (data === null || data === undefined) {
    console.warn(`Missing data${context ? ` for ${context}` : ''}, using default value`);
    return defaultValue;
  }
  return data;
}

/**
 * Creates empty DailyMetrics as fallback
 */
export function createEmptyDailyMetrics(date: string): DailyMetrics {
  return {
    date,
    consultations: {
      total: 0,
      completed: 0,
      cancelled: 0,
      byType: {},
    },
    prescriptions: {
      issued: 0,
      dispensed: 0,
      pending: 0,
    },
    users: {
      active: 0,
      new: 0,
      byType: {},
    },
    geography: {
      byState: {},
      byDistrict: {},
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates empty DoctorAnalytics as fallback
 */
export function createEmptyDoctorAnalytics(doctorId: string, period: string): DoctorAnalytics {
  return {
    doctorId,
    period,
    consultations: {
      total: 0,
      completed: 0,
      averageDuration: 0,
      responseTime: 0,
    },
    ratings: {
      average: 0,
      count: 0,
      distribution: {},
    },
    availability: {
      hoursActive: 0,
      slotsOffered: 0,
      utilizationRate: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates empty PharmacyAnalytics as fallback
 */
export function createEmptyPharmacyAnalytics(pharmacyId: string, period: string): PharmacyAnalytics {
  return {
    pharmacyId,
    period,
    prescriptions: {
      dispensed: 0,
      pending: 0,
      averageTurnaroundTime: 0,
    },
    inventory: {
      totalItems: 0,
      lowStockItems: 0,
      expiringItems: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Handles corrupted data by attempting to repair or providing fallback
 */
export function handleCorruptedData<T>(
  data: any,
  validator: (data: any) => boolean,
  sanitizer: (data: any) => T | null,
  fallback: T,
  context?: string
): T {
  try {
    // First, try to validate the data
    if (validator(data)) {
      return data as T;
    }

    // If validation fails, try to sanitize
    const sanitized = sanitizer(data);
    if (sanitized !== null) {
      console.warn(`Data sanitized${context ? ` for ${context}` : ''}`);
      return sanitized;
    }

    // If sanitization fails, use fallback
    console.error(`Corrupted data${context ? ` for ${context}` : ''}, using fallback`);
    return fallback;
  } catch (error) {
    console.error(`Error handling corrupted data${context ? ` for ${context}` : ''}:`, error);
    return fallback;
  }
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  context?: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries}${context ? ` for ${context}` : ''} after ${delay}ms`
        );
        await sleep(delay);
      }
    }
  }

  throw new AnalyticsError(
    `Failed after ${maxRetries} retries${context ? ` for ${context}` : ''}`,
    AnalyticsErrorType.DATA_FETCH_ERROR,
    lastError,
    { maxRetries, context }
  );
}

/**
 * Handles batch processing errors
 */
export function handleBatchErrors<T>(
  results: Array<{ success: boolean; data?: T; error?: Error }>,
  context?: string
): {
  successful: T[];
  failed: Error[];
  successRate: number;
} {
  const successful: T[] = [];
  const failed: Error[] = [];

  results.forEach((result) => {
    if (result.success && result.data) {
      successful.push(result.data);
    } else if (result.error) {
      failed.push(result.error);
    }
  });

  const successRate = results.length > 0 ? (successful.length / results.length) * 100 : 0;

  if (failed.length > 0) {
    console.warn(
      `Batch processing${context ? ` for ${context}` : ''}: ${successful.length} succeeded, ${failed.length} failed (${successRate.toFixed(1)}% success rate)`
    );
  }

  return { successful, failed, successRate };
}

/**
 * Filters out invalid data from an array
 */
export function filterInvalidData<T>(
  data: any[],
  validator: (item: any) => boolean,
  context?: string
): T[] {
  if (!Array.isArray(data)) {
    console.error(`Invalid data array${context ? ` for ${context}` : ''}`);
    return [];
  }

  const valid: T[] = [];
  const invalid: any[] = [];

  data.forEach((item, index) => {
    if (validator(item)) {
      valid.push(item);
    } else {
      invalid.push({ index, item });
    }
  });

  if (invalid.length > 0) {
    console.warn(
      `Filtered out ${invalid.length} invalid items${context ? ` from ${context}` : ''} (${valid.length} valid items remaining)`
    );
  }

  return valid;
}

/**
 * Merges partial data with defaults
 */
export function mergeWithDefaults<T extends Record<string, any>>(
  partial: Partial<T>,
  defaults: T
): T {
  const merged = { ...defaults } as any;

  Object.keys(partial).forEach((key) => {
    const value = (partial as any)[key];
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively merge nested objects
        merged[key] = mergeWithDefaults(value, (defaults as any)[key] || {});
      } else {
        merged[key] = value;
      }
    }
  });

  return merged as T;
}

/**
 * Logs error with context
 */
export function logError(error: AnalyticsError): void {
  const errorInfo = {
    message: error.message,
    type: error.type,
    context: error.context,
    stack: error.stack,
    originalError: error.originalError?.message,
  };

  console.error('Analytics Error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Creates a safe wrapper for data access
 */
export function safeAccess<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.warn(`Error accessing path "${path}":`, error);
    return defaultValue;
  }
}

/**
 * Validates and repairs array data
 */
export function repairArrayData<T>(
  data: any,
  itemValidator: (item: any) => boolean,
  itemSanitizer: (item: any) => T | null,
  context?: string
): T[] {
  if (!Array.isArray(data)) {
    console.error(`Expected array${context ? ` for ${context}` : ''}, got ${typeof data}`);
    return [];
  }

  const repaired: T[] = [];

  data.forEach((item, index) => {
    if (itemValidator(item)) {
      repaired.push(item);
    } else {
      const sanitized = itemSanitizer(item);
      if (sanitized !== null) {
        console.warn(`Repaired item at index ${index}${context ? ` in ${context}` : ''}`);
        repaired.push(sanitized);
      } else {
        console.warn(`Skipped invalid item at index ${index}${context ? ` in ${context}` : ''}`);
      }
    }
  });

  return repaired;
}

/**
 * Handles timeout errors
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new AnalyticsError(
          `Operation timed out after ${timeoutMs}ms${context ? ` for ${context}` : ''}`,
          AnalyticsErrorType.NETWORK_ERROR,
          undefined,
          { timeoutMs, context }
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Sleep utility for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Aggregates errors for reporting
 */
export function aggregateErrors(errors: AnalyticsError[]): {
  byType: Record<AnalyticsErrorType, number>;
  total: number;
  mostCommon: AnalyticsErrorType | null;
} {
  const byType: Record<AnalyticsErrorType, number> = {} as any;
  let mostCommonType: AnalyticsErrorType | null = null;
  let maxCount = 0;

  errors.forEach((error) => {
    byType[error.type] = (byType[error.type] || 0) + 1;
    if (byType[error.type] > maxCount) {
      maxCount = byType[error.type];
      mostCommonType = error.type;
    }
  });

  return {
    byType,
    total: errors.length,
    mostCommon: mostCommonType,
  };
}
