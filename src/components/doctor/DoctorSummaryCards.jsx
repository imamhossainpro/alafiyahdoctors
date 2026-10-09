// src/components/doctor/DoctorSummaryCards.jsx
// ==================================================
// 📊 Doctor Summary Cards — Dynamic counts (redesigned)
// ==================================================
// ✅ 4 columns × 2 rows (desktop)
// ✅ 2 columns × 4 rows (mobile)
// ✅ Larger cards, better spacing
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

const CSS = `
  .dsc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  @media (max-width: 1100px) {
    .dsc-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 820px) {
    .dsc-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  }
  @media (max-width: 480px) {
    .dsc-grid { grid-template-columns: 1fr; gap: 10px; }
  }

  .dsc-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    min-width: 0;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }

  .dsc-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--accent-color, #1c5fa8);
    opacity: 0.85;
  }

  .dsc-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(28, 95, 168, 0.14);
    border-color: var(--accent-color, #1c5fa8);
  }

  .dsc-card:focus-visible {
    outline: 2px solid var(--accent-color, #1c5fa8);
    outline-offset: 2px;
  }

  .dsc-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dsc-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  }

  .dsc-label {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.2px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dsc-value {
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.5px;
  }
`;

const CARDS = [
  {
    key: 'total',
    label: "Today's Total",
    icon: Users,
    color: '#1c5fa8',
    bg: 'rgba(28, 95, 168, 0.12)',
    filterStatus: 'all',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    filterStatus: 'pending',
  },
  {
    key: 'confirmed',
    label: 'Approved',
    icon: CheckCircle,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    filterStatus: 'confirmed',
  },
  {
    key: 'checkedIn',
    label: 'Attended',
    icon: UserCheck,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    filterStatus: 'checked-in',
  },
  {
    key: 'completed',
    label: 'Doctor Seen',
    icon: Stethoscope,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
    filterStatus: 'completed',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    filterStatus: 'cancelled',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    icon: Calendar,
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)',
    filterStatus: 'upcoming',
  },
  {
    key: 'noShow',
    label: 'No-Show',
    icon: UserX,
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.12)',
    filterStatus: 'no-show',
  },
];

export default function DoctorSummaryCards({ counts, onCardClick }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="dsc-grid">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const value = counts[card.key] ?? 0;
          return (
            <button
              key={card.key}
              className="dsc-card"
              onClick={() => onCardClick && onCardClick(card.filterStatus)}
              type="button"
              style={{ '--accent-color': card.color }}
              title={card.label}
            >
              <span
                className="dsc-icon"
                style={{ background: card.bg, color: card.color }}
              >
                <Icon size={24} strokeWidth={2.2} />
              </span>
              <span className="dsc-content">
                <span className="dsc-label">{card.label}</span>
                <span className="dsc-value" style={{ color: card.color }}>
                  {value}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}