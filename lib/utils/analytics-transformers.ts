/**
 * Analytics Data Transformation Utilities
 * Transforms raw Firestore data into chart-ready formats with validation and error handling
 */

import type {
  DailyMetrics,
  DoctorAnalytics,
  PharmacyAnalytics,
  DateRange,
} from '@/lib/types/analytics-models';

/**
 * Chart data point interface for time-series data
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Pie chart data interface
 */
export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

/**
 * Trend data interface for metric cards
 */
export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  direction: 'up' | 'down' | 'neutral';
}

/**
 * Transforms daily metrics into time-series chart data
 */
export function transformDailyMetricsToTimeSeries(
  metrics: DailyMetrics[],
  field: 'consultations' | 'prescriptions' | 'users'
): ChartDataPoint[] {
  try {
    validateMetricsArray(metrics);

    return metrics
      .map((metric) => {
        const value = extractFieldValue(metric, field);
        return {
          date: metric.date,
          value: sanitizeNumber(value),
          label: formatDateLabel(metric.date),
          metadata: {
            raw: metric[field],
          },
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error transforming daily metrics to time series:', error);
    return [];
  }
}

/**
 * Transforms consultation type breakdown into pie chart data
 */
export function transformConsultationTypesToPieChart(
  metrics: DailyMetrics[]
): PieChartData[] {
  try {
    validateMetricsArray(metrics);

    const typeTotals: Record<string, number> = {};
    let grandTotal = 0;

    metrics.forEach((metric) => {
      if (metric.consultations?.byType) {
        Object.entries(metric.consultations.byType).forEach(([type, count]) => {
          const sanitizedCount = sanitizeNumber(count);
          typeTotals[type] = (typeTotals[type] || 0) + sanitizedCount;
          grandTotal += sanitizedCount;
        });
      }
    });

    if (grandTotal === 0) {
      return [];
    }

    return Object.entries(typeTotals)
      .map(([name, value]) => ({
        name: formatConsultationType(name),
        value,
        percentage: (value / grandTotal) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error transforming consultation types to pie chart:', error);
    return [];
  }
}

/**
 * Transforms user type breakdown into pie chart data
 */
export function transformUserTypesToPieChart(
  metrics: DailyMetrics[]
): PieChartData[] {
  try {
    validateMetricsArray(metrics);

    const typeTotals: Record<string, number> = {};
    let grandTotal = 0;

    metrics.forEach((metric) => {
      if (metric.users?.byType) {
        Object.entries(metric.users.byType).forEach(([type, count]) => {
          const sanitizedCount = sanitizeNumber(count);
          typeTotals[type] = (typeTotals[type] || 0) + sanitizedCount;
          grandTotal += sanitizedCount;
        });
      }
    });

    if (grandTotal === 0) {
      return [];
    }

    return Object.entries(typeTotals)
      .map(([name, value]) => ({
        name: formatUserType(name),
        value,
        percentage: (value / grandTotal) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error transforming user types to pie chart:', error);
    return [];
  }
}

/**
 * Transforms geographic data into map-ready format
 */
export function transformGeographicData(
  metrics: DailyMetrics[]
): Array<{ region: string; value: number; type: 'state' | 'district' }> {
  try {
    validateMetricsArray(metrics);

    const stateTotals: Record<string, number> = {};
    const districtTotals: Record<string, number> = {};

    metrics.forEach((metric) => {
      if (metric.geography?.byState) {
        Object.entries(metric.geography.byState).forEach(([state, count]) => {
          const sanitizedCount = sanitizeNumber(count);
          stateTotals[state] = (stateTotals[state] || 0) + sanitizedCount;
        });
      }

      if (metric.geography?.byDistrict) {
        Object.entries(metric.geography.byDistrict).forEach(([district, count]) => {
          const sanitizedCount = sanitizeNumber(count);
          districtTotals[district] = (districtTotals[district] || 0) + sanitizedCount;
        });
      }
    });

    const stateData = Object.entries(stateTotals).map(([region, value]) => ({
      region,
      value,
      type: 'state' as const,
    }));

    const districtData = Object.entries(districtTotals).map(([region, value]) => ({
      region,
      value,
      type: 'district' as const,
    }));

    return [...stateData, ...districtData].sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error transforming geographic data:', error);
    return [];
  }
}

/**
 * Calculates trend data for metric cards
 */
export function calculateTrend(
  currentMetrics: DailyMetrics[],
  previousMetrics: DailyMetrics[],
  field: 'consultations' | 'prescriptions' | 'users'
): TrendData {
  try {
    const current = sumMetricsField(currentMetrics, field);
    const previous = sumMetricsField(previousMetrics, field);

    const change = current - previous;
    const changePercentage = previous > 0 ? (change / previous) * 100 : 0;

    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (change > 0) direction = 'up';
    else if (change < 0) direction = 'down';

    return {
      current,
      previous,
      change,
      changePercentage,
      direction,
    };
  } catch (error) {
    console.error('Error calculating trend:', error);
    return {
      current: 0,
      previous: 0,
      change: 0,
      changePercentage: 0,
      direction: 'neutral',
    };
  }
}

/**
 * Transforms doctor analytics into performance table data
 */
export function transformDoctorAnalyticsToTable(
  analytics: DoctorAnalytics[]
): Array<{
  doctorId: string;
  consultations: number;
  completionRate: number;
  averageRating: number;
  responseTime: number;
  utilizationRate: number;
}> {
  try {
    if (!Array.isArray(analytics)) {
      throw new Error('Invalid analytics data: expected array');
    }

    return analytics
      .map((data) => {
        const total = sanitizeNumber(data.consultations?.total);
        const completed = sanitizeNumber(data.consultations?.completed);
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return {
          doctorId: data.doctorId || 'unknown',
          consultations: total,
          completionRate: sanitizeNumber(completionRate, 2),
          averageRating: sanitizeNumber(data.ratings?.average, 2),
          responseTime: sanitizeNumber(data.consultations?.responseTime, 2),
          utilizationRate: sanitizeNumber(data.availability?.utilizationRate, 2),
        };
      })
      .filter((row) => row.consultations > 0)
      .sort((a, b) => b.consultations - a.consultations);
  } catch (error) {
    console.error('Error transforming doctor analytics to table:', error);
    return [];
  }
}

/**
 * Transforms pharmacy analytics into performance metrics
 */
export function transformPharmacyAnalyticsToMetrics(
  analytics: PharmacyAnalytics[]
): {
  totalDispensed: number;
  totalPending: number;
  averageTurnaroundTime: number;
  lowStockCount: number;
  expiringItemsCount: number;
} {
  try {
    if (!Array.isArray(analytics)) {
      throw new Error('Invalid analytics data: expected array');
    }

    let totalDispensed = 0;
    let totalPending = 0;
    let turnaroundTimes: number[] = [];
    let lowStockCount = 0;
    let expiringItemsCount = 0;

    analytics.forEach((data) => {
      totalDispensed += sanitizeNumber(data.prescriptions?.dispensed);
      totalPending += sanitizeNumber(data.prescriptions?.pending);

      const turnaround = sanitizeNumber(data.prescriptions?.averageTurnaroundTime);
      if (turnaround > 0) {
        turnaroundTimes.push(turnaround);
      }

      lowStockCount += sanitizeNumber(data.inventory?.lowStockItems);
      expiringItemsCount += sanitizeNumber(data.inventory?.expiringItems);
    });

    const averageTurnaroundTime =
      turnaroundTimes.length > 0
        ? turnaroundTimes.reduce((sum, t) => sum + t, 0) / turnaroundTimes.length
        : 0;

    return {
      totalDispensed,
      totalPending,
      averageTurnaroundTime: sanitizeNumber(averageTurnaroundTime, 2),
      lowStockCount,
      expiringItemsCount,
    };
  } catch (error) {
    console.error('Error transforming pharmacy analytics to metrics:', error);
    return {
      totalDispensed: 0,
      totalPending: 0,
      averageTurnaroundTime: 0,
      lowStockCount: 0,
      expiringItemsCount: 0,
    };
  }
}

/**
 * Aggregates metrics by time period (daily, weekly, monthly)
 */
export function aggregateMetricsByPeriod(
  metrics: DailyMetrics[],
  period: 'daily' | 'weekly' | 'monthly'
): DailyMetrics[] {
  try {
    validateMetricsArray(metrics);

    if (period === 'daily') {
      return metrics;
    }

    const grouped = new Map<string, DailyMetrics[]>();

    metrics.forEach((metric) => {
      const periodKey = getPeriodKey(metric.date, period);
      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, []);
      }
      grouped.get(periodKey)!.push(metric);
    });

    return Array.from(grouped.entries())
      .map(([periodKey, periodMetrics]) => aggregateMetricsGroup(periodKey, periodMetrics))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error aggregating metrics by period:', error);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates that metrics array is valid
 */
function validateMetricsArray(metrics: any[]): void {
  if (!Array.isArray(metrics)) {
    throw new Error('Invalid metrics data: expected array');
  }
  if (metrics.length === 0) {
    throw new Error('Empty metrics array');
  }
}

/**
 * Extracts field value from metric object
 */
function extractFieldValue(
  metric: DailyMetrics,
  field: 'consultations' | 'prescriptions' | 'users'
): number {
  switch (field) {
    case 'consultations':
      return metric.consultations?.total || 0;
    case 'prescriptions':
      return metric.prescriptions?.issued || 0;
    case 'users':
      return metric.users?.new || 0;
    default:
      return 0;
  }
}

/**
 * Sums a specific field across multiple metrics
 */
function sumMetricsField(
  metrics: DailyMetrics[],
  field: 'consultations' | 'prescriptions' | 'users'
): number {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return 0;
  }

  return metrics.reduce((sum, metric) => {
    return sum + extractFieldValue(metric, field);
  }, 0);
}

/**
 * Sanitizes number values, handling null, undefined, NaN, and Infinity
 */
function sanitizeNumber(value: any, decimals?: number): number {
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }

  if (decimals !== undefined) {
    return Number(num.toFixed(decimals));
  }

  return num;
}

/**
 * Formats date string for chart labels
 */
function formatDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateStr;
  }
}

/**
 * Formats consultation type for display
 */
function formatConsultationType(type: string): string {
  const typeMap: Record<string, string> = {
    video: 'Video Consultation',
    'in-person': 'In-Person',
    emergency: 'Emergency',
    unknown: 'Other',
  };

  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Formats user type for display
 */
function formatUserType(type: string): string {
  const typeMap: Record<string, string> = {
    patient: 'Patients',
    doctor: 'Doctors',
    pharmacy: 'Pharmacies',
    chw: 'Community Health Workers',
    unknown: 'Other',
  };

  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Gets period key for grouping (weekly or monthly)
 */
function getPeriodKey(dateStr: string, period: 'weekly' | 'monthly'): string {
  const date = new Date(dateStr);

  if (period === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Weekly: get ISO week number
  const weekNumber = getISOWeek(date);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Gets ISO week number for a date
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Aggregates a group of metrics into a single metric
 */
function aggregateMetricsGroup(periodKey: string, metrics: DailyMetrics[]): DailyMetrics {
  const aggregated: DailyMetrics = {
    date: periodKey,
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

  metrics.forEach((metric) => {
    // Aggregate consultations
    aggregated.consultations.total += sanitizeNumber(metric.consultations?.total);
    aggregated.consultations.completed += sanitizeNumber(metric.consultations?.completed);
    aggregated.consultations.cancelled += sanitizeNumber(metric.consultations?.cancelled);

    if (metric.consultations?.byType) {
      Object.entries(metric.consultations.byType).forEach(([type, count]) => {
        aggregated.consultations.byType[type] =
          (aggregated.consultations.byType[type] || 0) + sanitizeNumber(count);
      });
    }

    // Aggregate prescriptions
    aggregated.prescriptions.issued += sanitizeNumber(metric.prescriptions?.issued);
    aggregated.prescriptions.dispensed += sanitizeNumber(metric.prescriptions?.dispensed);
    aggregated.prescriptions.pending += sanitizeNumber(metric.prescriptions?.pending);

    // Aggregate users (use max for active, sum for new)
    aggregated.users.active = Math.max(
      aggregated.users.active,
      sanitizeNumber(metric.users?.active)
    );
    aggregated.users.new += sanitizeNumber(metric.users?.new);

    if (metric.users?.byType) {
      Object.entries(metric.users.byType).forEach(([type, count]) => {
        aggregated.users.byType[type] =
          (aggregated.users.byType[type] || 0) + sanitizeNumber(count);
      });
    }

    // Aggregate geography
    if (metric.geography?.byState) {
      Object.entries(metric.geography.byState).forEach(([state, count]) => {
        aggregated.geography.byState[state] =
          (aggregated.geography.byState[state] || 0) + sanitizeNumber(count);
      });
    }

    if (metric.geography?.byDistrict) {
      Object.entries(metric.geography.byDistrict).forEach(([district, count]) => {
        aggregated.geography.byDistrict[district] =
          (aggregated.geography.byDistrict[district] || 0) + sanitizeNumber(count);
      });
    }
  });

  return aggregated;
}
