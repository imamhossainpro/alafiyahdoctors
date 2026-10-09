// src/components/doctor/DoctorSummaryCards.jsx
// ==================================================
// 📊 Doctor Summary Cards — Clickable stats
// ==================================================
// ✅ 8 cards: Total, Pending, Approved, Attended,
//    Doctor Seen, Cancelled, Upcoming, No-Show
// ✅ প্রতিটি card click → filtered patient list
// ==================================================
import React from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  UserCheck,
  Stethoscope,
  XCircle,
  Calendar,
  UserX,
} from 'lucide-react';

// ==================================================
// ✅ Card configuration
// ==================================================
const CARDS = [
  {
    key: 'total',
    label: "Today's Total",
    icon: Users,
    color: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: CheckCircle,
    color: '#1E40AF',
    bg: '#DBEAFE',
  },
  {
    key: 'attended',
    label: 'Attended',
    icon: UserCheck,
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    key: 'doctor_seen',
    label: 'Doctor Seen',
    icon: Stethoscope,
    color: '#16A34A',
    bg: '#DCFCE7',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: '#DC2626',
    bg: '#FEE2E2',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    icon: Calendar,
    color: '#0891B2',
    bg: '#CFFAFE',
  },
  {
    key: 'no-show',
    label: 'No-Show',
    icon: UserX,
    color: '#6B7280',
    bg: '#F3F4F6',
  },
];

// ==================================================
// ✅ Map card key → counts object property
// ==================================================
const getCount = (counts, key) => {
  if (!counts) return 0;
  switch (key) {
    case 'total':
      return counts.total || 0;
    case 'pending':
      return counts.pending || 0;
    case 'approved':
      return counts.confirmed || 0;
    case 'attended':
      return (counts.checkedIn || 0) + (counts.completed || 0);
    case 'doctor_seen':
      return counts.completed || 0;
    case 'cancelled':
      return counts.cancelled || 0;
    case 'upcoming':
      return counts.upcoming || 0;
    case 'no-show':
      return counts.noShow || 0;
    default:
      return 0;
  }
};

// ==================================================
// ✅ Component
// ==================================================
export default function DoctorSummaryCards({ counts, onCardClick }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        const count = getCount(counts, card.key);

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onCardClick && onCardClick(card.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 18px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 6px 16px rgba(15, 23, 42, 0.10)';
              e.currentTarget.style.borderColor = card.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 1px 2px rgba(15, 23, 42, 0.04)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            {/* Left color strip */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: card.color,
              }}
            />

            {/* Icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={22} color={card.color} strokeWidth={2.2} />
            </div>

            {/* Text */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: card.color,
                  lineHeight: 1.1,
                }}
              >
                {count}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}