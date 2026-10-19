import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://api.alafiyahhospital.com';

export default function TrainChatbot() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrain = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/train-chatbot`, { question, answer });
      alert('সফলভাবে ট্রেইন করা হয়েছে!');
      setQuestion('');
      setAnswer('');
    } catch (err) {
      alert('ট্রেইন করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <h2>🤖 চ্যাটবট ট্রেইনিং</h2>
      <p style={{ color: '#64748b', fontSize: '14px' }}>এখানে নতুন প্রশ্ন ও উত্তর দিলে চ্যাটবট তা শিখে যাবে।</p>
      
      <form onSubmit={handleTrain} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ fontWeight: '600', fontSize: '14px' }}>প্রশ্ন (যা ইউজার লিখবে)</label>
          <input 
            type="text" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            placeholder="যেমন: আপনার হাসপাতালে অ্যাম্বুলেন্স সার্ভিস আছে কি?" 
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '5px' }}
            required 
          />
        </div>
        <div>
          <label style={{ fontWeight: '600', fontSize: '14px' }}>উত্তর</label>
          <textarea 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)} 
            placeholder="যেমন: হ্যাঁ, আমাদের ২৪ ঘণ্টা অ্যাম্বুলেন্স সার্ভিস আছে। কল করুন: ০১৮৮৬-৭৭৬৫১২" 
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '5px', minHeight: '100px' }}
            required 
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? 'সেভ হচ্ছে...' : 'ট্রেইন করুন'}
        </button>
      </form>
    </div>
  );
}