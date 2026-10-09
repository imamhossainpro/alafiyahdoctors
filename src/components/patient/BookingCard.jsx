// src/components/patient/BookingCard.jsx
// ==================================================
// 🎫 BookingCard — Color Psychology based design
// ==================================================
// ✅ Status অনুযায়ী ভিন্ন header gradient
// ✅ Status অনুযায়ী badge color
// ✅ Status অনুযায়ী shadow intensity
// ✅ Serial number badge status-colored
// ✅ Expandable details
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
} from 'lucide-react';
import StatusTimeline from './StatusTimeline';

// ==================================================
// ✅ Status styles — Color Psychology
// ==================================================
const STATUS_STYLES = {
  pending: {
    // 🟦 অপেক্ষা — শান্ত, প্রতীক্ষা
    label: 'অপেক্ষমাণ',
    headerGradient: 'linear-gradient(135deg, #1c5fa8 0%, #4fa3d1 100%)',
    headerText: '#fff',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
    badgeBorder: '#fde68a',
    serialBg: 'rgba(255,255,255,0.2)',
    serialBorder: 'rgba(255,255,255,0.4)',
    shadow: '0 4px 20px rgba(28,95,168,0.12)',
    accentColor: '#1c5fa8',
    icon: Clock3,
  },
  confirmed: {
    // 🟩 নিশ্চিত — নিরাপত্তা, সম্মতি
    label: 'নিশ্চিত',
    headerGradient: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
    headerText: '#fff',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    badgeBorder: '#86efac',
    serialBg: 'rgba(255,255,255,0.2)',
    serialBorder: 'rgba(255,255,255,0.4)',
    shadow: '0 4px 20px rgba(22,163,74,0.15)',
    accentColor: '#16a34a',
    icon: CheckCircle2,
  },
  'checked-in': {
    // 🟪 চেক-ইন — প্রস্তুতি
    label: 'চেক-ইন',
    headerGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    headerText: '#fff',
    badgeBg: '#ede9fe',
    badgeColor: '#6d28d9',
    badgeBorder: '#c4b5fd',
    serialBg: 'rgba(255,255,255,0.2)',
    serialBorder: 'rgba(255,255,255,0.4)',
    shadow: '0 4px 20px rgba(124,58,237,0.15)',
    accentColor: '#7c3aed',
    icon: User,
  },
  completed: {
    // 🟢 সম্পন্ন — সাফল্য
    label: 'সম্পন্ন',
    headerGradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    headerText: '#fff',
    badgeBg: '#dcfce7',
    badgeColor: '#065f46',
    badgeBorder: '#10b981',
    serialBg: 'rgba(255,255,255,0.2)',
    serialBorder: 'rgba(255,255,255,0.4)',
    shadow: '0 2px 12px rgba(6,95,70,0.12)',
    accentColor: '#065f46',
    icon: CheckCircle2,
  },
  cancelled: {
    // 🟥 বাতিল — বিপদ, সতর্কতা
    label: 'বাতিল',
    headerGradient: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
    headerText: '#fff',
    badgeBg: '#fee2e2',
    badgeColor: '#991b1b',
    badgeBorder: '#fca5a5',
    serialBg: 'rgba(255,255,255,0.2)',
    serialBorder: 'rgba(255,255,255,0.4)',
    shadow: '0 2px 12px rgba(153,27,27,0.12)',
    accentColor: '#dc2626',
    icon: XCircle,
  },
  'no-show': {
    // ⬜ অনুপস্থিত — নিরপেক্ষ
    label: 'অনুপস্থিত',
    headerGradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
    headerText: '#fff',
    badgeBg: '#f3f4f6',
    badgeColor: '#4b5563',
    badgeBorder: '#d1d5db',
    serialBg: 'rgba(255,255,255,0.2)',
    serialBorder: 'rgba(255,255,255,0.4)',
    shadow: '0 2px 8px rgba(0,0,0,0.06)',
    accentColor: '#64748b',
    icon: AlertTriangle,
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
        boxShadow: style.shadow,
        transition: 'all 0.2s ease',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
      }}
    >
      {/* ==================================================
          Header — Status-based gradient
          ================================================== */}
      <div
        style={{
          background: style.headerGradient,
          padding: '20px 22px',
          color: style.headerText,
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
          {/* Serial badge — status color */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '14px',
              background: style.serialBg,
              border: `2px solid ${style.serialBorder}`,
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
            background: style.badgeBg,
            color: style.badgeColor,
            borderRadius: '20px',
            fontSize: '12.5px',
            fontWeight: '700',
            border: `1.5px solid ${style.badgeBorder}`,
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
            accent={style.accentColor}
          />
          <InfoRow
            icon={Clock}
            label="সময়"
            value={booking.doctorTime || 'নির্ধারিত'}
            accent={style.accentColor}
          />
          <InfoRow
            icon={Stethoscope}
            label="বিভাগ"
            value={booking.doctorDept || '-'}
            accent={style.accentColor}
          />
          <InfoRow
            icon={Hash}
            label="সিরিয়াল"
            value={`#${booking.serialNo || '-'}`}
            accent={style.accentColor}
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

        {/* QR button */}
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
function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '9px',
          background: `${accent}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={accent} />
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