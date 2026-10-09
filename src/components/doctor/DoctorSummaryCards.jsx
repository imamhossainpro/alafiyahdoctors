// src/components/doctor/DoctorSummaryCards.jsx
// ==================================================
// 📊 Doctor Summary Cards — Dynamic counts
// ==================================================
// ✅ All counts computed from real data
// ✅ Clickable cards → open filtered list
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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
  }
  .dsc-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    font-family: inherit;
  }
  .dsc-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(28, 95, 168, 0.12);
    border-color: #1c5fa8;
  }
  .dsc-icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dsc-content {
    flex: 1;
    min-width: 0;
  }
  .dsc-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dsc-value {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.1;
  }
`;

const CARDS = [
  {
    key: 'total',
    label: "Today's Total Patients",
    icon: Users,
    color: '#1c5fa8',
    bg: 'rgba(28, 95, 168, 0.1)',
    filterStatus: 'all',
  },
  {
    key: 'pending',
    label: 'Pending Serials',
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    filterStatus: 'pending',
  },
  {
    key: 'confirmed',
    label: 'Approved Serials',
    icon: CheckCircle,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    filterStatus: 'confirmed',
  },
  {
    key: 'checkedIn',
    label: 'Attended Patients',
    icon: UserCheck,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    filterStatus: 'checked-in',
  },
  {
    key: 'completed',
    label: 'Doctor Seen',
    icon: Stethoscope,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.1)',
    filterStatus: 'completed',
  },
  {
    key: 'cancelled',
    label: 'Cancelled Serials',
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    filterStatus: 'cancelled',
  },
  {
    key: 'upcoming',
    label: 'Upcoming Patients',
    icon: Calendar,
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.1)',
    filterStatus: 'upcoming',
  },
  {
    key: 'noShow',
    label: 'No-Show Patients',
    icon: UserX,
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.1)',
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
            >
              <span
                className="dsc-icon"
                style={{ background: card.bg, color: card.color }}
              >
                <Icon size={22} />
              </span>
              <span className="dsc-content">
                <span className="dsc-label">{card.label}</span>
                <span
                  className="dsc-value"
                  style={{ color: card.color }}
                >
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