// src/components/ui/SkeletonScreens.jsx
import React from 'react';
import { Skeleton } from './Skeleton';

// ==================================================
// 🎯 ১. App-level Skeleton (DoctorPanelBuilder এর জন্য)
// ==================================================
export function AppShellSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f6fa',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
      }}
    >
      {/* Topbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #e2e6ee',
          padding: '14px 20px',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Skeleton width={24} height={24} circle />
          <Skeleton width={140} height={18} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton width={140} height={36} style={{ borderRadius: 10 }} />
          <Skeleton width={100} height={36} style={{ borderRadius: 10 }} />
          <Skeleton width={90} height={36} style={{ borderRadius: 10 }} />
          <Skeleton width={90} height={36} style={{ borderRadius: 10 }} />
        </div>
      </div>

      {/* Panel switcher */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 20px',
          background: '#fff',
          borderBottom: '1px solid #e2e6ee',
        }}
      >
        {[80, 90, 85, 100, 75].map((w, i) => (
          <Skeleton key={i} width={w} height={28} style={{ borderRadius: 20 }} />
        ))}
      </div>

      {/* Content area */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Section 1 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e6ee',
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <Skeleton width={180} height={18} style={{ marginBottom: 10 }} />
          <Skeleton width="70%" height={12} style={{ marginBottom: 14 }} />
          <Skeleton width="100%" height={38} style={{ borderRadius: 9 }} />
        </div>

        {/* Section 2 - Dept cards */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e6ee',
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <Skeleton width={220} height={18} style={{ marginBottom: 16 }} />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e2e6ee',
                borderLeft: '5px solid #dde4ec',
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Skeleton width={32} height={32} style={{ borderRadius: 8 }} />
                <Skeleton width={140} height={16} />
                <Skeleton width={70} height={22} style={{ borderRadius: 20 }} />
              </div>
              {[0, 1].map((j) => (
                <div key={j} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center' }}>
                  <Skeleton width={18} height={18} style={{ borderRadius: 4 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="40%" height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="25%" height={20} style={{ borderRadius: 20 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// 🎯 ২. Overview / Dashboard Skeleton
// ==================================================
export function OverviewSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="55%" height={12} />
              <Skeleton width={40} height={40} style={{ borderRadius: 10 }} />
            </div>
            <Skeleton width="40%" height={30} />
          </div>
        ))}
      </div>

      {/* Conversion Card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <Skeleton width={180} height={18} style={{ marginBottom: 20 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ borderLeft: '4px solid #e2e8f0', paddingLeft: 10 }}>
              <Skeleton width="80%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={24} />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      {[0, 1].map((row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {[0, 1].map((col) => (
            <div
              key={col}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <Skeleton width="50%" height={16} style={{ marginBottom: 20 }} />
              <Skeleton width="100%" height={250} style={{ borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ==================================================
// 🎯 ৩. Appointments Table Skeleton
// ==================================================
export function AppointmentsTableSkeleton({ rows = 6 }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        padding: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <Skeleton width={180} height={22} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton width={180} height={36} style={{ borderRadius: 8 }} />
          <Skeleton width={120} height={36} style={{ borderRadius: 8 }} />
          <Skeleton width={120} height={36} style={{ borderRadius: 8 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, minmax(100px, 1fr))',
            gap: 12,
            paddingBottom: 12,
            borderBottom: '1px solid #e2e8f0',
            marginBottom: 8,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} width="80%" height={14} />
          ))}
        </div>

        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, minmax(100px, 1fr))',
              gap: 12,
              padding: '14px 0',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {Array.from({ length: 10 }).map((_, c) => (
              <Skeleton
                key={c}
                width={c === 0 ? '40%' : c === 8 ? '60%' : '85%'}
                height={14}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================================================
// 🎯 ৪. Queue Display Skeleton (TV)
// ==================================================
export function QueueDisplaySkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '20px 28px',
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          padding: '18px 24px',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e9edf2',
        }}
      >
        <Skeleton width={150} height={150} style={{ margin: '0 auto 12px' }} />
        <Skeleton width={400} height={28} style={{ margin: '0 auto' }} />
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 22,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #e9edf2',
              minHeight: 340,
            }}
          >
            <Skeleton width="70%" height={30} style={{ marginBottom: 12 }} />
            <Skeleton width="50%" height={18} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={90} style={{ borderRadius: 12, marginBottom: 20 }} />
            <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} width="100%" height={40} style={{ marginBottom: 8, borderRadius: 10 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================================================
// 🎯 ৫. Simple List Skeleton (for modals)
// ==================================================
export function SimpleListSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
          <Skeleton width="30%" height={16} />
          <Skeleton width="20%" height={16} />
          <Skeleton width="25%" height={16} />
        </div>
      ))}
    </div>
  );
}