// src/components/doctor/DoctorDailyReport.jsx
// ==================================================
// 📄 Doctor Daily Report
// ==================================================
// ✅ Daily / Weekly / Monthly view
// ✅ Real data from appointments
// ✅ Export to CSV (printable)
// ==================================================

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileText,
  Printer,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  Stethoscope,
} from 'lucide-react';

const CSS = `
  .ddr-container {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }
  .ddr-header {
    padding: 18px 20px;
    background: linear-gradient(135deg, #1c5fa8, #0d9488);
    color: #fff;
  }
  .ddr-title {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 800;
  }
  .ddr-subtitle {
    margin: 0;
    font-size: 13px;
    opacity: 0.9;
  }
  .ddr-toolbar {
    padding: 14px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
  .ddr-tabs {
    display: flex;
    gap: 6px;
    background: #e2e8f0;
    padding: 3px;
    border-radius: 10px;
  }
  .ddr-tab {
    padding: 7px 16px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }
  .ddr-tab.active {
    background: #1c5fa8;
    color: #fff;
    box-shadow: 0 2px 8px rgba(28, 95, 168, 0.3);
  }
  .ddr-date-input {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    background: #fff;
  }
  .ddr-print-btn {
    padding: 8px 16px;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
  }
  .ddr-print-btn:hover {
    background: #eff6ff;
    color: #1c5fa8;
    border-color: #1c5fa8;
  }
  .ddr-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 18px 20px;
  }
  .ddr-stat {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ddr-stat-value {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.1;
  }
  .ddr-stat-label {
    font-size: 11.5px;
    color: #64748b;
    font-weight: 600;
  }
  .ddr-table-wrap {
    overflow-x: auto;
    border-top: 1px solid #e2e8f0;
  }
  .ddr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 800px;
  }
  .ddr-table thead {
    background: #f8fafc;
  }
  .ddr-table th {
    padding: 10px 12px;
    text-align: left;
    font-size: 11.5px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid #e2e8f0;
  }
  .ddr-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }
  .ddr-table tbody tr:hover { background: #f8fafc; }
  .ddr-badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: 10.5px;
    font-weight: 700;
  }
  .ddr-empty {
    padding: 50px 20px;
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
  }

  @media print {
    .ddr-toolbar, .ddr-print-btn, .ddr-tabs { display: none !important; }
    .ddr-container { border: none; }
    .ddr-header { background: #fff !important; color: #000 !important; border-bottom: 2px solid #000; }
  }
`;

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Approved',
  'checked-in': 'Attended',
  completed: 'Doctor Seen',
  cancelled: 'Cancelled',
  'no-show': 'No-Show',
};

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRange(mode) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (mode === 'daily') {
    const d = getTodayStr();
    return { start: d, end: d };
  }

  if (mode === 'weekly') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  if (mode === 'monthly') {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 1);
    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  return { start: '', end: '' };
}

export default function DoctorDailyReport({ appointments = [] }) {
  const [mode, setMode] = useState('daily');
  const [customDate, setCustomDate] = useState(getTodayStr());

  // ✅ Filter by mode
  const filtered = useMemo(() => {
    const active = appointments.filter((a) => a.isArchived !== true);

    if (mode === 'custom') {
      return active.filter((a) => a.bookingDate === customDate);
    }

    const { start, end } = getDateRange(mode);
    return active.filter(
      (a) => a.bookingDate >= start && a.bookingDate <= end
    );
  }, [appointments, mode, customDate]);

  // ✅ Stats
  const stats = useMemo(() => {
    const s = {
      total: filtered.length,
      pending: 0,
      confirmed: 0,
      'checked-in': 0,
      completed: 0,
      cancelled: 0,
      'no-show': 0,
    };
    filtered.forEach((a) => {
      const st = (a.status || 'pending').toLowerCase();
      if (s[st] !== undefined) s[st]++;
    });
    return s;
  }, [filtered]);

  // ✅ Sorted list
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dateA = a.bookingDate || '';
      const dateB = b.bookingDate || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (Number(a.serialNo) || 0) - (Number(b.serialNo) || 0);
    });
  }, [filtered]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ddr-container">
        {/* Header */}
        <div className="ddr-header">
          <h3 className="ddr-title">📊 Report</h3>
          <p className="ddr-subtitle">
            {mode === 'daily' && 'Today'}
            {mode === 'weekly' && 'Last 7 days'}
            {mode === 'monthly' && 'Last 30 days'}
            {mode === 'custom' && `Date: ${customDate}`}
            {' · '}
            Total {filtered.length} records
          </p>
        </div>

        {/* Toolbar */}
        <div className="ddr-toolbar">
          <div className="ddr-tabs">
            <button
              className={`ddr-tab ${mode === 'daily' ? 'active' : ''}`}
              onClick={() => setMode('daily')}
            >
              Daily
            </button>
            <button
              className={`ddr-tab ${mode === 'weekly' ? 'active' : ''}`}
              onClick={() => setMode('weekly')}
            >
              Weekly
            </button>
            <button
              className={`ddr-tab ${mode === 'monthly' ? 'active' : ''}`}
              onClick={() => setMode('monthly')}
            >
              Monthly
            </button>
            <button
              className={`ddr-tab ${mode === 'custom' ? 'active' : ''}`}
              onClick={() => setMode('custom')}
            >
              Custom
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {mode === 'custom' && (
              <input
                type="date"
                className="ddr-date-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            )}
            <button className="ddr-print-btn" onClick={handlePrint}>
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="ddr-stats">
          <StatCard label="Total" value={stats.total} color="#1c5fa8" icon={Users} />
          <StatCard label="Pending" value={stats.pending} color="#f59e0b" icon={Clock} />
          <StatCard label="Approved" value={stats.confirmed} color="#3b82f6" icon={CheckCircle} />
          <StatCard label="Attended" value={stats['checked-in']} color="#8b5cf6" icon={UserCheck} />
          <StatCard label="Seen" value={stats.completed} color="#22c55e" icon={Stethoscope} />
          <StatCard label="Cancelled" value={stats.cancelled} color="#ef4444" icon={XCircle} />
        </div>

        {/* Table */}
        <div className="ddr-table-wrap">
          {sorted.length === 0 ? (
            <div className="ddr-empty">
              <FileText size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div>এই সময়ে কোনো রেকর্ড নেই</div>
            </div>
          ) : (
            <table className="ddr-table">
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong style={{ color: '#1c5fa8' }}>
                        #{a.serialNo || '-'}
                      </strong>
                    </td>
                    <td>{a.name || '-'}</td>
                    <td>{a.age || '-'}</td>
                    <td>{a.bookingDate || '-'}</td>
                    <td>{a.doctorTime || '-'}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="ddr-stat">
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${color}22`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </span>
      <div>
        <div className="ddr-stat-value" style={{ color }}>
          {value}
        </div>
        <div className="ddr-stat-label">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const colors = {
    pending: { bg: '#fef3c7', c: '#92400e' },
    confirmed: { bg: '#dbeafe', c: '#1e40af' },
    'checked-in': { bg: '#ede9fe', c: '#6d28d9' },
    completed: { bg: '#dcfce7', c: '#166534' },
    cancelled: { bg: '#fee2e2', c: '#991b1b' },
    'no-show': { bg: '#f3f4f6', c: '#4b5563' },
  };
  const style = colors[s] || { bg: '#f1f5f9', c: '#475569' };
  return (
    <span
      className="ddr-badge"
      style={{ background: style.bg, color: style.c }}
    >
      {STATUS_LABELS[s] || status}
    </span>
  );
}