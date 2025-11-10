/**
 * Analytics Aggregation Service
 * Handles data aggregation from Firestore collections for analytics dashboard
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  Timestamp,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  DailyMetrics,
  DoctorAnalytics,
  PharmacyAnalytics,
  PlatformMetrics,
  DateRange,
} from '@/lib/types/analytics-models';
import {
  withErrorHandling,
  retryWithBackoff,
  sanitizeDailyMetrics,
  sanitizeDoctorAnalytics,
  sanitizePharmacyAnalytics,
  createEmptyDailyMetrics,
  AnalyticsErrorType,
} from '@/lib/utils/analytics-utils';

/**
 * Aggregates daily metrics from various collections
 */
export async function aggregateDailyMetrics(date: Date): Promise<DailyMetrics> {
  const dateStr = formatDate(date);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Aggregate consultations with error handling
  const consultationsResult = await withErrorHandling(
    () => aggregateConsultations(startOfDay, endOfDay),
    AnalyticsErrorType.AGGREGATION_ERROR,
    { operation: 'aggregateConsultations', date: dateStr },
    { total: 0, completed: 0, cancelled: 0, byType: {} }
  );

  // Aggregate prescriptions with error handling
  const prescriptionsResult = await withErrorHandling(
    () => aggregatePrescriptions(startOfDay, endOfDay),
    AnalyticsErrorType.AGGREGATION_ERROR,
    { operation: 'aggregatePrescriptions', date: dateStr },
    { issued: 0, dispensed: 0, pending: 0 }
  );

  // Aggregate users with error handling
  const usersResult = await withErrorHandling(
    () => aggregateUsers(startOfDay, endOfDay),
    AnalyticsErrorType.AGGREGATION_ERROR,
    { operation: 'aggregateUsers', date: dateStr },
    { active: 0, new: 0, byType: {} }
  );

  // Aggregate geography data with error handling
  const geographyResult = await withErrorHandling(
    () => aggregateGeography(startOfDay, endOfDay),
    AnalyticsErrorType.AGGREGATION_ERROR,
    { operation: 'aggregateGeography', date: dateStr },
    { byState: {}, byDistrict: {} }
  );

  const metrics: DailyMetrics = {
    date: dateStr,
    consultations: consultationsResult.data!,
    prescriptions: prescriptionsResult.data!,
    users: usersResult.data!,
    geography: geographyResult.data!,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Sanitize the aggregated metrics
  const sanitized = sanitizeDailyMetrics(metrics);
  if (!sanitized) {
    console.error('Failed to sanitize metrics, using empty metrics');
    return createEmptyDailyMetrics(dateStr);
  }

  // Store in Firestore with retry
  await retryWithBackoff(
    () => storeDailyMetrics(dateStr, sanitized),
    3,
    1000,
    `store daily metrics for ${dateStr}`
  );

  return sanitized;
}

/**
 * Aggregates consultation data for a given time period
 */
async function aggregateConsultations(startDate: Date, endDate: Date) {
  const consultationsRef = collection(db, 'consultations');
  const q = query(
    consultationsRef,
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    where('startTime', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const consultations = snapshot.docs.map((doc) => doc.data());

  const total = consultations.length;
  const completed = consultations.filter((c) => c.status === 'completed').length;
  const cancelled = consultations.filter((c) => c.status === 'cancelled').length;

  const byType: Record<string, number> = {};
  consultations.forEach((c) => {
    const type = c.type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  return { total, completed, cancelled, byType };
}

/**
 * Aggregates prescription data for a given time period
 */
async function aggregatePrescriptions(startDate: Date, endDate: Date) {
  const prescriptionsRef = collection(db, 'prescriptions');
  const q = query(
    prescriptionsRef,
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const prescriptions = snapshot.docs.map((doc) => doc.data());

  const issued = prescriptions.length;
  const dispensed = prescriptions.filter((p) => p.status === 'dispensed').length;
  const pending = prescriptions.filter((p) => p.status === 'pending').length;

  return { issued, dispensed, pending };
}

/**
 * Aggregates user data for a given time period
 */
async function aggregateUsers(startDate: Date, endDate: Date) {
  const usersRef = collection(db, 'users');

  // Get new users created in this period
  const newUsersQuery = query(
    usersRef,
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate))
  );
  const newUsersSnapshot = await getDocs(newUsersQuery);
  const newUsers = newUsersSnapshot.docs.map((doc) => doc.data());

  // Get active users (users who had activity in this period)
  // For now, we'll use consultation and prescription activity as proxy
  const consultationsRef = collection(db, 'consultations');
  const consultationsQuery = query(
    consultationsRef,
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    where('startTime', '<=', Timestamp.fromDate(endDate))
  );
  const consultationsSnapshot = await getDocs(consultationsQuery);
  const activeUserIds = new Set<string>();
  consultationsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.patientId) activeUserIds.add(data.patientId);
    if (data.doctorId) activeUserIds.add(data.doctorId);
  });

  const byType: Record<string, number> = {};
  newUsers.forEach((u) => {
    const role = u.role || 'unknown';
    byType[role] = (byType[role] || 0) + 1;
  });

  return {
    active: activeUserIds.size,
    new: newUsers.length,
    byType,
  };
}

/**
 * Aggregates geographic data for a given time period
 */
async function aggregateGeography(startDate: Date, endDate: Date) {
  const consultationsRef = collection(db, 'consultations');
  const q = query(
    consultationsRef,
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    where('startTime', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const consultations = snapshot.docs.map((doc) => doc.data());

  const byState: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};

  // Aggregate by location if available
  consultations.forEach((c) => {
    if (c.location?.state) {
      byState[c.location.state] = (byState[c.location.state] || 0) + 1;
    }
    if (c.location?.district) {
      byDistrict[c.location.district] = (byDistrict[c.location.district] || 0) + 1;
    }
  });

  return { byState, byDistrict };
}

/**
 * Stores daily metrics in Firestore
 */
async function storeDailyMetrics(dateStr: string, metrics: DailyMetrics) {
  const metricsRef = doc(db, 'daily-metrics', dateStr);
  await setDoc(metricsRef, {
    ...metrics,
    createdAt: Timestamp.fromDate(metrics.createdAt),
    updatedAt: Timestamp.fromDate(metrics.updatedAt),
  });
}

/**
 * Formats date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Aggregates doctor analytics for a specific doctor and period
 */
export async function aggregateDoctorAnalytics(
  doctorId: string,
  date: Date
): Promise<DoctorAnalytics> {
  const dateStr = formatDate(date);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get doctor's consultations
  const consultationsRef = collection(db, 'consultations');
  const q = query(
    consultationsRef,
    where('doctorId', '==', doctorId),
    where('startTime', '>=', Timestamp.fromDate(startOfDay)),
    where('startTime', '<=', Timestamp.fromDate(endOfDay))
  );

  const snapshot = await getDocs(q);
  const consultations = snapshot.docs.map((doc) => doc.data());

  const total = consultations.length;
  const completed = consultations.filter((c) => c.status === 'completed').length;

  // Calculate average duration
  const durations = consultations
    .filter((c) => c.duration)
    .map((c) => c.duration);
  const averageDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  // Calculate average response time
  const responseTimes = consultations
    .filter((c) => c.responseTime)
    .map((c) => c.responseTime);
  const responseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 0;

  // Get ratings
  const ratings = consultations
    .filter((c) => c.rating)
    .map((c) => c.rating);
  const ratingsCount = ratings.length;
  const ratingsAverage = ratingsCount > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratingsCount
    : 0;

  const ratingsDistribution: Record<string, number> = {};
  ratings.forEach((r) => {
    const key = String(r);
    ratingsDistribution[key] = (ratingsDistribution[key] || 0) + 1;
  });

  // Get availability data (simplified - would need appointment slots data)
  const hoursActive = consultations.length > 0 ? 8 : 0; // Placeholder
  const slotsOffered = consultations.length; // Placeholder
  const utilizationRate = slotsOffered > 0 ? (completed / slotsOffered) * 100 : 0;

  const analytics: DoctorAnalytics = {
    doctorId,
    period: dateStr,
    consultations: {
      total,
      completed,
      averageDuration,
      responseTime,
    },
    ratings: {
      average: ratingsAverage,
      count: ratingsCount,
      distribution: ratingsDistribution,
    },
    availability: {
      hoursActive,
      slotsOffered,
      utilizationRate,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store in Firestore
  await storeDoctorAnalytics(doctorId, dateStr, analytics);

  return analytics;
}

/**
 * Stores doctor analytics in Firestore
 */
async function storeDoctorAnalytics(
  doctorId: string,
  period: string,
  analytics: DoctorAnalytics
) {
  const analyticsRef = doc(db, 'doctor-analytics', `${doctorId}_${period}`);
  await setDoc(analyticsRef, {
    ...analytics,
    createdAt: Timestamp.fromDate(analytics.createdAt),
    updatedAt: Timestamp.fromDate(analytics.updatedAt),
  });
}

/**
 * Aggregates pharmacy analytics for a specific pharmacy and period
 */
export async function aggregatePharmacyAnalytics(
  pharmacyId: string,
  date: Date
): Promise<PharmacyAnalytics> {
  const dateStr = formatDate(date);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get pharmacy's prescriptions
  const prescriptionsRef = collection(db, 'prescriptions');
  const q = query(
    prescriptionsRef,
    where('pharmacyId', '==', pharmacyId),
    where('updatedAt', '>=', Timestamp.fromDate(startOfDay)),
    where('updatedAt', '<=', Timestamp.fromDate(endOfDay))
  );

  const snapshot = await getDocs(q);
  const prescriptions = snapshot.docs.map((doc) => doc.data());

  const dispensed = prescriptions.filter((p) => p.status === 'dispensed').length;
  const pending = prescriptions.filter((p) => p.status === 'pending').length;

  // Calculate average turnaround time (from issued to dispensed)
  const turnaroundTimes = prescriptions
    .filter((p) => p.status === 'dispensed' && p.dispensedAt && p.createdAt)
    .map((p) => {
      const issued = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      const dispensedDate = p.dispensedAt.toDate ? p.dispensedAt.toDate() : new Date(p.dispensedAt);
      return (dispensedDate.getTime() - issued.getTime()) / (1000 * 60 * 60); // hours
    });
  
  const averageTurnaroundTime = turnaroundTimes.length > 0
    ? turnaroundTimes.reduce((sum, t) => sum + t, 0) / turnaroundTimes.length
    : 0;

  // Get inventory data (simplified - would need actual inventory collection)
  const inventoryRef = collection(db, 'pharmacy-inventory');
  const inventoryQuery = query(
    inventoryRef,
    where('pharmacyId', '==', pharmacyId)
  );
  
  let totalItems = 0;
  let lowStockItems = 0;
  let expiringItems = 0;

  try {
    const inventorySnapshot = await getDocs(inventoryQuery);
    totalItems = inventorySnapshot.size;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    inventorySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.quantity && data.quantity < (data.minQuantity || 10)) {
        lowStockItems++;
      }
      if (data.expiryDate) {
        const expiryDate = data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);
        if (expiryDate <= thirtyDaysFromNow) {
          expiringItems++;
        }
      }
    });
  } catch (error) {
    console.warn('Inventory data not available:', error);
  }

  const analytics: PharmacyAnalytics = {
    pharmacyId,
    period: dateStr,
    prescriptions: {
      dispensed,
      pending,
      averageTurnaroundTime,
    },
    inventory: {
      totalItems,
      lowStockItems,
      expiringItems,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store in Firestore
  await storePharmacyAnalytics(pharmacyId, dateStr, analytics);

  return analytics;
}

/**
 * Stores pharmacy analytics in Firestore
 */
async function storePharmacyAnalytics(
  pharmacyId: string,
  period: string,
  analytics: PharmacyAnalytics
) {
  const analyticsRef = doc(db, 'pharmacy-analytics', `${pharmacyId}_${period}`);
  await setDoc(analyticsRef, {
    ...analytics,
    createdAt: Timestamp.fromDate(analytics.createdAt),
    updatedAt: Timestamp.fromDate(analytics.updatedAt),
  });
}

/**
 * Runs daily batch processing to aggregate all metrics
 * This should be called by a scheduled function (e.g., Cloud Functions cron job)
 */
export async function runDailyBatchProcessing(date?: Date): Promise<void> {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  console.log(`Starting daily batch processing for ${formatDate(targetDate)}`);

  try {
    // Aggregate daily metrics
    await aggregateDailyMetrics(targetDate);
    console.log('Daily metrics aggregated successfully');

    // Get all doctors and aggregate their analytics
    const doctorsRef = collection(db, 'users');
    const doctorsQuery = query(doctorsRef, where('role', '==', 'doctor'));
    const doctorsSnapshot = await getDocs(doctorsQuery);

    const doctorPromises = doctorsSnapshot.docs.map((doc) =>
      aggregateDoctorAnalytics(doc.id, targetDate).catch((error) => {
        console.error(`Failed to aggregate analytics for doctor ${doc.id}:`, error);
      })
    );

    await Promise.all(doctorPromises);
    console.log(`Doctor analytics aggregated for ${doctorsSnapshot.size} doctors`);

    // Get all pharmacies and aggregate their analytics
    const pharmaciesRef = collection(db, 'users');
    const pharmaciesQuery = query(pharmaciesRef, where('role', '==', 'pharmacy'));
    const pharmaciesSnapshot = await getDocs(pharmaciesQuery);

    const pharmacyPromises = pharmaciesSnapshot.docs.map((doc) =>
      aggregatePharmacyAnalytics(doc.id, targetDate).catch((error) => {
        console.error(`Failed to aggregate analytics for pharmacy ${doc.id}:`, error);
      })
    );

    await Promise.all(pharmacyPromises);
    console.log(`Pharmacy analytics aggregated for ${pharmaciesSnapshot.size} pharmacies`);

    console.log('Daily batch processing completed successfully');
  } catch (error) {
    console.error('Daily batch processing failed:', error);
    throw error;
  }
}

/**
 * Gets real-time metrics for the current day
 * This provides up-to-date statistics without waiting for batch processing
 */
export async function getRealTimeMetrics(): Promise<DailyMetrics> {
  const today = new Date();
  const dateStr = formatDate(today);

  // Check if we have cached metrics for today
  const cachedMetricsRef = doc(db, 'daily-metrics', dateStr);
  const cachedMetrics = await getDoc(cachedMetricsRef);

  // If cached metrics exist and were updated recently (within last 5 minutes), return them
  if (cachedMetrics.exists()) {
    const data = cachedMetrics.data();
    const updatedAt = data.updatedAt.toDate();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (updatedAt > fiveMinutesAgo) {
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as DailyMetrics;
    }
  }

  // Otherwise, compute fresh metrics for today
  const metrics = await aggregateDailyMetrics(today);
  return metrics;
}

/**
 * Gets aggregated metrics for a date range
 */
export async function getMetricsForDateRange(
  startDate: Date,
  endDate: Date
): Promise<DailyMetrics[]> {
  const metricsRef = collection(db, 'daily-metrics');
  const q = query(
    metricsRef,
    where('date', '>=', formatDate(startDate)),
    where('date', '<=', formatDate(endDate)),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as DailyMetrics;
  });
}

/**
 * Gets doctor analytics for a date range
 */
export async function getDoctorAnalyticsForDateRange(
  doctorId: string,
  startDate: Date,
  endDate: Date
): Promise<DoctorAnalytics[]> {
  const analyticsRef = collection(db, 'doctor-analytics');
  const startKey = `${doctorId}_${formatDate(startDate)}`;
  const endKey = `${doctorId}_${formatDate(endDate)}`;

  const q = query(
    analyticsRef,
    where('doctorId', '==', doctorId),
    where('period', '>=', formatDate(startDate)),
    where('period', '<=', formatDate(endDate)),
    orderBy('period', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as DoctorAnalytics;
  });
}

/**
 * Gets pharmacy analytics for a date range
 */
export async function getPharmacyAnalyticsForDateRange(
  pharmacyId: string,
  startDate: Date,
  endDate: Date
): Promise<PharmacyAnalytics[]> {
  const analyticsRef = collection(db, 'pharmacy-analytics');

  const q = query(
    analyticsRef,
    where('pharmacyId', '==', pharmacyId),
    where('period', '>=', formatDate(startDate)),
    where('period', '<=', formatDate(endDate)),
    orderBy('period', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as PharmacyAnalytics;
  });
}
