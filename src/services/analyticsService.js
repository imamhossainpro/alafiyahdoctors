// src/services/analyticsService.js
// ==================================================
// 📊 Analytics Service — Firestore + GA4 (Phase 1)
// ==================================================
// ✅ Firestore = Source of truth for bookings
// ✅ GA4 (server-side) = User behavior metrics
// ✅ Timezone-aware (Asia/Dhaka)
// ✅ Single-fetch optimization (5x → 1x reads)
// ✅ Previous-period comparison support
// ==================================================

import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '../firebase';

// ✅ Backend URL — same as other admin services
const API_BASE_URL = 'https://api.alafiyahhospital.com';

// ==================================================
// ✅ Timezone helpers (Asia/Dhaka = UTC+6)
// ==================================================
const BD_TIMEZONE_OFFSET_MIN = 6 * 60;

/**
 * Get today's date in Bangladesh timezone as YYYY-MM-DD
 */
export function getBDTodayString() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bdDate = new Date(utc + BD_TIMEZONE_OFFSET_MIN * 60000);
  return bdDate.toISOString().split('T')[0];
}

/**
 * Normalize any date value to YYYY-MM-DD in Bangladesh timezone
 */
function normalizeToBDDate(bookingDate) {
  if (!bookingDate) return null;

  // Already a YYYY-MM-DD string
  if (typeof bookingDate === 'string') {
    return bookingDate.split('T')[0];
  }

  let dateObj = null;

  if (bookingDate?.toDate) {
    dateObj = bookingDate.toDate();
  } else if (bookingDate?.seconds) {
    dateObj = new Date(bookingDate.seconds * 1000);
  } else if (bookingDate instanceof Date) {
    dateObj = bookingDate;
  } else {
    try {
      dateObj = new Date(bookingDate);
    } catch {
      return null;
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) return null;

  // Convert to Bangladesh time
  const utc = dateObj.getTime() + dateObj.getTimezoneOffset() * 60000;
  const bdDate = new Date(utc + BD_TIMEZONE_OFFSET_MIN * 60000);
  return bdDate.toISOString().split('T')[0];
}

// ==================================================
// ✅ Date Range Helpers
// ==================================================
/**
 * Get date range from preset
 * @param {string} preset - 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'
 * @returns {{ start: string, end: string }}
 */
export function getDateRangeFromPreset(preset) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr };

    case 'week': {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    }

    case 'month': {
      const d = new Date(today);
      d.setMonth(today.getMonth() - 1);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    }

    case 'year': {
      const d = new Date(today);
      d.setFullYear(today.getFullYear() - 1);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    }

    case 'all':
    default:
      return { start: '2020-01-01', end: '2030-12-31' };
  }
}

/**
 * Get previous period range for comparison
 * Example: If current is 30 days, previous is the 30 days before that
 */
export function getPreviousPeriodRange(dateRange) {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (dayCount - 1));

  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  };
}

// ==================================================
// ✅ NEW: Single-fetch analytics (Phase 1 optimization)
// ==================================================
/**
 * Fetch ALL analytics data in ONE Firestore read
 * Reduces 5x reads to 1x, applies timezone consistently
 * Returns: { kpis, trends, statusBreakdown, sources, officers, fetchedAt }
 */
