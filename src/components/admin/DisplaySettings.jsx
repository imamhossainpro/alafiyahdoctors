import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc } from '../../firebase';
import { Power, Clock, Save, AlertCircle } from 'lucide-react';

export default function DisplaySettings({ user }) {
  const [settings, setSettings] = useState({
    isActive: true,
    useTimeRange: false,
    startTime: '08:00',
    endTime: '22:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';

  // লোড সেটিংস
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'master', 'displaySettings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          // ডিফল্ট সেটিংস সেভ
          await setDoc(docRef, {
            isActive: true,
            useTimeRange: false,
            startTime: '08:00',
            endTime: '22:00'
          });
        }
      } catch (error) {
        console.error('Error loading display settings:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) loadSettings();
  }, [isAdmin]);

  // সেটিংস সেভ
  const saveSettings = async () => {
    if (!isAdmin) {
      setMessage('শুধুমাত্র অ্যাডমিন সেটিংস পরিবর্তন করতে পারবেন।');
      return;
    }
    try {
      setSaving(true);
      setMessage('');
      await setDoc(doc(db, 'master', 'displaySettings'), settings);
      setMessage('✅ সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b' }}>শুধুমাত্র অ্যাডমিন ডিসপ্লে সেটিংস পরিবর্তন করতে পারবেন।</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>;
  }

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Power size={20} color="#1c5fa8" /> 📺 টিভি ডিসপ্লে সেটিংস
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* অন/অফ টগল */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b', minWidth: '120px' }}>
            ডিসপ্লে স্ট্যাটাস:
          </label>
          <button
            onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              background: settings.isActive ? '#22c55e' : '#ef4444',
              color: '#fff',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            {settings.isActive ? '🟢 চালু' : '🔴 বন্ধ'}
          </button>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {settings.isActive ? 'ডিসপ্লে সক্রিয় থাকবে' : 'ডিসপ্লে বন্ধ থাকবে'}
          </span>
        </div>

        {/* সময়ভিত্তিক চালু/বন্ধ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b', minWidth: '120px' }}>
            সময়ভিত্তিক:
          </label>
          <button
            onClick={() => setSettings({ ...settings, useTimeRange: !settings.useTimeRange })}
            style={{
              padding: '6px 16px',
              borderRadius: '30px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              background: settings.useTimeRange ? '#dbeafe' : '#f1f5f9',
              color: settings.useTimeRange ? '#1e40af' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {settings.useTimeRange ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}
          </button>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {settings.useTimeRange ? 'নির্দিষ্ট সময়ে ডিসপ্লে চালু থাকবে' : 'সব সময় চালু থাকবে'}
          </span>
        </div>

        {/* সময় রেঞ্জ (শুধু useTimeRange true হলে) */}
        {settings.useTimeRange && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', paddingLeft: '20px', borderLeft: '3px solid #dbeafe' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                শুরু সময়
              </label>
              <input
                type="time"
                value={settings.startTime}
                onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#fff'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                শেষ সময়
              </label>
              <input
                type="time"
                value={settings.endTime}
                onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#fff'
                }}
              />
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
              ⏰ এই সময়ের মধ্যে ডিসপ্লে চালু থাকবে
            </div>
          </div>
        )}

        {/* সেভ বাটন */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '10px 28px',
              background: '#1c5fa8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <Save size={16} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
          </button>
          {message && (
            <span style={{ fontSize: '14px', color: message.includes('✅') ? '#16a34a' : '#dc2626' }}>
              {message}
            </span>
          )}
        </div>

        {/* বর্তমান স্ট্যাটাস */}
        <div style={{ marginTop: '8px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
          <strong>বর্তমান স্ট্যাটাস:</strong>{' '}
          {settings.isActive ? (
            settings.useTimeRange ? (
              <>সক্রিয় (শুধুমাত্র {settings.startTime} – {settings.endTime} সময়ের মধ্যে)</>
            ) : (
              <>সক্রিয় (সব সময়)</>
            )
          ) : (
            <>বন্ধ (ডিসপ্লে দেখাবে না)</>
          )}
        </div>
      </div>
    </div>
  );
}