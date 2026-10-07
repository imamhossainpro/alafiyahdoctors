// src/components/patient/StatusTimeline.jsx
// ==================================================
// 📊 Status Timeline — visual progress of booking status
// ==================================================
// ✅ 4-step visual progress (pending → confirmed → checked-in → completed)
// ✅ Cancelled / No-show handled separately
// ✅ Animated transitions
// ✅ Mobile responsive
// ==================================================
import React from 'react';
import { Check, Clock, X, UserCheck, CheckCircle2 } from 'lucide-react';

// ==================================================
// ✅ Step definitions
// ==================================================
const STEPS = [
  { key: 'pending', label: 'অপেক্ষমাণ', icon: Clock, color: '#f59e0b' },
  { key: 'confirmed', label: 'নিশ্চিত', icon: Check, color: '#3b82f6' },
  { key: 'checked-in', label: 'চেক-ইন', icon: UserCheck, color: '#8b5cf6' },
  { key: 'completed', label: 'সম্পন্ন', icon: CheckCircle2, color: '#22c55e' },
];

const STATUS_ORDER = {
  pending: 0,
  confirmed: 1,
  'checked-in': 2,
  completed: 3,
  cancelled: -1,
  'no-show': -1,
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function StatusTimeline({ status = 'pending' }) {
  // ==================================================
  // ✅ Special cases: cancelled / no-show
  // ==================================================
  if (status === 'cancelled' || status === 'no-show') {
    const isCancelled = status === 'cancelled';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: isCancelled ? '#fee2e2' : '#f3f4f6',
          borderRadius: '10px',
          color: isCancelled ? '#991b1b' : '#4b5563',
          fontWeight: '600',
          fontSize: '13.5px',
          border: `1px solid ${isCancelled ? '#fca5a5' : '#d1d5db'}`,
        }}
      >
        <X size={18} />
        {isCancelled
          ? 'এই বুকিং বাতিল করা হয়েছে'
          : 'রোগী নির্ধারিত সময়ে উপস্থিত হননি'}
      </div>
    );
  }

  // ==================================================
  // ✅ Normal flow
  // ==================================================
  const currentIndex = STATUS_ORDER[status] ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '4px',
        padding: '8px 0 4px',
        width: '100%',
      }}
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <React.Fragment key={step.key}>
            {/* ============ Step Circle ============ */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDone ? step.color : '#f1f5f9',
                  color: isDone ? '#fff' : '#94a3b8',
                  border: isCurrent
                    ? `3px solid ${step.color}33`
                    : '3px solid transparent',
                  boxShadow: isCurrent ? `0 0 0 4px ${step.color}22` : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
              >
                <Icon size={16} strokeWidth={2.5} />
                {isCurrent && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: '-6px',
                      borderRadius: '50%',
                      border: `2px solid ${step.color}`,
                      opacity: 0.4,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isDone ? '700' : '500',
                  color: isDone ? step.color : '#94a3b8',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.2px',
                  fontFamily:
                    "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* ============ Connector Line ============ */}
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '3px',
                  marginTop: '16px',
                  background: idx < currentIndex ? step.color : '#e2e8f0',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  minWidth: '20px',
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }

        @media (max-width: 420px) {
          /* Smaller sizes on very narrow screens */
        }
      `}</style>
    </div>
  );
}