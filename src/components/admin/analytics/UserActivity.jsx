// src/components/admin/analytics/UserActivity.jsx
// ==================================================
// 👥 UserActivity — GA4 behavioral metrics
// ==================================================
// ✅ Active users, new users, sessions
// ✅ Top pages
// ✅ Device breakdown
// ✅ No PII (anonymous metrics only)
// ==================================================
import React from 'react';
import {
  Users,
  UserPlus,
  Eye,
  MousePointer,
  Clock,
  AlertCircle,
} from 'lucide-react';

// ==================================================
// ✅ Format duration (seconds → "Xm Ys")
// ==================================================
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// ==================================================
// ✅ Format number with commas
// ==================================================
function formatNumber(num) {
  if (!num && num !== 0) return '—';
  return num.toLocaleString('en-US');
}

// ==================================================
// ✅ Metric Card (small)
// ==================================================
function MetricCard({ label, value, Icon, color, bg }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={18} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '11.5px',
            color: '#64748b',
            fontWeight: '600',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#1e293b',
            lineHeight: '1.1',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ Main Component
// ==================================================
export default function UserActivity({ data, loading, error }) {
  // Loading skeleton
  if (loading) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>👥 User Activity (GA4)</h4>
        <div style={skeletonStyle} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>👥 User Activity (GA4)</h4>
        <div
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fde68a',
          }}
        >
          <AlertCircle size={28} color="#d97706" />
          <p
            style={{
              marginTop: '8px',
              fontSize: '13px',
              color: '#92400e',
              fontWeight: '600',
            }}
          >
            GA4 data unavailable
          </p>
          <p style={{ marginTop: '4px', fontSize: '12px', color: '#a16207' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>👥 User Activity (GA4)</h4>
        <div style={emptyStyle}>
          GA4 data এখনো load হয়নি — refresh করুন
        </div>
      </div>
    );
  }

  const {
    activeUsers = 0,
    newUsers = 0,
    pageViews = 0,
    sessions = 0,
    avgSessionDuration = 0,
    topPages = [],
    devices = [],
  } = data;

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h4 style={{ ...titleStyle, margin: 0 }}>👥 User Activity (GA4)</h4>
        <span
          style={{
            fontSize: '11px',
            background: '#dbeafe',
            color: '#1e40af',
            padding: '3px 10px',
            borderRadius: '12px',
            fontWeight: '600',
          }}
        >
          Behavioral Data
        </span>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <MetricCard
          label="Active Users"
          value={formatNumber(activeUsers)}
          Icon={Users}
          color="#1c5fa8"
          bg="rgba(28, 95, 168, 0.1)"
        />
        <MetricCard
          label="New Users"
          value={formatNumber(newUsers)}
          Icon={UserPlus}
          color="#0d9488"
          bg="rgba(13, 148, 136, 0.1)"
        />
        <MetricCard
          label="Page Views"
          value={formatNumber(pageViews)}
          Icon={Eye}
          color="#8b5cf6"
          bg="rgba(139, 92, 246, 0.1)"
        />
        <MetricCard
          label="Sessions"
          value={formatNumber(sessions)}
          Icon={MousePointer}
          color="#d97706"
          bg="rgba(217, 119, 6, 0.1)"
        />
        <MetricCard
          label="Avg Session"
          value={formatDuration(avgSessionDuration)}
          Icon={Clock}
          color="#16a34a"
          bg="rgba(22, 163, 74, 0.1)"
        />
      </div>

      {/* Two column: Top Pages + Devices */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Top Pages */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '10px',
            }}
          >
            📄 Top Pages
          </div>
          {topPages.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94a3b8', padding: '10px 0' }}>
              কোনো page data নেই
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topPages.slice(0, 6).map((page, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12.5px',
                    padding: '5px 8px',
                    background: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      color: '#334155',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      marginRight: '10px',
                    }}
                    title={page.path}
                  >
                    {page.path}
                  </span>
                  <span
                    style={{
                      fontWeight: '700',
                      color: '#1c5fa8',
                      flexShrink: 0,
                    }}
                  >
                    {formatNumber(page.views)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '10px',
            }}
          >
            📱 Device Breakdown
          </div>
          {devices.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94a3b8', padding: '10px 0' }}>
              কোনো device data নেই
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {devices.map((device, idx) => {
                const total = devices.reduce((sum, d) => sum + d.users, 0);
                const pct = total > 0 ? ((device.users / total) * 100).toFixed(0) : 0;
                const icons = {
                  mobile: '📱',
                  desktop: '💻',
                  tablet: '📟',
                };
                const icon = icons[device.category] || '🔵';
                return (
                  <div key={idx} style={{ fontSize: '13px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#334155', textTransform: 'capitalize' }}>
                        {icon} {device.category}
                      </span>
                      <span style={{ fontWeight: '700', color: '#1c5fa8' }}>
                        {formatNumber(device.users)} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        background: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background:
                            device.category === 'mobile'
                              ? '#1c5fa8'
                              : device.category === 'desktop'
                              ? '#0d9488'
                              : '#8b5cf6',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: '14px',
          padding: '8px 12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '11.5px',
          color: '#0369a1',
        }}
      >
        💡 এই data Google Analytics 4 থেকে আসছে — behavioral metrics (anonymous)
      </div>
    </div>
  );
}

// ==================================================
// ✅ Styles
// ==================================================
const cardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

const titleStyle = {
  margin: '0 0 16px 0',
  fontSize: '15px',
  color: '#1e293b',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#94a3b8',
  fontSize: '13px',
};

const skeletonStyle = {
  height: '260px',
  background: '#f1f5f9',
  borderRadius: '8px',
  animation: 'pulse 1.5s ease-in-out infinite',
};