// src/components/admin/TrainChatbot.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Save } from 'lucide-react';

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
      alert('✅ সফলভাবে ট্রেইন করা হয়েছে!');
      setQuestion('');
      setAnswer('');
    } catch (err) {
      alert('❌ ট্রেইন করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Bot size={28} color="#1c5fa8" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>চ্যাটবট ট্রেইনিং</h2>
      </div>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        এখানে নতুন প্রশ্ন ও উত্তর দিলে চ্যাটবট তা মুখস্থ করে নেবে। (যেমন: প্রশ্ন: "হ্যালো", উত্তর: "আসসালামু আলাইকুম! আল-আফিয়া হাসপাতালে স্বাগতম।")
      </p>
      
      <form onSubmit={handleTrain} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>প্রশ্ন (যা ইউজার লিখবে)</label>
          <input 
            type="text" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            placeholder="যেমন: হ্যালো" 
            style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '6px', fontSize: '14px', outline: 'none' }} 
            required 
          />
        </div>
        <div>
          <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>উত্তর</label>
          <textarea 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)} 
            placeholder="যেমন: আসসালামু আলাইকুম! আল-আফিয়া হাসপাতালে স্বাগতম। কীভাবে সাহায্য করতে পারি?" 
            style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '6px', minHeight: '120px', fontSize: '14px', outline: 'none', resize: 'vertical' }} 
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: '14px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
        >
          {loading ? 'সেভ হচ্ছে...' : <><Save size={18} /> ট্রেইন করুন</>}
        </button>
      </form>
    </div>
  );
}