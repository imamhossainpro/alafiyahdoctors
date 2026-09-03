import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';

const LoginCSS = `
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  padding: 20px;
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
}
.login-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 40px 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  border: 1px solid #e2e8f0;
}
.login-title {
  font-size: 28px;
  font-weight: 800;
  color: #1c5fa8;
  text-align: center;
  margin-bottom: 8px;
}
.login-sub {
  text-align: center;
  color: #64748b;
  margin-bottom: 24px;
  font-size: 14px;
}
.login-form-group {
  margin-bottom: 16px;
}
.login-form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 5px;
}
.login-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s;
}
.login-input:focus {
  outline: none;
  border-color: #1c5fa8;
  box-shadow: 0 0 0 3px rgba(28, 95, 168, 0.15);
}
.login-btn {
  width: 100%;
  padding: 14px;
  background: #1c5fa8;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.login-btn:hover {
  background: #154a82;
  transform: translateY(-2px);
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.login-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
.login-toggle {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #475569;
}
.login-toggle span {
  color: #1c5fa8;
  font-weight: 700;
  cursor: pointer;
}
.login-toggle span:hover {
  text-decoration: underline;
}
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    hospitalId: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // রেজিস্ট্রেশন
        const { user: firebaseUser } = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        
        // Firestore-এ ইউজার ডেটা সংরক্ষণ
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: formData.name,
          email: formData.email,
          hospitalId: formData.hospitalId || '',
          designation: formData.designation || '',
          role: 'pending',
          approved: false,
          createdAt: new Date().toISOString()
        });

        setError('✅ রেজিস্ট্রেশন সফল! অ্যাডমিন এপ্রুভ করার পর লগইন করতে পারবেন।');
        setIsRegister(false);
        setFormData({ email: '', password: '', name: '', hospitalId: '', designation: '' });
        setLoading(false);
        return;
      }

      // লগইন
      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // ইউজার ডেটা লোড
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.approved) {
          setError('⏳ আপনার অ্যাকাউন্ট এখনো এপ্রুভ হয়নি। অনুগ্রহ করে অপেক্ষা করুন।');
          await auth.signOut();
          setLoading(false);
          return;
        }
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
        // অ্যাডমিন বা সাব-অ্যাডমিন হলে ড্যাশবোর্ডে পাঠান
        if (userData.role === 'admin' || userData.role === 'sub-admin') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('❌ ইউজার ডেটা পাওয়া যায়নি। দয়া করে রেজিস্ট্রেশন করুন।');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('❌ ইউজার পাওয়া যায়নি। দয়া করে রেজিস্ট্রেশন করুন।');
      } else if (err.code === 'auth/wrong-password') {
        setError('❌ ভুল পাসওয়ার্ড।');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('❌ এই ইমেইল ইতিমধ্যে ব্যবহার হচ্ছে।');
      } else {
        setError(err.message || 'লগইন করতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{LoginCSS}</style>
      <div className="login-card">
        <h1 className="login-title">
          {isRegister ? 'নিবন্ধন করুন' : 'লগইন করুন'}
        </h1>
        <p className="login-sub">
          {isRegister 
            ? 'আল-আফিয়া হাসপাতালে অ্যাকাউন্ট তৈরি করুন' 
            : 'আপনার অ্যাকাউন্টে লগইন করুন'}
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="login-form-group">
                <label>আপনার নাম</label>
                <input
                  type="text"
                  className="login-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="যেমন: ডাঃ মোহাম্মদ নূর"
                />
              </div>
              <div className="login-form-group">
                <label>হাসপাতাল ID (ঐচ্ছিক)</label>
                <input
                  type="text"
                  className="login-input"
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({...formData, hospitalId: e.target.value})}
                  placeholder="যেমন: HOS-001"
                />
              </div>
              <div className="login-form-group">
                <label>ডেসিগনেশন</label>
                <input
                  type="text"
                  className="login-input"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  placeholder="যেমন: অ্যাডমিন, এডিটর"
                />
              </div>
            </>
          )}

          <div className="login-form-group">
            <label>ইমেইল</label>
            <input
              type="email"
              className="login-input"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="login-form-group">
            <label>পাসওয়ার্ড</label>
            <input
              type="password"
              className="login-input"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner">⏳</span>
            ) : (
              isRegister ? 'নিবন্ধন করুন' : 'লগইন করুন'
            )}
          </button>
        </form>

        <div className="login-toggle">
          {isRegister ? (
            <>ইতিমধ্যে অ্যাকাউন্ট আছে? <span onClick={() => { setIsRegister(false); setError(''); }}>লগইন করুন</span></>
          ) : (
            <>নতুন ইউজার? <span onClick={() => { setIsRegister(true); setError(''); }}>নিবন্ধন করুন</span></>
          )}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ⬅ হোমপেজে ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
}