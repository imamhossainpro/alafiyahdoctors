// src/components/patient/BookingCard.jsx
// ==================================================
// 🎫 BookingCard — Modern patient booking display
// ==================================================
// ✅ Serial number badge (big & bold)
// ✅ Status badge with color
// ✅ Quick info grid
// ✅ Status timeline
// ✅ Expandable details
// ✅ QR button (only if onShowQR is passed)
// ==================================================
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Stethoscope,
  Hash,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  QrCode,
  Building2,
  Ticket,
  FileText,
} from 'lucide-react';
import StatusTimeline from './StatusTimeline';

// ==================================================
// ✅ Status styles
// ==================================================
const STATUS_STYLES = {
  pending: {
    bg: '#fef3c7',
    color: '#92400e',
    label: 'অপেক্ষমাণ',
    border: '#fde68a',
  },
  confirmed: {
    bg: '#dbeafe',
    color: '#1e40af',
    label: 'নিশ্চিত',
    border: '#93c5fd',
  },
  'checked-in': {
    bg: '#ede9fe',
    color: '#6d28d9',
    label: 'চেক-ইন',
    border: '#c4b5fd',
  },
  completed: {
    bg: '#dcfce7',
    color: '#166534',
    label: 'সম্পন্ন',
    border: '#86efac',
  },
  cancelled: {
    bg: '#fee2e2',
    color: '#991b1b',
    label: 'বাতিল',
    border: '#fca5a5',
  },
  'no-show': {
    bg: '#f3f4f6',
    color: '#4b5563',
    label: 'অনুপস্থিত',
    border: '#d1d5db',
  },
};

// ==================================================
// ✅ Date format helper
// ==================================================
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('bn-BD', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function BookingCard({ booking, onShowQR }) {
  const [expanded, setExpanded] = useState(false);

  if (!booking) return null;

  const status = booking.status || 'pending';
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const isActive = !['completed', 'cancelled', 'no-show'].includes(status);

  // ✅ QR button দেখাবে কি না
  const showQRButton =
    onShowQR && (status === 'confirmed' || status === 'pending');

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: isActive
          ? '0 4px 20px rgba(28,95,168,0.08)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
      }}
    >
      {/* ==================================================
          Header
          ================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1c5fa8 0%, #4fa3d1 100%)',
          padding: '20px 22px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* Serial badge */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                opacity: 0.9,
                fontWeight: '600',
                marginBottom: '1px',
              }}
            >
              সিরিয়াল
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: '800',
                lineHeight: 1,
              }}
            >
              {booking.serialNo || '-'}
            </div>
          </div>

          {/* Doctor info */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '19px',
                fontWeight: '800',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {booking.doctorName || 'ডাক্তার'}
            </div>
            <div
              style={{
                fontSize: '13px',
                opacity: 0.9,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {booking.doctorDept || 'বিভাগ'} ·{' '}
              {formatDate(booking.bookingDate)}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            padding: '6px 14px',
            background: style.bg,
            color: style.color,
            borderRadius: '20px',
            fontSize: '12.5px',
            fontWeight: '700',
            border: `1.5px solid ${style.border}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {style.label}
        </div>
      </div>

      {/* ==================================================
          Quick info grid
          ================================================== */}
      <div
        style={{
          padding: '16px 22px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '14px',
          }}
        >
          <InfoRow
            icon={Calendar}
            label="তারিখ"
            value={formatDate(booking.bookingDate)}
          />
          <InfoRow
            icon={Clock}
            label="সময়"
            value={booking.doctorTime || 'নির্ধারিত'}
          />
          <InfoRow
            icon={Stethoscope}
            label="বিভাগ"
            value={booking.doctorDept || '-'}
          />
          <InfoRow
            icon={Hash}
            label="সিরিয়াল"
            value={`#${booking.serialNo || '-'}`}
          />
        </div>
      </div>

      {/* ==================================================
          Status Timeline
          ================================================== */}
      <div style={{ padding: '16px 22px' }}>
        <StatusTimeline status={status} />
      </div>

      {/* ==================================================
          Action buttons
          ================================================== */}
      <div
        style={{
          padding: '12px 22px 16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        {/* বিস্তারিত দেখুন */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            flex: 1,
            minWidth: '140px',
            padding: '11px 16px',
            background: '#f1f5f9',
            color: '#334155',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = '#e2e8f0')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = '#f1f5f9')
          }
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'কম দেখান' : 'বিস্তারিত দেখুন'}
        </button>

        {/* ✅ QR button — শুধু onShowQR পাস করা হলে */}
        {showQRButton && (
          <button
            onClick={() => onShowQR(booking.id)}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '11px 16px',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'translateY(-2px)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = 'translateY(0)')
            }
          >
            <QrCode size={16} />
            QR কোড
          </button>
        )}
      </div>

      {/* ==================================================
          Expanded details
          ================================================== */}
      {expanded && (
        <div
          style={{
            padding: '18px 22px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            animation: 'slideDown 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <DetailRow
              icon={User}
              label="রোগীর নাম"
              value={booking.name}
            />
            <DetailRow
              icon={Phone}
              label="মোবাইল"
              value={booking.mobile}
            />
            {booking.age && (
              <DetailRow icon={Hash} label="বয়স" value={booking.age} />
            )}
            {booking.gender && (
              <DetailRow
                icon={User}
                label="লিঙ্গ"
                value={booking.gender}
              />
            )}
            {booking.address && (
              <DetailRow
                icon={MapPin}
                label="ঠিকানা"
                value={booking.address}
              />
            )}
            {booking.referralSource && (
              <DetailRow
                icon={Building2}
                label="রেফারেল"
                value={booking.referralSource}
              />
            )}
            {booking.confirmNote && (
              <DetailRow
                icon={Ticket}
                label="বিশেষ নোট"
                value={booking.confirmNote}
                highlight
              />
            )}
          </div>

          {/* Booking ID */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: '#fff',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1',
              fontSize: '12px',
              color: '#64748b',
              fontFamily: 'ui-monospace, Consolas, monospace',
              wordBreak: 'break-all',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileText
              size={14}
              color="#94a3b8"
              style={{ flexShrink: 0 }}
            />
            <span>
              <strong style={{ color: '#1e293b' }}>ID:</strong>{' '}
              {booking.id}
            </span>
          </div>
        </div>
      )}

      {/* Local animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 800px; }
        }
      `}</style>
    </div>
  );
}

// ==================================================
// ✅ Sub-component: Info Row
// ==================================================
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '9px',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color="#1c5fa8" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500',
            marginBottom: '1px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#1e293b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={String(value)}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ Sub-component: Detail Row
// ==================================================
function DetailRow({ icon: Icon, label, value, highlight }) {
  if (!value || value === '-') return null;

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
    >
      <Icon
        size={16}
        color={highlight ? '#d97706' : '#64748b'}
        style={{ marginTop: '3px', flexShrink: 0 }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '11.5px',
            color: '#64748b',
            fontWeight: '500',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: highlight ? '700' : '600',
            color: highlight ? '#92400e' : '#1e293b',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}