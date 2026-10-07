// src/components/AddMobilePage.jsx
// ==================================================
// 📱 AddMobilePage — Google/Email user-এর mobile যোগ
// ==================================================
// ✅ OTP নেই — শুধু নাম্বার দিলেই সেভ হবে
// ✅ নাম্বার verified হিসেবে mark হবে
// ✅ সেভ হলে /my-bookings এ redirect
// ✅ Profile থেকে পরে পরিবর্তন করা যাবে
// ==================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import {
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '../firebase';

// ==================================================
// ✅ Main Component
// ==================================================
export default function AddMobilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ==================================================
  // ✅ Auth check
  // ==================================================
  useEffect(() => {
    const checkAuthAndMobile = async () => {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Already has mobile → /my-bookings
      try {
        const userRef = doc(db, 'hospitals', hospitalId, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.mobile) {
            navigate('/my-bookings', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      }

      setCheckingAuth(false);
    };

    checkAuthAndMobile();
  }, [user, hospitalId, navigate]);

  // ==================================================
  // ✅ Normalize mobile (88XXXXXXXXXX format)
  // ==================================================
  const normalizeMobile = (input) => {
    const clean = String(input).replace(/[^0-9]/g, '');
    if (!clean) return '';
    if (clean.startsWith('88')) return clean;
    if (clean.startsWith('0')) return '88' + clean;
    return '88' + clean;
  };

  // ==================================================
  // ✅ Save mobile (NO OTP)
  // ==================================================
  const handleSave = async () => {
    setError('');

    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setError('সঠিক মোবাইল নাম্বার দিন (যেমন: 01712345678)');
      return;
    }

    const normalized = normalizeMobile(clean);

    setLoading(true);
    try {
      const userRef = doc(db, 'hospitals', hospitalId, 'users', user.uid);

      await setDoc(
        userRef,
        {
          mobile: normalized,
          mobileVerified: true, // ✅ OTP নেই, তাই সরাসরি verified
          mobileAddedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ Link existing bookings by this mobile
      try {
        const { linkAppointmentsToPatient } = await import(
          '../services/patientAuthService'
        );
        await linkAppointmentsToPatient(hospitalId, user.uid, normalized);
      } catch (linkErr) {
        console.warn('Link error (non-critical):', linkErr);
      }

      // ✅ Success → redirect
      setTimeout(() => {
        navigate('/my-bookings', { replace: true });
      }, 500);
    } catch (err) {
      console.error('Save mobile error:', err);
      setError(err.message || 'মোবাইল নাম্বার সেভ করতে সমস্যা হয়েছে');
      setLoading(false);
    }
  };

  // ==================================================
  // ✅ Logout
  // ==================================================
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ==================================================
  // ✅ Loading state
  // ==================================================
  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fa',
          fontFamily:
            "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} className="spin" color="#1c5fa8" />
          <p
            style={{
              color: '#64748b',
              marginTop: '12px',
              fontSize: '14px',
            }}
          >
            লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ✅ Styles
  // ==================================================
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    color: '#1e293b',
    background: '#fff',
  };

  const btnPrimary = {
    width: '100%',
    padding: '15px',
    background: loading
      ? '#94a3b8'
      : 'linear-gradient(135deg, #1c5fa8, #2b7ec9)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15.5px',
    fontWeight: '700',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    boxShadow: loading ? 'none' : '0 6px 20px rgba(28,95,168,0.3)',
    transition: 'all 0.2s',
  };

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(15,23,42,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* ============ Header ============ */}
        <div
          style={{
            padding: '32px 28px 24px',
            background: 'linear-gradient(135deg, #1c5fa8 0%, #2b7ec9 100%)',
            color: '#fff',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '6px 12px',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={13} /> লগআউট
          </button>

          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Phone size={36} color="#fff" />
          </div>

          <h1
            style={{
              margin: '0 0 6px',
              fontSize: '23px',
              fontWeight: '800',
            }}
          >
            মোবাইল নাম্বার যোগ করুন
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              opacity: 0.92,
              lineHeight: 1.6,
            }}
          >
            আপনার সিরিয়াল ও বুকিং স্ট্যাটাস দেখতে মোবাইল নাম্বার যুক্ত করুন
          </p>
        </div>

        {/* ============ User info ============ */}
        {user && (
          <div
            style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserIcon size={20} color="#1c5fa8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name || user.displayName || 'ব্যবহারকারী'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.email || 'Google Account'}
              </div>
            </div>
          </div>
        )}

        {/* ============ Body ============ */}
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Error */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Label */}
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
              marginBottom: '8px',
            }}
          >
            মোবাইল নাম্বার
          </label>

          {/* Phone input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                padding: '14px 16px',
                background: '#f1f5f9',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#1e293b',
                whiteSpace: 'nowrap',
                border: '1.5px solid #e2e8f0',
              }}
            >
              🇧🇩 +88
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="01712345678"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(
                  e.target.value.replace(/[^0-9]/g, '').slice(0, 11)
                )
              }
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => (e.target.style.borderColor = '#1c5fa8')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              maxLength={11}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading || phoneNumber.length < 10}
            style={{
              ...btnPrimary,
              opacity: phoneNumber.length < 10 ? 0.5 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <ArrowRight size={18} />
            )}
            {loading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>

          {/* Info box */}
          <div
            style={{
              marginTop: '18px',
              padding: '12px 14px',
              background: '#eff6ff',
              borderRadius: '10px',
              fontSize: '12.5px',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              lineHeight: 1.6,
            }}
          >
            <ShieldCheck
              size={16}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <span>
              এই নাম্বার দিয়েই আপনার সব সিরিয়াল এবং বুকিং স্ট্যাটাস খুঁজে
              পাওয়া যাবে। পরে Profile থেকে পরিবর্তন করা যাবে।
            </span>
          </div>
        </div>

        {/* ============ Footer ============ */}
        <div
          style={{
            padding: '14px 28px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11.5px',
              color: '#94a3b8',
              lineHeight: 1.6,
            }}
          >
            🔒 আপনার মোবাইল নাম্বার শুধুমাত্র বুকিং যাচাইয়ের জন্য ব্যবহৃত হবে
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}