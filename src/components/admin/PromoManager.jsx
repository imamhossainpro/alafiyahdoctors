// src/components/admin/PromoManager.jsx
import React, { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const RAILWAY_API_URL = 'https://soothing-healing-production-8e36.up.railway.app';

export default function PromoManager() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert('Title ও Body উভয়ই লিখুন');
      return;
    }

    if (!window.confirm('সব approved ইউজারকে এই notification পাঠাতে চান?')) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/notification/send-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ type: 'success', message: `✅ ${data.sent} জনকে পাঠানো হয়েছে` });
        setTitle('');
        setBody('');
      } else {
        setResult({ type: 'error', message: `❌ ${data.error}` });
      }
    } catch (err) {
      setResult({ type: 'error', message: `❌ ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        📢 Promotional Notification
      </h3>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
        সব approved ইউজারকে push + in-app notification পাঠান।
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="যেমন: 🎁 বিশেষ ছাড়!"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
          Body *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="যেমন: আজ থেকে ৭ দিন সব ডাক্তার দেখাতে ২০% ছাড়।"
          rows={4}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      {result && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: result.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: result.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {result.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {result.message}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        style={{
          padding: '12px 24px',
          background: sending ? '#94a3b8' : '#1c5fa8',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: sending ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        {sending ? 'পাঠানো হচ্ছে...' : 'Notification পাঠান'}
      </button>
    </div>
  );
}