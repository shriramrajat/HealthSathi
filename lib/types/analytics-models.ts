/**
 * Analytics Data Models
 * Type definitions for analytics aggregation collections
 */

export interface DailyMetrics {
  id?: string;
  date: string; // YYYY-MM-DD format
  consultations: {
    total: number;
    completed: number;
    cancelled: number;
    byType: Record<string, number>; // video, in-person, emergency
  };
  prescriptions: {
    issued: number;
    dispensed: number;
    pending: number;
  };
  users: {
    active: number;
    new: number;
    byType: Record<string, number>; // patient, doctor, pharmacy, chw
  };
  geography: {
    byState: Record<string, number>;
    byDistrict: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorAnalytics {
  id?: string;
  doctorId: string;
  period: string; // YYYY-MM-DD format
  consultations: {
    total: number;
    completed: number;
    averageDuration: number; // in minutes
    responseTime: number; // in minutes
  };
  ratings: {
    average: number;
    count: number;
    distribution: Record<string, number>; // 1-5 star distribution
  };
  availability: {
    hoursActive: number;
    slotsOffered: number;
    utilizationRate: number; // percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyAnalytics {
  id?: string;
  pharmacyId: string;
  period: string; // YYYY-MM-DD format
  prescriptions: {
    dispensed: number;
    pending: number;
    averageTurnaroundTime: number; // in hours
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    expiringItems: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformMetrics {
  totalUsers: number;
  activeDoctors: number;
  completedConsultations: number;
  prescriptionsDispensed: number;
  growthRates: {
    users: number;
    consultations: number;
    prescriptions: number;
  };
  periodComparison: {
    current: MetricsPeriod;
    previous: MetricsPeriod;
  };
}

export interface MetricsPeriod {
  users: number;
  consultations: number;
  prescriptions: number;
  startDate: string;
  endDate: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  userType?: 'patient' | 'doctor' | 'pharmacy' | 'chw';
  location?: GeographicFilter;
  category?: string;
  status?: string;
}

export interface GeographicFilter {
  country?: string;
  state?: string;
  district?: string;
  coordinates?: {
    lat: number;
    lng: number;
    radius: number;
  };
}
