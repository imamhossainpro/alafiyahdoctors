// src/components/UserProfile.jsx
// ==================================================
// 👤 UserProfile — নাম, mobile পরিবর্তন করার page
// ==================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  LogOut,
  ChevronLeft,
  Shield,
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
// ✅ Helpers
// ==================================================

// E.164 → local display (01712345678)
const toDisplayMobile = (mobile) => {
  if (!mobile) return '';
  const clean = String(mobile).replace(/[^0-9]/g, '');

  if (clean.startsWith('880')) {
    // 8801712345678 → 01712345678
    return '0' + clean.slice(3);
  }
  if (clean.startsWith('88')) {
    // 881712345678 → 01712345678
    return '0' + clean.slice(2);
  }
  if (clean.startsWith('0')) {
    return clean;
  }
  // 1712345678 → 01712345678
  return '0' + clean;
};

// Local → E.164 (8801712345678)
const toE164Mobile = (input) => {
  const clean = String(input).replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('880')) return clean;
  if (clean.startsWith('88')) return '880' + clean.slice(2);
  if (clean.startsWith('0')) return '880' + clean.slice(1);
  return '880' + clean;
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function UserProfile() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==================================================
  // ✅ Redirect if not logged in
  // ==================================================
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ==================================================
  // ✅ Load current user data
  // ==================================================
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;

      setLoading(true);
      try {
        const userRef = doc(db, 'hospitals', hospitalId, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || user.displayName || '');
          setMobile(toDisplayMobile(data.mobile));
        } else {
          setName(user.displayName || '');
          setMobile(toDisplayMobile(user.mobile));
        }
      } catch (err) {
        console.error('Load profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadProfile();
    }
  }, [user, hospitalId]);

  // ==================================================
  // ✅ Save changes
  // ==================================================
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!name.trim()) {
      setError('নাম লিখুন');
      return;
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile && cleanMobile.length < 11) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)');
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'hospitals', hospitalId, 'users', user.uid);

      const updates = {
        name: name.trim(),
        updatedAt: serverTimestamp(),
      };

      if (cleanMobile) {
        updates.mobile = toE164Mobile(cleanMobile);
        updates.mobileVerified = true;
      }

      await setDoc(userRef, updates, { merge: true });

      // Link bookings if mobile changed
      if (cleanMobile) {
        try {
          const { linkAppointmentsToPatient } = await import(
            '../services/patientAuthService'
          );
          await linkAppointmentsToPatient(
            hospitalId,
            user.uid,
            updates.mobile
          );
        } catch (linkErr) {
          console.warn('Link error:', linkErr);
        }
      }

      setSuccess('✅ প্রোফাইল সেভ হয়েছে');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.message || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
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
  // ✅ Loading
  // ==================================================
  if (authLoading || loading) {
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
          <p style={{ color: '#64748b', marginTop: '12px' }}>
            লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

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

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '8px',
  };

  const userInitial = (user.name || user.email || 'U')[0].toUpperCase();

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f6fa',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        paddingBottom: '60px',
      }}
    >
      {/* ==================================================
          Header
          ================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1c5fa8 0%, #2b7ec9 100%)',
          color: '#fff',
          padding: '20px',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            onClick={() => navigate('/my-bookings')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'inherit',
            }}
          >
            <ChevronLeft size={16} /> ফিরে যান
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: '19px',
              fontWeight: '800',
              flex: 1,
            }}
          >
            প্রোফাইল
          </h1>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(220,38,38,0.9)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={14} /> লগআউট
          </button>
        </div>
      </div>

      {/* ==================================================
          Body
          ================================================== */}
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        {/* Avatar Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1c5fa8, #4fa3d1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#fff',
              fontSize: '28px',
              fontWeight: '800',
            }}
          >
            {userInitial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name || user.displayName || 'ব্যবহারকারী'}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: 0,
              }}
            >
              <Mail size={13} style={{ flexShrink: 0 }} />
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.email || 'Google Account'}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================
            Form Card
            ================================================== */}
        <form
          onSubmit={handleSave}
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
          }}
        >
          {/* Feedback */}
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
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div
              style={{
                padding: '12px 14px',
                background: '#dcfce7',
                color: '#166534',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* ============ Name Field ============ */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>নাম</label>
            <div style={{ position: 'relative' }}>
              <UserIcon
                size={16}
                color="#94a3b8"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="আপনার নাম"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ ...inputStyle, paddingLeft: '42px' }}
                onFocus={(e) => (e.target.style.borderColor = '#1c5fa8')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* ============ Mobile Field ============ */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              মোবাইল নাম্বার
              <span
                style={{
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  fontWeight: '400',
                  marginLeft: '6px',
                }}
              >
                (এই নাম্বার দিয়ে সিরিয়াল খুঁজে পাওয়া যাবে)
              </span>
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
                background: '#fff',
              }}
              onFocusCapture={(e) =>
                (e.currentTarget.style.borderColor = '#1c5fa8')
              }
              onBlurCapture={(e) =>
                (e.currentTarget.style.borderColor = '#e2e8f0')
              }
            >
              {/* Country code (fixed) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 14px',
                  background: '#f8fafc',
                  borderRight: '1.5px solid #e2e8f0',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                🇧🇩 +880
              </div>

              {/* Input (no border — outer wrapper handles it) */}
              <input
                type="tel"
                inputMode="numeric"
                placeholder="1712345678"
                value={mobile.replace(/^0/, '')}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9]/g, '');
                  // strip leading 88 or 880 if user pastes full number
                  if (val.startsWith('880')) val = val.slice(3);
                  else if (val.startsWith('88')) val = val.slice(2);
                  // strip leading 0
                  if (val.startsWith('0')) val = val.slice(1);
                  setMobile(val.slice(0, 10));
                }}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  color: '#1e293b',
                  background: 'transparent',
                  boxSizing: 'border-box',
                  minWidth: 0,
                }}
                maxLength={10}
              />
            </div>

            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '11.5px',
                color: '#94a3b8',
                lineHeight: 1.5,
              }}
            >
              💡 উদাহরণ: <strong>1712345678</strong> (০ ছাড়া ১০ ডিজিট)
            </p>
          </div>

          {/* ============ Info Box ============ */}
          <div
            style={{
              marginBottom: '20px',
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
            <Shield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              মোবাইল নাম্বার পরিবর্তন করলে সেই নাম্বারের সব সিরিয়ালও আপনার
              প্রোফাইলে যুক্ত হবে।
            </span>
          </div>

          {/* ============ Save Button ============ */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '15px',
              background: saving
                ? '#94a3b8'
                : 'linear-gradient(135deg, #1c5fa8, #2b7ec9)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15.5px',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
              boxShadow: saving
                ? 'none'
                : '0 6px 20px rgba(28,95,168,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {saving ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </form>

        {/* ============ Footer Note ============ */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '20px',
            lineHeight: 1.6,
          }}
        >
          🔒 আপনার তথ্য সুরক্ষিত রাখা হয়
        </p>
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