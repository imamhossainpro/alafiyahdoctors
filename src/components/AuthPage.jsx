import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, db, doc, setDoc } from '../firebase';
import { X, Loader2 } from 'lucide-react';

export default function AuthPage({ onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: name,
        email: email,
        role: 'pending',
        approved: false,
        createdAt: new Date().toISOString()
      });
      setSuccess('রেজিস্ট্রেশন সফল! অ্যাডমিন এপ্রুভ করার পর লগইন করতে পারবেন।');
      setEmail('');
      setPassword('');
      setName('');
      setTimeout(() => setIsRegister(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-box" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}><X size={20} /></button>
        <h2>{isRegister ? 'নিবন্ধন করুন' : 'লগইন করুন'}</h2>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <input type="text" placeholder="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : (isRegister ? 'নিবন্ধন করুন' : 'লগইন করুন')}
          </button>
        </form>
        <div className="auth-toggle">
          {isRegister ? 'আগে থেকে অ্যাকাউন্ট আছে? ' : 'নতুন ইউজার? '}
          <span onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}>
            {isRegister ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}
          </span>
        </div>
      </div>
      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .auth-box {
          background: #fff;
          padding: 32px;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .auth-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #94a3b8;
        }
        .auth-box h2 {
          color: #1c5fa8;
          text-align: center;
          margin: 0 0 20px 0;
        }
        .auth-box input {
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .auth-box button[type="submit"] {
          width: 100%;
          padding: 12px;
          background: #1c5fa8;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .auth-box button[type="submit"]:hover {
          background: #154a82;
        }
        .auth-box button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-error {
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 12px;
          text-align: center;
        }
        .auth-success {
          color: #16a34a;
          font-size: 13px;
          margin-bottom: 12px;
          text-align: center;
        }
        .auth-toggle {
          text-align: center;
          margin-top: 16px;
          font-size: 14px;
          color: #475569;
        }
        .auth-toggle span {
          color: #1c5fa8;
          font-weight: 600;
          cursor: pointer;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}