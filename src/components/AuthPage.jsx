// src/components/AuthPage.jsx
// ==================================================
// 🔐 AuthPage — Login / Register Modal
// ==================================================
// ✅ Firebase Auth (email/password)
// ✅ Firestore user doc at hospitals/{id}/users/{uid}
// ✅ GA4 tracking (login / sign_up)
// ✅ Bengali error messages
// ✅ /mou এবং /login — দুই জায়গা থেকেই কাজ করে
// ==================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, trackEvent } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export default function AuthPage({ onClose, redirectAfterLogin }) {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ==================================================
  // ✅ Submit handler
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // ==================================================
      // 🔹 LOGIN
      // ==================================================
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const user = userCredential.user;

        // ✅ সঠিক path: hospitals/{id}/users/{uid}
        const userRef = doc(
          db,
          'hospitals',
          DEFAULT_HOSPITAL_ID,
          'users',
          user.uid
        );
        const userDoc = await getDoc(userRef);

        // ইউজার ডকুমেন্ট না থাকলে তৈরি করুন (fallback)
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email,
            role: 'viewer',
            approved: false,
            isActive: true,
            hospitalId: DEFAULT_HOSPITAL_ID,
            createdAt: new Date().toISOString(),
          });
          console.log('✅ User doc created (fallback) at:', userRef.path);
        } else {
          console.log('✅ User doc found:', userDoc.data());
        }

        // ✅ GA4 — login event
        trackEvent('login', { method: 'email' });

        // ✅ Redirect logic
        if (redirectAfterLogin) {
          navigate(redirectAfterLogin);
        } else if (onClose) {
          onClose();
        }
      }

      // ==================================================
      // 🔹 REGISTER
      // ==================================================
      else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const user = userCredential.user;

        // Display name সেট করুন
        if (name.trim()) {
          await updateProfile(user, { displayName: name.trim() });
        }

        // ✅ সঠিক path: hospitals/{id}/users/{uid}
        const userRef = doc(
          db,
          'hospitals',
          DEFAULT_HOSPITAL_ID,
          'users',
          user.uid
        );
        await setDoc(userRef, {
          uid: user.uid,
          name: name.trim(),
          email: user.email,
          role: 'viewer',
          approved: false,          // অ্যাডমিন এপ্রুভ করবে
          isActive: true,
          designation: designation.trim() || '',
          hospitalId: DEFAULT_HOSPITAL_ID,
          createdAt: new Date().toISOString(),
        });

        // ✅ GA4 — sign_up event
        trackEvent('sign_up', { method: 'email' });

        setSuccess(
          '✅ রেজিস্ট্রেশন সফল! অ্যাডমিন এপ্রুভ করার পর লগইন করতে পারবেন।'
        );
        setIsLogin(true);
        setName('');
        setDesignation('');
        setPassword('');
        // email keep করে দিচ্ছি যাতে user সহজে login করতে পারে
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('❌ Auth error:', err);

      // ---------- Friendly Bengali error messages ----------
      let friendlyMessage = 'অনুগ্রহ করে আবার চেষ্টা করুন।';

      switch (err.code) {
        case 'auth/user-not-found':
          friendlyMessage =
            '❌ এই ইমেইলে কোনো অ্যাকাউন্ট নেই। অনুগ্রহ করে রেজিস্ট্রেশন করুন।';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          friendlyMessage = '❌ পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।';
          break;
        case 'auth/invalid-email':
          friendlyMessage = '❌ ইমেইল ঠিকানাটি সঠিক নয়।';
          break;
        case 'auth/email-already-in-use':
          friendlyMessage =
            '❌ এই ইমেইল ইতিমধ্যে ব্যবহার হচ্ছে। লগইন করার চেষ্টা করুন।';
          break;
        case 'auth/weak-password':
          friendlyMessage = '❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
          break;
        case 'auth/network-request-failed':
          friendlyMessage =
            '❌ ইন্টারনেট সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।';
          break;
        case 'auth/too-many-requests':
          friendlyMessage =
            '❌ অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
          break;
        default:
          friendlyMessage = err.message || friendlyMessage;
      }

      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ✅ Toggle Login/Register
  // ==================================================
  const handleToggleMode = () => {
    setIsLogin((v) => !v);
    setError('');
    setSuccess('');
  };

  // ==================================================
  // ✅ Inline styles (Tailwind ছাড়া)
  // ==================================================
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
  };

  const modalStyle = {
    background: '#fff',
    borderRadius: '16px',
    maxWidth: '420px',
    width: '100%',
    padding: '28px 24px',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxHeight: '92vh',
    overflowY: 'auto',
    fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
  };

  const closeBtnStyle = {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#888',
    lineHeight: 1,
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginTop: '4px',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '2px',
  };

  const btnStyle = {
    width: '100%',
    padding: '12px',
    background: loading ? '#94a3b8' : '#1c5fa8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    marginTop: '4px',
  };

  const errorStyle = {
    color: '#991b1b',
    fontSize: '13.5px',
    backgroundColor: '#fee2e2',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontWeight: '500',
    lineHeight: 1.5,
  };

  const successStyle = {
    color: '#166534',
    fontSize: '13.5px',
    backgroundColor: '#dcfce7',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontWeight: '500',
    lineHeight: 1.5,
  };

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {onClose && (
          <button
            type="button"
            style={closeBtnStyle}
            onClick={onClose}
            aria-label="বন্ধ করুন"
            onMouseEnter={(e) => (e.target.style.background = '#f1f5f9')}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            ✕
          </button>
        )}

        {/* Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '22px',
            marginBottom: '6px',
            color: '#1c5fa8',
            fontWeight: '800',
          }}
        >
          {isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '13.5px',
            color: '#64748b',
            marginBottom: '20px',
          }}
        >
          {isLogin
            ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন'
            : 'আল-আফিয়া হাসপাতালে অ্যাকাউন্ট তৈরি করুন'}
        </p>

        {/* Feedback messages */}
        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>পূর্ণ নাম *</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="যেমন: ডাঃ মোহাম্মদ নূর"
                  autoComplete="name"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>পদবী (ঐচ্ছিক)</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="যেমন: এডিটর / মডারেটর"
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>ইমেইল *</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>পাসওয়ার্ড *</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" style={btnStyle} disabled={loading}>
            {loading
              ? 'অপেক্ষা করুন...'
              : isLogin
              ? 'লগইন করুন'
              : 'রেজিস্ট্রেশন করুন'}
          </button>
        </form>

        {/* Toggle */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '13.5px',
            marginTop: '16px',
            color: '#475569',
          }}
        >
          {isLogin ? 'নতুন ব্যবহারকারী? ' : 'ইতিমধ্যে অ্যাকাউন্ট আছে? '}
          <button
            type="button"
            onClick={handleToggleMode}
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
            {isLogin ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}
          </button>
        </p>

        {/* Footer note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '16px',
            lineHeight: 1.6,
          }}
        >
          নতুন অ্যাকাউন্ট অ্যাডমিন এপ্রুভ করার পর সক্রিয় হবে।
        </p>
      </div>
    </div>
  );
}