import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, updateDoc, deleteDoc } from '../firebase';
import { Loader2, CheckCircle, XCircle, RefreshCw, UserCheck, UserX, Shield, AlertCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updating, setUpdating] = useState(null); // ইউজার আইডি যা পরিবর্তন হচ্ছে

  // সব ইউজার লোড করুন
  const loadUsers = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // সাজানো (নতুন → পুরনো)
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setUsers(list);
    } catch (error) {
      console.error('❌ ইউজার লোড ত্রুটি:', error);
      setMessage({ type: 'error', text: 'ইউজার লোড করতে সমস্যা হয়েছে! ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ইউজার এপ্রুভ
  const approveUser = async (uid) => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { approved: true });
      setMessage({ type: 'success', text: '✅ ইউজার এপ্রুভ করা হয়েছে!' });
      loadUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'এপ্রুভ করতে সমস্যা হয়েছে! ' + error.message });
    } finally {
      setUpdating(null);
    }
  };

  // রোল পরিবর্তন
  const setRole = async (uid, role) => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      setMessage({ type: 'success', text: `✅ রোল "${role}" সেট করা হয়েছে!` });
      loadUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'রোল সেট করতে সমস্যা হয়েছে! ' + error.message });
    } finally {
      setUpdating(null);
    }
  };

  // ইউজার ডিলিট
  const deleteUser = async (uid, email) => {
    if (!confirm(`"${email}" এই ইউজারকে ডিলিট করতে চান?`)) return;
    setUpdating(uid);
    try {
      await deleteDoc(doc(db, 'users', uid));
      setMessage({ type: 'success', text: `✅ ${email} ডিলিট করা হয়েছে!` });
      loadUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'ডিলিট করতে সমস্যা হয়েছে! ' + error.message });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ color: '#1c5fa8', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Shield size={28} /> সুপার অ্যাডমিন – ইউজার ম্যানেজমেন্ট
        </h1>
        <button
          onClick={loadUsers}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#1c5fa8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> রিফ্রেশ
        </button>
      </div>

      {/* মেসেজ */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#dbeafe',
          color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#991b1b' : '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : message.type === 'error' ? '#fecaca' : '#bfdbfe'}`
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : message.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* টেবিল */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 className="spin" size={40} color="#1c5fa8" />
          <p style={{ marginTop: '12px', color: '#64748b' }}>ইউজার লোড হচ্ছে...</p>
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: '12px' }}>
          <p style={{ color: '#94a3b8' }}>কোনো ইউজার নেই।</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>নাম</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>ইমেইল</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>হাসপাতাল ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>রোল</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#475569' }}>স্ট্যাটাস</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#475569' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isUpdating = updating === u.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eef2f6', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{u.name || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#1e293b' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
                        {u.hospitalId || 'N/A'}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={u.role || 'pending'}
                        onChange={(e) => setRole(u.id, e.target.value)}
                        disabled={isUpdating}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          background: isUpdating ? '#f1f5f9' : '#fff',
                          fontSize: '13px',
                          cursor: isUpdating ? 'not-allowed' : 'pointer',
                          opacity: isUpdating ? 0.6 : 1
                        }}
                      >
                        <option value="pending">⏳ পেন্ডিং</option>
                        <option value="admin">👑 অ্যাডমিন</option>
                        <option value="sub-admin">🔹 সাব-অ্যাডমিন</option>
                        <option value="editor">📝 এডিটর</option>
                        <option value="viewer">👀 ভিউয়ার</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.approved ? (
                        <span style={{ color: '#22c55e', fontWeight: '600', background: '#dcfce7', padding: '2px 12px', borderRadius: '20px', fontSize: '13px', display: 'inline-block' }}>
                          ✅ এপ্রুভড
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: '600', background: '#fef3c7', padding: '2px 12px', borderRadius: '20px', fontSize: '13px', display: 'inline-block' }}>
                          ⏳ পেন্ডিং
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!u.approved && (
                          <button
                            onClick={() => approveUser(u.id)}
                            disabled={isUpdating}
                            style={{
                              padding: '4px 12px',
                              background: '#22c55e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: isUpdating ? 0.6 : 1
                            }}
                          >
                            <UserCheck size={14} /> এপ্রুভ
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u.id, u.email)}
                          disabled={isUpdating}
                          style={{
                            padding: '4px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isUpdating ? 0.6 : 1
                          }}
                        >
                          <UserX size={14} /> ডিলিট
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
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