// src/components/doctor/DoctorPatientList.jsx
// ==================================================
// 👥 Doctor Patient List — Safe fields only
// ==================================================
// ✅ Search by name/serial
// ✅ Date & status filters
// ✅ Pagination
// ✅ NO mobile, NO referral
// ==================================================

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
} from 'lucide-react';

const CSS = `
  .dpl-container {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }
  .dpl-header {
    padding: 18px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }
  .dpl-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }
  .dpl-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .dpl-search {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0 10px;
    min-width: 220px;
  }
  .dpl-search input {
    border: none;
    background: transparent;
    outline: none;
    padding: 8px 6px;
    font-size: 13.5px;
    font-family: inherit;
    width: 100%;
    color: #1e293b;
  }
  .dpl-select {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    background: #fff;
    color: #1e293b;
    cursor: pointer;
  }
  .dpl-btn-reset {
    padding: 8px 14px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .dpl-btn-reset:hover {
    background: #e2e8f0;
  }

  /* Table */
  .dpl-table-wrap {
    overflow-x: auto;
  }
  .dpl-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
    min-width: 900px;
  }
  .dpl-table thead {
    background: #f8fafc;
  }
  .dpl-table th {
    padding: 11px 12px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }
  .dpl-table td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }
  .dpl-table tbody tr:hover {
    background: #f8fafc;
  }

  .dpl-serial {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #eff6ff;
    color: #1c5fa8;
    font-weight: 800;
    font-size: 13px;
    padding: 0 8px;
  }
  .dpl-name {
    font-weight: 700;
    color: #1e293b;
  }
  .dpl-name-en {
    font-size: 11.5px;
    color: #64748b;
    font-style: italic;
  }
  .dpl-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }
  .dpl-empty {
    padding: 60px 20px;
    text-align: center;
    color: #64748b;
  }
  .dpl-empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  /* Pagination */
  .dpl-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 13px;
    color: #475569;
    flex-wrap: wrap;
    gap: 10px;
  }
  .dpl-page-controls {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .dpl-page-btn {
    padding: 6px 12px;
    border: 1px solid #cbd5e1;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 600;
    color: #475569;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .dpl-page-btn:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #1c5fa8;
    color: #1c5fa8;
  }
  .dpl-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .dpl-page-info {
    font-weight: 600;
    color: #1e293b;
  }

  /* Status colors */
  .st-pending { background: #fef3c7; color: #92400e; }
  .st-confirmed { background: #dbeafe; color: #1e40af; }
  .st-checked-in { background: #ede9fe; color: #6d28d9; }
  .st-completed { background: #dcfce7; color: #166534; }
  .st-cancelled { background: #fee2e2; color: #991b1b; }
  .st-no-show { background: #f3f4f6; color: #4b5563; }
  .st-default { background: #f1f5f9; color: #475569; }

  @media (max-width: 640px) {
    .dpl-header { padding: 14px 16px; }
    .dpl-search { min-width: 160px; }
    .dpl-pagination { padding: 12px 16px; }
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

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Approved' },
  { value: 'checked-in', label: 'Attended' },
  { value: 'completed', label: 'Doctor Seen' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No-Show' },
];

const PAGE_SIZE = 15;

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const cls = `dpl-badge st-${s}`;
  const label = STATUS_LABELS[s] || status;
  return <span className={cls}>{label}</span>;
}

export default function DoctorPatientList({
  appointments = [],
  initialStatus = 'all',
  initialDate = '',
  showDateFilter = true,
  title = 'My Patients',
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [page, setPage] = useState(1);
  const [viewDetails, setViewDetails] = useState(null);

  // ✅ Unique dates for dropdown
  const uniqueDates = useMemo(() => {
    const set = new Set();
    appointments.forEach((a) => {
      if (a.bookingDate) set.add(a.bookingDate);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [appointments]);

  // ✅ Filter
  const filtered = useMemo(() => {
    let result = appointments;

    if (dateFilter) {
      result = result.filter((a) => a.bookingDate === dateFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'upcoming') {
        // ✅ Upcoming = confirmed but not yet checked-in
        result = result.filter(
          (a) =>
            (a.status || '').toLowerCase() === 'confirmed'
        );
      } else {
        result = result.filter(
          (a) => (a.status || '').toLowerCase() === statusFilter
        );
      }
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          (a.name || '').toLowerCase().includes(term) ||
          (a.nameEn || '').toLowerCase().includes(term) ||
          String(a.serialNo || '').includes(term)
      );
    }

    return result;
  }, [appointments, dateFilter, statusFilter, search]);

  // ✅ Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleReset = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('');
    setPage(1);
  };

  const hasActiveFilter =
    search || statusFilter !== 'all' || dateFilter;

  return (
    <>
      <style>{CSS}</style>
      <div className="dpl-container">
        {/* Header */}
        <div className="dpl-header">
          <h3 className="dpl-title">
            {title} ({filtered.length})
          </h3>
          <div className="dpl-filters">
            <div className="dpl-search">
              <Search size={15} color="#64748b" />
              <input
                type="text"
                placeholder="নাম / সিরিয়াল..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="dpl-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {showDateFilter && (
              <select
                className="dpl-select"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Dates</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilter && (
              <button className="dpl-btn-reset" onClick={handleReset}>
                <X size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="dpl-empty">
            <div className="dpl-empty-icon">📭</div>
            <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              কোনো রেকর্ড পাওয়া যায়নি
            </p>
            <p style={{ fontSize: 12.5, color: '#94a3b8' }}>
              ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
            </p>
          </div>
        ) : (
          <div className="dpl-table-wrap">
            <table className="dpl-table">
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="dpl-serial">
                        #{a.serialNo || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="dpl-name">{a.name || '-'}</div>
                      {a.nameEn && a.nameEn !== a.name && (
                        <div className="dpl-name-en">{a.nameEn}</div>
                      )}
                    </td>
                    <td>{a.age || '-'}</td>
                    <td>{a.bookingDate || '-'}</td>
                    <td>{a.doctorTime || '-'}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setViewDetails(a)}
                        title="বিস্তারিত"
                        style={{
                          background: '#eff6ff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#1c5fa8',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="dpl-pagination">
            <span>
              Showing{' '}
              <span className="dpl-page-info">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              of <span className="dpl-page-info">{filtered.length}</span>
            </span>
            <div className="dpl-page-controls">
              <button
                className="dpl-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="dpl-page-info">
                {currentPage} / {totalPages}
              </span>
              <button
                className="dpl-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setViewDetails(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, color: '#1c5fa8', fontSize: 17 }}>
                Patient Details
              </h3>
              <button
                onClick={() => setViewDetails(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                fontSize: 13.5,
              }}
            >
              <DetailRow label="Serial" value={`#${viewDetails.serialNo || '-'}`} />
              <DetailRow label="Name" value={viewDetails.name || '-'} />
              <DetailRow label="English Name" value={viewDetails.nameEn || '-'} />
              <DetailRow label="Age" value={viewDetails.age || '-'} />
              <DetailRow label="Gender" value={viewDetails.gender || '-'} />
              <DetailRow label="Date" value={viewDetails.bookingDate || '-'} />
              <DetailRow label="Day" value={viewDetails.bookingDay || '-'} />
              <DetailRow label="Time" value={viewDetails.doctorTime || '-'} />
              <DetailRow label="Department" value={viewDetails.doctorDept || '-'} />
              <div style={{ gridColumn: '1/-1' }}>
                <strong style={{ color: '#475569' }}>Status:</strong>{' '}
                <StatusBadge status={viewDetails.status} />
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '10px 12px',
                background: '#eff6ff',
                borderRadius: 8,
                fontSize: 12,
                color: '#1e40af',
              }}
            >
              🔒 Privacy: Mobile, referral তথ্য শুধু admin দেখতে পারেন
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <strong style={{ color: '#475569', display: 'block', fontSize: 11.5 }}>
        {label}
      </strong>
      <span style={{ color: '#1e293b', fontWeight: 600 }}>{value}</span>
    </div>
  );
}