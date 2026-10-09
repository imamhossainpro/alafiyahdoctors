// src/components/doctor/DoctorErrorBoundary.jsx
// ==================================================
// 🛡️ DoctorErrorBoundary
// ==================================================
// Catches React errors in doctor dashboard subtree
// Shows fallback UI + reload button
// ==================================================

import React from 'react';

export default class DoctorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('❌ Doctor Dashboard Error Boundary:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '32px 28px',
              maxWidth: 420,
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              fontFamily:
                "'Hind Siliguri', 'Noto Sans Bengali', -apple-system, sans-serif",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3
              style={{
                margin: '0 0 8px',
                color: '#0F172A',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              কিছু একটা সমস্যা হয়েছে
            </h3>
            <p
              style={{
                color: '#64748B',
                fontSize: 13.5,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              পেজটা আবার লোড করে দেখুন। সমস্যা থেকে গেলে অ্যাডমিনের সাথে যোগাযোগ করুন।
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px',
                background: '#1D4ED8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}