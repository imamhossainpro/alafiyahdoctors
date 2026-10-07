// src/components/patient/EmptyState.jsx
// ==================================================
// 📭 EmptyState — no bookings OR filtered empty
// ==================================================
// ✅ Two modes:
//    - No bookings at all → "Book a serial" CTA
//    - Filtered empty → "Reset filter" CTA
// ✅ Modern, animated, friendly UI
// ==================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX2, Plus, Filter, X } from 'lucide-react';

// ==================================================
// ✅ Main Component
// ==================================================
export default function EmptyState({ isFiltered = false, onReset }) {
  const navigate = useNavigate();

  // ==================================================
  // ✅ Mode 1: Filtered empty (bookings exist, but filter has none)
  // ==================================================
  if (isFiltered) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
          fontFamily:
            "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <Filter size={44} color="#94a3b8" />
        </div>

        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#334155',
            margin: '0 0 8px 0',
          }}
        >
          এই ফিল্টারে কোনো বুকিং নেই
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 24px 0',
            maxWidth: '380px',
            lineHeight: 1.6,
          }}
        >
          ফিল্টার পরিবর্তন করে দেখুন বা সব বুকিং দেখতে রিসেট করুন।
        </p>

        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 24px',
            background: '#f1f5f9',
            color: '#1e293b',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <X size={16} />
          ফিল্টার রিসেট করুন
        </button>
      </div>
    );
  }

  // ==================================================
  // ✅ Mode 2: No bookings at all → Book a serial CTA
  // ==================================================
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
      }}
    >
      {/* ============ Icon ============ */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 12px 40px rgba(28,95,168,0.18)',
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        <CalendarX2 size={56} color="#1c5fa8" />
      </div>

      {/* ============ Title ============ */}
      <h2
        style={{
          fontSize: '22px',
          fontWeight: '800',
          color: '#1e293b',
          margin: '0 0 10px 0',
        }}
      >
        এখনো কোনো বুকিং নেই
      </h2>

      {/* ============ Subtitle ============ */}
      <p
        style={{
          fontSize: '14.5px',
          color: '#64748b',
          margin: '0 0 32px 0',
          maxWidth: '440px',
          lineHeight: 1.7,
        }}
      >
        আপনি এখনো কোনো ডাক্তারের সিরিয়াল বুক করেননি। এখনই বুক করুন এবং
        আপনার সিরিয়াল স্ট্যাটাস এখানে দেখুন।
      </p>

      {/* ============ CTA Button ============ */}
      <button
        onClick={() => navigate('/booking')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '15px 32px',
          background: 'linear-gradient(135deg, #1c5fa8 0%, #2b7ec9 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          fontSize: '15.5px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(28,95,168,0.35)',
          fontFamily: 'inherit',
          transition: 'all 0.25s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(28,95,168,0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(28,95,168,0.35)';
        }}
      >
        <Plus size={20} strokeWidth={2.5} />
        নতুন সিরিয়াল বুক করুন
      </button>

      {/* ============ Helper text ============ */}
      <p
        style={{
          fontSize: '12.5px',
          color: '#94a3b8',
          marginTop: '28px',
          lineHeight: 1.6,
        }}
      >
        💡 বুক করার পর আপনার সিরিয়াল নাম্বার এখানে দেখতে পাবেন
      </p>

      {/* ============ Float animation ============ */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}