export async function getAllAnalyticsData(hospitalId, dateRange) {
  if (!hospitalId) return null;

  try {
    const appointmentsRef = collection(
      db,
      'hospitals',
      hospitalId,
      'appointments'
    );
    const snap = await getDocs(appointmentsRef);

    // Single pass aggregation
    let total = 0;
    let completed = 0;
    let cancelled = 0;
    let pending = 0;
    let confirmed = 0;
    let checkedIn = 0;
    let noShow = 0;
    let archived = 0;

    const uniqueMobiles = new Set();
    const dateMap = {};
    const sourceMap = {};
    const officerMap = {};

    // Pre-build date map for trends (max 90 days)
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(dayCount, 90);

    for (let i = 0; i < maxDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = { date: dateStr, total: 0, completed: 0, cancelled: 0 };
    }

    // Single pass over all documents
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const apptDate = normalizeToBDDate(data.bookingDate);

      if (!apptDate) return;
      if (apptDate < dateRange.start || apptDate > dateRange.end) return;

      // Skip archived
      if (data.isArchived === true) {
        archived++;
        return;
      }

      // KPI Counters
      total++;

      const status = (data.status || 'pending').toLowerCase();
      if (status === 'completed') completed++;
      else if (status === 'cancelled') cancelled++;
      else if (status === 'pending') pending++;
      else if (status === 'confirmed') confirmed++;
      else if (status === 'checked-in') checkedIn++;
      else if (status === 'no-show') noShow++;

      if (data.mobile) {
        const trimmed = String(data.mobile).trim();
        if (trimmed) uniqueMobiles.add(trimmed);
      }

      // Trends
      if (dateMap[apptDate]) {
        dateMap[apptDate].total++;
        if (status === 'completed') dateMap[apptDate].completed++;
        else if (status === 'cancelled') dateMap[apptDate].cancelled++;
      }

      // Marketing Sources
      const source = data.referralSource || 'Not recorded';
      if (!sourceMap[source]) {
        sourceMap[source] = {
          name: source,
          total: 0,
          completed: 0,
          cancelled: 0,
        };
      }
      sourceMap[source].total++;
      if (status === 'completed') sourceMap[source].completed++;
      else if (status === 'cancelled') sourceMap[source].cancelled++;

      // Officer Performance
      const officerName = data.marketingOfficer || null;
      if (officerName) {
        if (!officerMap[officerName]) {
          officerMap[officerName] = {
            name: officerName,
            total: 0,
            completed: 0,
            cancelled: 0,
            newPatients: 0,
            reportPatients: 0,
            followupPatients: 0,
          };
        }
        const entry = officerMap[officerName];
        entry.total++;
        if (status === 'completed') entry.completed++;
        else if (status === 'cancelled') entry.cancelled++;

        const pt = data.patientTypeOverride;
        if (pt === 'নতুন') entry.newPatients++;
        else if (pt === 'রিপোর্ট') entry.reportPatients++;
        else if (pt === 'ফলোআপ') entry.followupPatients++;
      }
    });

    // Build final results
    const conversionRate =
      total > 0
        ? parseFloat((((completed + checkedIn) / total) * 100).toFixed(1))
        : 0;

    const kpis = {
      total,
      completed,
      cancelled,
      pending,
      confirmed,
      checkedIn,
      noShow,
      archived,
      uniquePatients: uniqueMobiles.size,
      conversionRate,
    };

    const trends = Object.values(dateMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const statusBreakdown = [
      { name: 'Pending', value: pending, key: 'pending' },
      { name: 'Confirmed', value: confirmed, key: 'confirmed' },
      { name: 'Checked-in', value: checkedIn, key: 'checked-in' },
      { name: 'Completed', value: completed, key: 'completed' },
      { name: 'Cancelled', value: cancelled, key: 'cancelled' },
      { name: 'No-show', value: noShow, key: 'no-show' },
    ];

    const sources = Object.values(sourceMap).sort((a, b) => b.total - a.total);

    const officers = Object.values(officerMap)
      .map((entry) => ({
        ...entry,
        conversionRate:
          entry.total > 0
            ? ((entry.completed / entry.total) * 100).toFixed(1)
            : '0.0',
      }))
      .sort((a, b) => b.total - a.total);

    return {
      kpis,
      trends,
      statusBreakdown,
      sources,
      officers,
      fetchedAt: new Date().toISOString(),
      dateRange,
    };
  } catch (error) {
    console.error('❌ getAllAnalyticsData error:', error);
    throw error;
  }
}

// ==================================================
// ✅ LEGACY: Individual functions (kept for backward compat)
// These are still used by existing components if any
// ==================================================
export async function getOverviewKPIs(hospitalId, dateRange) {
  const result = await getAllAnalyticsData(hospitalId, dateRange);
  return result?.kpis || null;
}

export async function getBookingTrends(hospitalId, dateRange) {
  const result = await getAllAnalyticsData(hospitalId, dateRange);
  return result?.trends || [];
}

export async function getStatusBreakdown(hospitalId, dateRange) {
  const result = await getAllAnalyticsData(hospitalId, dateRange);
  return result?.statusBreakdown || [];
}

export async function getMarketingSources(hospitalId, dateRange) {
  const result = await getAllAnalyticsData(hospitalId, dateRange);
  return result?.sources || [];
}

export async function getOfficerPerformance(hospitalId, dateRange) {
  const result = await getAllAnalyticsData(hospitalId, dateRange);
  return result?.officers || [];
}

// ==================================================
// ✅ GA4 Metrics (server-side proxy)
// ==================================================
export async function getGA4Metrics(hospitalId, dateRange) {
  if (!hospitalId) return null;

  try {
    const url = new URL(`${API_BASE_URL}/api/analytics/ga4`);
    url.searchParams.set('hospitalId', hospitalId);
    url.searchParams.set('startDate', dateRange.start);
    url.searchParams.set('endDate', dateRange.end);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'GA4 fetch failed');
    }

    return data.data;
  } catch (error) {
    console.error('❌ getGA4Metrics error:', error);
    return null;
  }
}

// ==================================================
// ✅ Default export
// ==================================================
export default {
  getDateRangeFromPreset,
  getPreviousPeriodRange,
  getBDTodayString,
  getAllAnalyticsData,
  getOverviewKPIs,
  getBookingTrends,
  getStatusBreakdown,
  getMarketingSources,
  getOfficerPerformance,
  getGA4Metrics,
};