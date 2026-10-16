// src/components/admin/analytics/KPICards.jsx
// ==================================================
// 📊 KPICards — Overview metric cards (Phase 1)
// ==================================================
// ✅ 6 KPI cards with previous-period comparison (delta)
// ✅ Loading skeleton
// ✅ Empty state
// ==================================================
import React from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

// ==================================================
// ✅ Single KPI Card (with delta support)
// ==================================================
function KPICard({
  label,
  value,
  sublabel,
  color,
  bg,
  Icon,
  delta,
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      {/* Label + Icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#64748b',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {Icon && <Icon size={18} />}
        </div>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '28px',
          fontWeight: '800',
          color: color,
          lineHeight: '1.1',
        }}
      >
        {value}
      </div>

      {/* Delta indicator (vs previous period) */}
      {delta && delta.pct > 0 && (
        <div
          style={{
            fontSize: '11.5px',
            color: delta.dir === 'up' ? '#16a34a' : '#dc2626',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          {delta.dir === 'up' ? '▲' : '▼'} {delta.pct}%
          <span style={{ color: '#94a3b8', fontWeight: '400' }}>
            vs previous period
          </span>
        </div>
      )}

      {/* Sublabel */}
      {sublabel && (
        <div
          style={{
            fontSize: '11.5px',
            color: '#94a3b8',
            fontWeight: '500',
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ==================================================
// ✅ KPICards — Main Component
// ==================================================
export default function KPICards({ kpis, loading }) {
  // ==================================================
  // ✅ Loading skeleton
  // ==================================================
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px',
              height: '130px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                height: '14px',
                width: '60%',
                background: '#f1f5f9',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '28px',
                width: '40%',
                background: '#f1f5f9',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '10px',
                width: '70%',
                background: '#f1f5f9',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // ==================================================
  // ✅ Empty state
  // ==================================================
  if (!kpis) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center',
          color: '#64748b',
          marginBottom: '20px',
        }}
      >
        <AlertCircle size={32} color="#cbd5e1" />
        <p style={{ marginTop: '8px', fontWeight: '600' }}>
          কোনো ডেটা পাওয়া যায়নি
        </p>
      </div>
    );
  }

  // ==================================================
  // ✅ Card definitions (with delta)
  // ==================================================
  const total = kpis.total || 0;
  const completed = kpis.completed || 0;
  const cancelled = kpis.cancelled || 0;
  const pending = kpis.pending || 0;
  const checkedIn = kpis.checkedIn || 0;
  const conversionRate = kpis.conversionRate || 0;
  const uniquePatients = kpis.uniquePatients || 0;
  const deltas = kpis.deltas || {};

  const cards = [
    {
      label: 'Total Bookings',
      value: total,
      sublabel: `${uniquePatients} unique patients`,
      color: '#1c5fa8',
      bg: 'rgba(28, 95, 168, 0.1)',
      Icon: CalendarCheck,
      delta: deltas.total,
    },
    {
      label: 'Completed',
      value: completed,
      sublabel: `${((completed / (total || 1)) * 100).toFixed(1)}% of total`,
      color: '#16a34a',
      bg: 'rgba(22, 163, 74, 0.1)',
      Icon: CheckCircle2,
      delta: deltas.completed,
    },
    {
      label: 'Cancelled',
      value: cancelled,
      sublabel: `${((cancelled / (total || 1)) * 100).toFixed(1)}% of total`,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)',
      Icon: XCircle,
      delta: deltas.cancelled,
    },
    {
      label: 'Pending',
      value: pending,
      sublabel: 'Awaiting confirmation',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)',
      Icon: Clock,
      delta: deltas.pending,
    },
    {
      label: 'Checked-in',
      value: checkedIn,
      sublabel: 'Currently at hospital',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      Icon: Users,
      delta: deltas.checkedIn,
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      sublabel: '(Completed + Checked-in) / Total',
      color: '#0d9488',
      bg: 'rgba(13, 148, 136, 0.1)',
      Icon: TrendingUp,
      delta: deltas.conversionRate,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {cards.map((card, i) => (
        <KPICard key={i} {...card} />
      ))}
    </div>
  );
}