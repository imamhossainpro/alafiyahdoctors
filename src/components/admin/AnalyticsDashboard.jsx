// src/components/admin/AnalyticsDashboard.jsx
// ==================================================
// 📊 AnalyticsDashboard — Phase 2 (GA4 Integration)
// ==================================================
// ✅ Single-fetch (getAllAnalyticsData)
// ✅ Previous-period comparison
// ✅ Last updated timestamp
// ✅ Timezone-aware (Asia/Dhaka)
// ✅ GA4 User Activity section
// ==================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  BarChart3,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { usePermission } from '../../context/PermissionContext';
import {
  getDateRangeFromPreset,
  getPreviousPeriodRange,
  getAllAnalyticsData,
  getGA4Metrics,
} from '../../services/analyticsService';
import KPICards from './analytics/KPICards';
import DateFilter from './analytics/DateFilter';
import BookingTrends from './analytics/BookingTrends';
import StatusBreakdown from './analytics/StatusBreakdown';
import MarketingSources from './analytics/MarketingSources';
import OfficerPerformance from './analytics/OfficerPerformance';
import UserActivity from './analytics/UserActivity';

// ==================================================
// ✅ Format last updated time
// ==================================================
function formatLastUpdated(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Dhaka',
    });
  } catch {
    return '—';
  }
}

// ==================================================
// ✅ Main Component
// ==================================================
export default function AnalyticsDashboard({ user }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { can } = usePermission();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Firestore data
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);

  // ✅ GA4 data
  const [ga4Data, setGa4Data] = useState(null);
  const [ga4Loading, setGa4Loading] = useState(true);
  const [ga4Error, setGa4Error] = useState(null);

  // Date filter state
  const [preset, setPreset] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ==================================================
  // ✅ Load all data (Firestore + GA4)
  // ==================================================
  const loadAllData = useCallback(async () => {
    if (!hospitalId) return;

    setLoading(true);
    setError(null);
    setGa4Loading(true);
    setGa4Error(null);

    const currentRange = {
      start: startDate || getDateRangeFromPreset(preset).start,
      end: endDate || getDateRangeFromPreset(preset).end,
    };

    const previousRange = getPreviousPeriodRange(currentRange);

    try {
      // ✅ Firestore fetch (parallel: current + previous)
      const [currentResult, previousResult] = await Promise.all([
        getAllAnalyticsData(hospitalId, currentRange),
        getAllAnalyticsData(hospitalId, previousRange),
      ]);

      setData(currentResult);
      setPrevData(previousResult);
    } catch (err) {
      console.error('❌ Analytics load error:', err);
      setError(err.message || 'ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }

    // ✅ GA4 fetch (separate — fail করলেও dashboard কাজ করবে)
    try {
      const ga4Result = await getGA4Metrics(hospitalId, currentRange);
      if (ga4Result) {
        setGa4Data(ga4Result);
      } else {
        setGa4Error('GA4 data unavailable');
      }
    } catch (err) {
      console.error('❌ GA4 load error:', err);
      setGa4Error(err.message || 'GA4 data load failed');
    } finally {
      setGa4Loading(false);
    }
  }, [hospitalId, preset, startDate, endDate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sync preset to dates
  useEffect(() => {
    if (preset !== 'custom') {
      const range = getDateRangeFromPreset(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [preset]);

  // ==================================================
  // ✅ Prepare KPI data with deltas
  // ==================================================
  const kpisWithDelta = useMemo(() => {
    if (!data?.kpis) return null;
    if (!prevData?.kpis) return data.kpis;

    const cur = data.kpis;
    const prev = prevData.kpis;

    const calcDelta = (curr, prevVal) => {
      if (prevVal === 0 && curr === 0) return null;
      if (prevVal === 0) return { pct: 100, dir: 'up' };
      const pct = (((curr - prevVal) / prevVal) * 100).toFixed(1);
      return {
        pct: Math.abs(parseFloat(pct)),
        dir: curr >= prevVal ? 'up' : 'down',
      };
    };

    return {
      ...cur,
      deltas: {
        total: calcDelta(cur.total, prev.total),
        completed: calcDelta(cur.completed, prev.completed),
        cancelled: calcDelta(cur.cancelled, prev.cancelled),
        pending: calcDelta(cur.pending, prev.pending),
        checkedIn: calcDelta(cur.checkedIn, prev.checkedIn),
        conversionRate: calcDelta(cur.conversionRate, prev.conversionRate),
      },
    };
  }, [data, prevData]);

  // ==================================================
  // ✅ Permission check
  // ==================================================
  const hasAccess =
    can('dashboard.view') ||
    can('statistics.view') ||
    user?.role === 'admin';

  if (!hasAccess) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '60px 20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>
          Access Denied
        </h3>
        <p style={{ color: '#64748b' }}>
          আপনার Analytics ড্যাশবোর্ড দেখার permission নেই।
        </p>
      </div>
    );
  }

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <div
      style={{
        background: '#f9fafb',
        padding: '20px',
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <BarChart3 size={24} color="#1c5fa8" />
            Analytics Dashboard
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            Real-time analytics from Firestore + GA4
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Last Updated */}
          {data?.fetchedAt && (
            <div
              style={{
                fontSize: '11.5px',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '5px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Clock size={12} />
              Last: {formatLastUpdated(data.fetchedAt)}
            </div>
          )}

          <button
            type="button"
            onClick={loadAllData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#cbd5e1' : '#1c5fa8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="spin" />
                লোড হচ্ছে...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                রিফ্রেশ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State (Firestore) */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Date Filter */}
      <DateFilter
        preset={preset}
        onPresetChange={setPreset}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* KPI Cards */}
      <KPICards kpis={kpisWithDelta} loading={loading} />

      {/* Charts Row 1: Trends + Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <BookingTrends data={data?.trends || []} loading={loading} />
        <StatusBreakdown data={data?.statusBreakdown || []} loading={loading} />
      </div>

      {/* Marketing Sources */}
      <MarketingSources data={data?.sources || []} loading={loading} />

      {/* Officer Performance */}
      <OfficerPerformance data={data?.officers || []} loading={loading} />

      {/* ✅ NEW: User Activity (GA4) */}
      <UserActivity
        data={ga4Data}
        loading={ga4Loading}
        error={ga4Error}
      />

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}