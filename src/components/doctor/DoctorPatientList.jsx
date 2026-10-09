// src/components/doctor/DoctorPatientList.jsx
// ==================================================
// 👥 Doctor Patient List — with Date + Status filters
// ==================================================
// ✅ URL params থেকে initial filter
// ✅ Filter: আজ / গতকাল / আগামী / গত ৭ দিন / সব
// ✅ Status: total / pending / approved / attended /
//    doctor_seen / cancelled / upcoming / no-show
// ✅ Search by name or serial
// ✅ Safe fields only (no mobile, no referral)
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

// ==================================================
// ✅ Date helpers (Bangladesh timezone)
// ==================================================
const getBDDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 6 * 60 * 60 * 1000);
};

const getTodayStr = () => {
  const d = getBDDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const getYesterdayStr = () => {
  const d = getBDDate();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const getWeekAgoStr = () => {
  const d = getBDDate();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

// ==================================================
// ✅ Filter options
// ==================================================
const DATE_FILTERS = [
  { key: 'all', label: 'সব' },
  { key: 'today', label: 'আজ' },
  { key: 'yesterday', label: 'গতকাল' },
  { key: 'upcoming', label: 'আগামী' },
  { key: 'week', label: 'গত ৭ দিন' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'সব' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'attended', label: 'Attended' },
  { key: 'doctor_seen', label: 'Doctor Seen' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'no-show', label: 'No-Show' },
];

// ==================================================
// ✅ Status badge
// ==================================================
function StatusBadge({ status }) {
  const meta = {
    pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E' },
    confirmed: { label: 'Approved', bg: '#DBEAFE', color: '#1E40AF' },
    'checked-in': { label: 'Attended', bg: '#EDE9FE', color: '#6D28D9' },
    completed: { label: 'Completed', bg: '#DCFCE7', color: '#166534' },
    cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
    'no-show': { label: 'No-Show', bg: '#F3F4F6', color: '#4B5563' },
  }[status] || { label: status || 'Pending', bg: '#F1F5F9', color: '#475569' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: meta.bg,
        color: meta.color,
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  );
}

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function DoctorPatientList({
  appointments = [],
  initialDate,
  showDateFilter = true,
  title = 'My Patients',
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ URL থেকে initial filter নাও
  const urlStatus = searchParams.get('status') || 'all';
  const urlDate = searchParams.get('date') || 'all';

  const [filterStatus, setFilterStatus] = useState(urlStatus);
  const [filterDate, setFilterDate] = useState(
    urlDate !== 'all' ? urlDate : initialDate ? 'today' : 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ URL param change হলে sync
  useEffect(() => {
    const s = searchParams.get('status') || 'all';
    const d = searchParams.get('date') || 'all';
    setFilterStatus(s);
    if (d !== 'all') setFilterDate(d);
  }, [searchParams]);

  // ==================================================
  // ✅ Filtering logic
  // ==================================================
  const filteredAppointments = useMemo(() => {
    let list = Array.isArray(appointments) ? [...appointments] : [];

    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    const weekAgo = getWeekAgoStr();

    // ---------- Date filter ----------
    if (filterDate === 'today') {
      list = list.filter((a) => a.bookingDate === today);
    } else if (filterDate === 'yesterday') {
      list = list.filter((a) => a.bookingDate === yesterday);
    } else if (filterDate === 'upcoming') {
      list = list.filter((a) => a.bookingDate > today);
    } else if (filterDate === 'week') {
      list = list.filter(
        (a) => a.bookingDate >= weekAgo && a.bookingDate <= today
      );
    }

    // ---------- Status filter ----------
    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'approved') {
        list = list.filter((a) => a.status === 'confirmed');
      } else if (filterStatus === 'attended') {
        list = list.filter((a) =>
          ['checked-in', 'completed'].includes(a.status)
        );
      } else if (filterStatus === 'doctor_seen') {
        list = list.filter((a) => a.status === 'completed');
      } else if (filterStatus === 'upcoming') {
        list = list.filter(
          (a) => a.status === 'confirmed' && a.bookingDate > today
        );
      } else {
        list = list.filter((a) => a.status === filterStatus);
      }
    }

    // ---------- Search filter ----------
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.name || '').toLowerCase().includes(term) ||
          String(a.serialNo || '').includes(term)
      );
    }

    // ---------- Sort: date desc → serial asc ----------
    list.sort((a, b) => {
      const dateA = a.bookingDate || '';
      const dateB = b.bookingDate || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (Number(a.serialNo) || 0) - (Number(b.serialNo) || 0);
    });

    return list;
  }, [appointments, filterStatus, filterDate, searchTerm]);

  // ==================================================
  // ✅ URL sync helpers
  // ==================================================
  const updateUrlParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const handleDateClick = (key) => {
    setFilterDate(key);
    updateUrlParam('date', key);
  };

  const handleStatusClick = (key) => {
    setFilterStatus(key);
    updateUrlParam('status', key);
  };

  const handleReset = () => {
    setFilterDate('all');
    setFilterStatus('all');
    setSearchTerm('');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilter =
    filterDate !== 'all' || filterStatus !== 'all' || searchTerm.trim();

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h3
          style={{
            margin: '0 0 4px 0',
            fontSize: 18,
            fontWeight: 800,
            color: '#0F172A',
          }}
        >
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
          নিচের ফিল্টার ব্যবহার করে নির্দিষ্ট রোগী খুঁজে নিন
        </p>
      </div>

      {/* ============ Filter Bar ============ */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Date filter */}
        {showDateFilter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#64748B',
                marginRight: 4,
              }}
            >
              📅 তারিখ:
            </span>
            {DATE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleDateClick(f.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: filterDate === f.key ? '#1D4ED8' : '#E2E8F0',
                  background: filterDate === f.key ? '#1D4ED8' : '#FFFFFF',
                  color: filterDate === f.key ? '#FFFFFF' : '#475569',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: '#64748B',
              marginRight: 4,
            }}
          >
            🏷️ স্ট্যাটাস:
          </span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => handleStatusClick(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filterStatus === f.key ? '#1D4ED8' : '#E2E8F0',
                background: filterStatus === f.key ? '#1D4ED8' : '#FFFFFF',
                color: filterStatus === f.key ? '#FFFFFF' : '#475569',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Reset + Count */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '6px 12px',
              flex: '1 1 240px',
              minWidth: 200,
            }}
          >
            <Search size={15} color="#64748B" />
            <input
              type="text"
              placeholder="নাম বা সিরিয়াল সার্চ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13.5,
                fontFamily: 'inherit',
                padding: '4px 0',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 14px',
                background: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ রিসেট
            </button>
          )}

          <span
            style={{
              fontSize: 13,
              color: '#64748B',
              fontWeight: 600,
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            মোট:{' '}
            <strong style={{ color: '#1D4ED8', fontSize: 15 }}>
              {filteredAppointments.length}
            </strong>
          </span>
        </div>
      </div>

      {/* ============ Empty state ============ */}
      {filteredAppointments.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed #CBD5E1',
            borderRadius: 12,
            padding: '50px 20px',
            textAlign: 'center',
            color: '#94A3B8',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div
            style={{
              fontWeight: 600,
              color: '#475569',
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            এই ফিল্টারে কোনো রোগী পাওয়া যায়নি
          </div>
          <div style={{ fontSize: 13 }}>
            তারিখ বা স্ট্যাটাস পরিবর্তন করে আবার চেষ্টা করুন।
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                marginTop: 16,
                padding: '9px 20px',
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              সব ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      ) : (
        // ============ Table ============
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 640,
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    textAlign: 'left',
                    color: '#475569',
                  }}
                >
                  <th
                    style={{
                      padding: '12px 16px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      width: 90,
                    }}
                  >
                    সিরিয়াল
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>
                    রোগীর নাম
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    তারিখ
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    সময়
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    স্ট্যাটাস
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr
                    key={appt.id}
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 700,
                        color: '#1D4ED8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      #{appt.serialNo || '-'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#0F172A',
                        fontWeight: 600,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {appt.name || '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#475569',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {appt.bookingDate || '—'}
                      {appt.bookingDay && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: '#94A3B8',
                            marginTop: 2,
                          }}
                        >
                          {appt.bookingDay}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#475569',
                        whiteSpace: 'nowrap',
                        fontSize: 12.5,
                      }}
                    >
                      {appt.doctorTime || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}