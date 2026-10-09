// src/components/AuthPage.jsx
// ==================================================
// 🔐 AuthPage — Google / Email Login
// ==================================================
// ✅ Google Sign-In (popup) — DEFAULT TAB
// ✅ Email/Password Sign-In + Register
// ✅ Bengali error messages
// ✅ GA4 tracking
// ✅ Post-auth: সব user হোম পেজে (/) redirect
// ==================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Shield,
  User as UserIcon,
} from 'lucide-react';

import { db, trackEvent } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  emailSignIn,
  emailSignUp,
  googleSignIn,
  ensureUserDoc,
} from '../services/authService';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

// ==================================================
// ✅ Main Component
// ==================================================
export default function AuthPage({ onClose }) {
  const navigate = useNavigate();

  // ✅ DEFAULT TAB = Google
  const [tab, setTab] = useState('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------- Email state ----------
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  // ==================================================
  // ✅ Post-Auth Handler — সব user হোম পেজে যাবে
  // ==================================================
  const handlePostAuth = async (firebaseUser, provider) => {
    try {
      // ১. Firestore-এ user doc তৈরি/আপডেট
      await ensureUserDoc(DEFAULT_HOSPITAL_ID, firebaseUser, {
        authProvider: provider,
        name: firebaseUser.displayName || '',
      });

      // ২. GA4 tracking
      trackEvent(`login_${provider}`, { method: provider });

      console.log('✅ Login successful, redirecting to home');

      // ৩. Modal হলে onClose কল হবে
      if (typeof onClose === 'function') {
        onClose();
      }

      // ৪. সব user হোম পেজে যাবে
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      console.error('Post-auth error:', err);
      setError(
        'লগইন সম্পন্ন হয়েছে কিন্তু ব্যবহারকারীর তথ্য লোড করা যায়নি'
      );
    }
  };

  // ==================================================
  // ✅ Google Sign-In
  // ==================================================
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await googleSignIn();
      await handlePostAuth(result.user, 'google');
    } catch (err) {
      console.error('Google sign-in error:', err);

      let msg = 'Google sign-in ব্যর্থ হয়েছে';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in বাতিল করা হয়েছে';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Popup blocked — অনুগ্রহ করে popup allow করুন';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'অনুরোধ বাতিল হয়েছে';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'নেটওয়ার্ক সমস্যা — ইন্টারনেট চেক করুন';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg =
          'Google Sign-In Firebase Console-এ enable করা হয়নি। Firebase Console → Authentication → Sign-in method → Google enable করুন।';
      } else {
        msg = err.message || msg;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ✅ Email Sign-In / Sign-Up
  // ==================================================
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await emailSignUp(email.trim(), password, name.trim());
        trackEvent('sign_up', { method: 'email' });
      } else {
        result = await emailSignIn(email.trim(), password);
        trackEvent('login', { method: 'email' });
      }
      await handlePostAuth(result.user, 'email');
    } catch (err) {
      console.error('Email auth error:', err);

      let msg = err.message || 'লগইন ব্যর্থ হয়েছে';

      if (err.code === 'auth/user-not-found') {
        msg =
          '❌ এই ইমেইলে কোনো অ্যাকাউন্ট নেই। নতুন অ্যাকাউন্ট তৈরি করতে "রেজিস্ট্রেশন করুন" ক্লিক করুন, অথবা Google দিয়ে লগইন করুন।';
      } else if (err.code === 'auth/wrong-password') {
        msg = '❌ পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।';
      } else if (err.code === 'auth/invalid-credential') {
        msg =
          '❌ ইমেইল/পাসওয়ার্ড ভুল। আপনি যদি Google দিয়ে অ্যাকাউন্ট খুলে থাকেন, তাহলে উপরের "Google" tab-এ ক্লিক করুন।';
      } else if (err.code === 'auth/email-already-in-use') {
        msg =
          '❌ এই ইমেইল আগে থেকেই ব্যবহৃত। Google দিয়ে লগইন করুন অথবা অন্য ইমেইল দিয়ে রেজিস্ট্রেশন করুন।';
      } else if (err.code === 'auth/weak-password') {
        msg = '❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
      } else if (err.code === 'auth/invalid-email') {
        msg = '❌ ইমেইল সঠিক নয়।';
      } else if (err.code === 'auth/too-many-requests') {
        msg = '❌ অনেকবার চেষ্টা করেছেন — কিছুক্ষণ পর আবার চেষ্টা করুন।';
      } else if (err.code === 'auth/network-request-failed') {
        msg = '❌ নেটওয়ার্ক সমস্যা — ইন্টারনেট চেক করুন।';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg =
          '❌ Email/Password Firebase Console-এ enable করা হয়নি।';
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ✅ Styles
  // ==================================================
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
    overflowY: 'auto',
  };

  const modalStyle = {
    background: '#fff',
    borderRadius: '20px',
    maxWidth: '440px',
    width: '100%',
    position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    fontFamily:
      "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '12px 8px',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1c5fa8' : '#64748b',
    border: 'none',
    borderBottom: active ? '3px solid #1c5fa8' : '3px solid transparent',
    fontSize: '13px',
    fontWeight: active ? '700' : '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  });

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14.5px',
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
    marginBottom: '6px',
  };

  const btnPrimary = {
    width: '100%',
    padding: '13px',
    background: loading
      ? '#94a3b8'
      : 'linear-gradient(135deg, #1c5fa8, #2b7ec9)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    boxShadow: loading ? 'none' : '0 4px 14px rgba(28,95,168,0.3)',
    transition: 'all 0.2s',
  };

  const googleBtn = {
    width: '100%',
    padding: '13px',
    background: '#fff',
    color: '#1e293b',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14.5px',
    fontWeight: '700',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    opacity: loading ? 0.6 : 1,
  };

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              zIndex: 2,
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
        )}

        {/* Header */}
        <div
          style={{
            padding: '28px 24px 20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 6px 20px rgba(28,95,168,0.15)',
            }}
          >
            <Shield size={30} color="#1c5fa8" />
          </div>
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: '800',
              color: '#1e293b',
            }}
          >
            স্বাগতম
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
            আপনার সিরিয়াল দেখতে লগইন করুন
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <button
            type="button"
            style={tabStyle(tab === 'google')}
            onClick={() => {
              setTab('google');
              setError('');
              setSuccess('');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35.1 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            style={tabStyle(tab === 'email')}
            onClick={() => {
              setTab('email');
              setError('');
              setSuccess('');
            }}
          >
            <Mail size={15} /> ইমেইল
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
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
                alignItems: 'flex-start',
                gap: '8px',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle
                size={16}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
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

          {/* GOOGLE TAB */}
          {tab === 'google' && (
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  margin: '0 0 20px',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Google account দিয়ে দ্রুত ও নিরাপদে লগইন করুন।
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={googleBtn}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#1c5fa8';
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#fff';
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path
                      fill="#FFC107"
                      d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35.1 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"
                    />
                  </svg>
                )}
                {loading ? 'অপেক্ষা করুন...' : 'Google দিয়ে চালিয়ে যান'}
              </button>
            </div>
          )}

          {/* EMAIL TAB */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              {isRegister && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>আপনার নাম</label>
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
                      placeholder="যেমন: আব্দুল্লাহ"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingLeft: '40px' }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = '#1c5fa8')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = '#e2e8f0')
                      }
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>ইমেইল</label>
                <div style={{ position: 'relative' }}>
                  <Mail
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
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = '#1c5fa8')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = '#e2e8f0')
                    }
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>পাসওয়ার্ড</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#1c5fa8')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>

              <button type="submit" disabled={loading} style={btnPrimary}>
                {loading && <Loader2 size={18} className="spin" />}
                {loading
                  ? 'অপেক্ষা করুন...'
                  : isRegister
                  ? 'রেজিস্ট্রেশন করুন'
                  : 'লগইন করুন'}
              </button>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: '13.5px',
                  marginTop: '16px',
                  color: '#475569',
                }}
              >
                {isRegister ? 'অ্যাকাউন্ট আছে? ' : 'নতুন ব্যবহারকারী? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                    setSuccess('');
                  }}
                  style={{
                    color: '#1c5fa8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                >
                  {isRegister ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}
                </button>
              </p>

              <div
                style={{
                  marginTop: '18px',
                  padding: '12px 14px',
                  background: '#eff6ff',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  color: '#1e40af',
                  lineHeight: 1.6,
                  border: '1px solid #bfdbfe',
                }}
              >
                💡 <strong>টিপস:</strong> আপনি যদি Google দিয়ে অ্যাকাউন্ট
                খুলে থাকেন, তাহলে ইমেইল/পাসওয়ার্ড কাজ করবে না। উপরের{' '}
                <strong>"Google"</strong> tab-এ ক্লিক করে সাইন-ইন করুন।
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
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
            লগইন করার মাধ্যমে আপনি আমাদের শর্তাবলি ও গোপনীয়তা নীতি মেনে
            নিচ্ছেন।
          </p>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes authSpin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: authSpin 1s linear infinite; }
      `}</style>
    </div>
  );
}