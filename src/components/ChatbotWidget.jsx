// src/components/ChatbotWidget.jsx
// ==================================================
// 💬 ChatbotWidget — Al-Afiyah Hospital
// ==================================================
// ✅ Custom Quick Actions & Google Maps Link Integration
// ✅ Proactive Welcome Message (10s delay) & Messenger-style Popup
// ==================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Mic,
  CalendarPlus,
  RotateCcw,
  MapPin,
} from 'lucide-react';
import axios from 'axios';

// ✅ Production API URL
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://api.alafiyahhospital.com';

const REQUEST_TIMEOUT_MS = 30000; // 30s
const EMPTY_RESPONSE_FALLBACK =
  'দুঃখিত, কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
const TIMEOUT_RESPONSE =
  'উত্তর দিতে বেশি সময় লাগছে। অনুগ্রহ করে আবার চেষ্টা করুন বা হাসপাতালে কল করুন: ০১৮৮৬-৭৭৬৫১২';
const NETWORK_RESPONSE =
  'নেটওয়ার্ক সংযোগে সমস্যা হচ্ছে। ইন্টারনেট চেক করে আবার চেষ্টা করুন।';
const GENERIC_ERROR_RESPONSE =
  'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।';

// ==================================================
// ✅ Quick-action chips
// ==================================================
const QUICK_ACTIONS = [
  { label: 'আজকের ডাক্তার তালিকা', query: 'আজকের ডাক্তার তালিকা' },
  { label: 'টেস্টের মূল্য', query: 'টেস্টের মূল্য' },
  { label: 'হাসপাতালের ঠিকানা', query: 'হাসপাতালের ঠিকানা' },
  { label: 'যোগাযোগ করুন', query: 'হাসপাতালের ফোন নম্বর' },
];

// ==================================================
// ✅ TypingIndicator (reusable) — 3 animated dots
// ==================================================
function TypingIndicator() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        borderBottomLeftRadius: '4px',
      }}
      aria-label="উত্তর তৈরি হচ্ছে"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#1c5fa8',
            display: 'inline-block',
            animation: `typingBounce 1.2s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ শুরুতে মেসেজ খালি থাকবে, ১০ সেকেন্ড পর মেসেজ আসবে
  const [messages, setMessages] = useState([]);
  
  // ✅ পপআপ এবং নোটিফিকেশন ব্যাজের স্টেট
  const [showPopup, setShowPopup] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ বুকিং ফর্ম স্টেট
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'পুরুষ',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ✅ ১০ সেকেন্ড পর স্বাগতম মেসেজ, পপআপ এবং লাল নোটিফিকেশন দেখানোর লজিক
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setMessages([
          {
            role: 'bot',
            text: 'আসসালামু আলাইকুম! আল-আফিয়া হাসপাতালে স্বাগতম। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
            doctors: [],
          }
        ]);
        setIsOpen(false); 
        setHasUnread(true); 
        setShowPopup(true); // পপআপ দেখাবে

        // ✅ ৭ সেকেন্ড পর পপআপ অটোমেটিক হাইড হয়ে যাবে
        setTimeout(() => {
          if (isMountedRef.current) setShowPopup(false);
        }, 7000); 
      }
    }, 10000); // ১০ সেকেন্ড

    return () => clearTimeout(timer);
  }, []);

  // ✅ চ্যাট ওপেন করলে নোটিফিকেশন ও পপআপ মুছে যাবে
  const handleOpenChat = () => {
    setIsOpen(true);
    setHasUnread(false);
    setShowPopup(false);
  };

  // ✅ Lifecycle cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const raf = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, isLoading]);

  // ==================================================
  // ✅ Core message sender
  // ==================================================
  const sendMessage = useCallback(
    async (rawText) => {
      const userMsg = (rawText ?? '').toString().trim();
      if (!userMsg) return;
      if (isLoading || isSubmitting) return; // ✅ duplicate guard

      setIsSubmitting(true);

      setMessages((prev) => [
        ...prev,
        { role: 'user', text: userMsg, doctors: [], ts: Date.now() },
      ]);
      setInput('');

      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/chatbot`,
          { question: userMsg },
          { signal: controller.signal, timeout: REQUEST_TIMEOUT_MS }
        );

        if (!isMountedRef.current) return;

        const answerText =
          (res?.data?.answer && String(res.data.answer).trim()) || '';
        const doctors = Array.isArray(res?.data?.doctors) ? res.data.doctors : [];

        if (!answerText && doctors.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text: EMPTY_RESPONSE_FALLBACK,
              doctors: [],
              isError: true,
              retryText: userMsg,
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: answerText || 'ডাক্তারের তথ্য নিচে দেওয়া হলো।',
            doctors,
            ts: Date.now(),
          },
        ]);
      } catch (err) {
        if (!isMountedRef.current) return;
        if (axios.isCancel(err) || err?.name === 'CanceledError') return;

        let errorText = GENERIC_ERROR_RESPONSE;
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          errorText = TIMEOUT_RESPONSE;
        } else if (!err?.response && err?.request) {
          errorText = NETWORK_RESPONSE;
        } else if (err?.response?.status >= 500) {
          errorText = 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: errorText,
            doctors: [],
            isError: true,
            retryText: userMsg,
          },
        ]);
      } finally {
        clearTimeout(timeoutId);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsSubmitting(false);
        }
      }
    },
    [isLoading, isSubmitting]
  );

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleRetry = (retryText) => {
    if (!retryText) return;
    sendMessage(retryText);
  };

  const handleQuickAction = (q) => {
    sendMessage(q);
  };

  // ==================================================
  // ✅ Booking submit (logic অপরিবর্তিত)
  // ==================================================
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    const mobileRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
    const cleanMobile = bookingForm.mobile.replace(/[^0-9]/g, '');

    if (!mobileRegex.test(cleanMobile) && !mobileRegex.test('0' + cleanMobile)) {
      alert('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)');
      return;
    }
    if (!bookingForm.name || !bookingForm.mobile) {
      alert('নাম এবং মোবাইল নম্বর দিন');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/book-appointment`, {
        doctorId: selectedDoctorForBooking.id,
        name: bookingForm.name,
        mobile: bookingForm.mobile,
        age: bookingForm.age,
        gender: bookingForm.gender,
        bookingDate: new Date().toISOString().split('T')[0],
      });

      if (res.data.success) {
        const successMsg = `বুকিং সফল হয়েছে! আপনার সিরিয়াল নম্বর: ${res.data.serialNo}। অনুগ্রহ করে সময়মতো হাসপাতালে আসুন।`;

        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: `✅ ${successMsg}`, doctors: [], ts: Date.now() },
        ]);

        setTimeout(() => {
          if (!isMountedRef.current) return;
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text:
                'আরও কিছু জানতে চান? অন্য ডাক্তার খুঁজতে পারেন, অথবা হাসপাতালের ঠিকানা/সময় জিজ্ঞেস করতে পারেন।',
              doctors: [],
              ts: Date.now(),
            },
          ]);
        }, 1200);

        setSelectedDoctorForBooking(null);
        setBookingForm({ name: '', mobile: '', age: '', gender: 'পুরুষ' });
      } else {
        alert(res.data.error || 'বুকিং ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('বুকিং করতে সমস্যা হয়েছে');
    } finally {
      setBookingLoading(false);
    }
  };

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <>
      <style>{`
        /* === চ্যাট বাটন === */
        .chat-fab {
          position: fixed !important;
          bottom: max(24px, env(safe-area-inset-bottom, 24px)) !important;
          right: max(24px, env(safe-area-inset-right, 24px)) !important;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1c5fa8, #0d9488);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4);
          cursor: pointer;
          z-index: 99999 !important;
          border: none;
          transition: transform 0.2s ease;
        }
        .chat-fab:hover { transform: scale(1.08); }

        /* ✅ লাল নোটিফিকেশন ব্যাজ */
        .chat-badge { 
          position: absolute; 
          top: -2px; 
          right: -2px; 
          background: #ef4444; 
          color: white; 
          font-size: 12px; 
          font-weight: bold; 
          width: 22px; 
          height: 22px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: 2px solid #fff; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
          animation: bounceIn 0.5s ease; 
        }
        
        /* ✅ মেসেঞ্জার স্টাইল পপআপ মেসেজ */
        .chat-popup { 
          position: fixed; 
          bottom: 100px; 
          right: 32px; 
          background: #fff; 
          padding: 12px 16px; 
          border-radius: 12px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
          border: 1px solid #e2e8f0; 
          font-size: 14px; 
          color: #1e293b; 
          z-index: 99998; 
          max-width: 250px; 
          animation: popUpFade 0.5s ease; 
          cursor: pointer; 
          font-family: 'Hind Siliguri', sans-serif; 
        }
        .chat-popup::after { 
          content: ''; 
          position: absolute; 
          bottom: -6px; 
          right: 20px; 
          width: 12px; 
          height: 12px; 
          background: #fff; 
          transform: rotate(45deg); 
          border-bottom: 1px solid #e2e8f0; 
          border-right: 1px solid #e2e8f0; 
        }

        /* === চ্যাট উইন্ডো === */
        .chat-window {
          position: fixed !important;
          bottom: max(96px, calc(env(safe-area-inset-bottom, 0px) + 96px)) !important;
          right: max(24px, env(safe-area-inset-right, 24px)) !important;
          width: 380px;
          height: min(560px, calc(100dvh - 120px));
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 99999 !important;
          overflow: hidden;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          border: 1px solid #e2e8f0;
        }
        .chat-header {
          background: linear-gradient(135deg, #1c5fa8, #0d9488);
          color: #fff;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .chat-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
        .chat-header p { margin: 2px 0 0 0; font-size: 11.5px; opacity: 0.9; }
        .chat-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-left: 8px;
        }

        /* === মেসেজ এরিয়া === */
        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          overflow-x: hidden;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .chat-message { display: flex; gap: 8px; max-width: 92%; }
        .chat-message.user { align-self: flex-end; flex-direction: row-reverse; }
        .chat-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          unicode-bidi: plaintext;
        }
        .chat-message.bot .chat-bubble {
          background: #fff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 4px;
        }
        .chat-message.user .chat-bubble {
          background: #1c5fa8;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .chat-message.bot.is-error .chat-bubble {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .chat-message.bot .chat-avatar { background: #dbeafe; color: #1c5fa8; }
        .chat-message.user .chat-avatar { background: #ccfbf1; color: #0d9488; }

        /* === Quick actions === */
        .quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 12px;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .quick-chip {
          padding: 6px 10px;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #1c5fa8;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .quick-chip:hover {
          background: #1c5fa8;
          color: #fff;
          border-color: #1c5fa8;
        }
        .quick-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* === ইনপুট এরিয়া === */
        .chat-input-area {
          padding: 10px 12px;
          padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
          background: #fff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }
        .chat-input-area input {
          flex: 1;
          min-width: 0;
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 20px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
        }
        .chat-input-area input:focus { border-color: #1c5fa8; }

        .chat-action-btn {
          background: #f1f5f9;
          color: #475569;
          border: none;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .chat-action-btn:hover:not(:disabled) { background: #e2e8f0; }
        .chat-send-btn {
          background: #1c5fa8;
          color: white;
          border: none;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .chat-send-btn:disabled { background: #94a3b8; cursor: not-allowed; }

        /* === Typing dots animation === */
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        
        @keyframes bounceIn { 
          0% { transform: scale(0); } 
          50% { transform: scale(1.2); } 
          100% { transform: scale(1); } 
        }
        
        @keyframes popUpFade { 
          0% { opacity: 0; transform: translateY(10px) scale(0.95); } 
          100% { opacity: 1; transform: translateY(0) scale(1); } 
        }

        /* === Retry button === */
        .retry-btn {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: #fff;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .retry-btn:hover { background: #fef2f2; }

        /* === ডাক্তার কার্ড === */
        .doctor-chat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          margin-top: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .doctor-chat-header { display: flex; align-items: center; gap: 12px; }
        .doctor-chat-img {
          width: 50px; height: 50px; border-radius: 50%;
          object-fit: cover; border: 2px solid #e2e8f0;
        }
        .doctor-chat-placeholder {
          width: 50px; height: 50px; border-radius: 50%;
          background: #e2e8f0; display: flex; align-items: center;
          justify-content: center; border: 2px solid #cbd5e1;
        }
        .doctor-chat-info h4 { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; }
        .doctor-chat-info p { margin: 2px 0 0 0; font-size: 12px; color: #64748b; }
        .doctor-chat-info .time {
          margin: 4px 0 0 0; font-size: 12px;
          color: #0d9488; font-weight: 600;
        }
        .doctor-chat-btn {
          width: 100%; padding: 9px;
          background: linear-gradient(135deg, #1c5fa8, #0d9488);
          color: white; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 6px; transition: opacity 0.2s; font-family: inherit;
        }
        .doctor-chat-btn:hover { opacity: 0.9; }

        /* === বুকিং মডাল === */
        .booking-modal-overlay {
          position: absolute; inset: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 100000; padding: 16px;
        }
        .booking-modal {
          background: #fff; width: 100%; border-radius: 16px;
          padding: 20px; display: flex; flex-direction: column;
          gap: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .booking-modal h4 {
          margin: 0 0 8px 0; color: #1c5fa8;
          text-align: center; font-size: 16px;
        }
        .booking-modal input, .booking-modal select {
          width: 100%; padding: 10px;
          border: 1.5px solid #cbd5e1; border-radius: 8px;
          font-size: 14px; font-family: inherit; box-sizing: border-box;
        }
        .booking-modal-actions { display: flex; gap: 8px; margin-top: 8px; }
        .booking-modal-actions button {
          flex: 1; padding: 10px; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
        }
        .booking-modal-actions .cancel { background: #f1f5f9; color: #475569; }
        .booking-modal-actions .submit { background: #1c5fa8; color: white; }
        .booking-modal-actions .submit:disabled { background: #94a3b8; cursor: not-allowed; }

        /* === Mobile === */
        @media (max-width: 480px) {
          .chat-window {
            width: 100vw;
            height: 100dvh;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 0;
            border: none;
          }
          .chat-popup { bottom: 90px; right: 16px; }
        }
      `}</style>

      {isOpen && (
        <div className="chat-window" style={{ position: 'relative' }}>
          {/* বুকিং মডাল */}
          {selectedDoctorForBooking && (
            <div className="booking-modal-overlay">
              <form className="booking-modal" onSubmit={handleBookingSubmit}>
                <h4>{selectedDoctorForBooking.name} এর সিরিয়াল</h4>
                <input
                  type="text"
                  placeholder="রোগীর নাম *"
                  value={bookingForm.name}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, name: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর *"
                  value={bookingForm.mobile}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, mobile: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="বয়স"
                  value={bookingForm.age}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, age: e.target.value })
                  }
                />
                <select
                  value={bookingForm.gender}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, gender: e.target.value })
                  }
                >
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="মহিলা">মহিলা</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
                <div className="booking-modal-actions">
                  <button
                    type="button"
                    className="cancel"
                    onClick={() => setSelectedDoctorForBooking(null)}
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="submit"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'বুকিং হচ্ছে...' : 'বুকিং নিশ্চিত করুন'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Header */}
          <div className="chat-header">
            <div>
              <h3>আল-আফিয়াহ সহায়ক</h3>
              <p>প্রশ্ন করুন · ডাক্তার খুঁজুন</p>
            </div>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="চ্যাট বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages" ref={messagesContainerRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role} ${msg.isError ? 'is-error' : ''}`}
              >
                <div className="chat-avatar">
                  {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="chat-bubble">
                    {msg.text}
                    {/* ✅ গুগল ম্যাপ লিংক (শুধু ঠিকানা থাকলে দেখাবে) */}
                    {msg.text && msg.text.includes('বাকলিয়া') && (
                      <div style={{ marginTop: '10px' }}>
                        <a 
                          href="https://maps.google.com/?q=Al-Afiyah+Hospital+Bakalia+Chattogram" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            background: '#e0f2fe', 
                            color: '#0369a1', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            textDecoration: 'none', 
                            fontWeight: '600', 
                            fontSize: '13px' 
                          }}
                        >
                          <MapPin size={14} /> গুগল ম্যাপে দেখুন
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Retry */}
                  {msg.isError && msg.retryText && (
                    <button
                      className="retry-btn"
                      onClick={() => handleRetry(msg.retryText)}
                      disabled={isLoading}
                    >
                      <RotateCcw size={12} /> আবার চেষ্টা করুন
                    </button>
                  )}

                  {/* Doctor cards */}
                  {msg.doctors && msg.doctors.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {msg.doctors.map((doc, idx) => (
                        <div key={idx} className="doctor-chat-card">
                          <div className="doctor-chat-header">
                            {doc.imageUrl ? (
                              <img
                                src={doc.imageUrl}
                                alt={doc.name}
                                className="doctor-chat-img"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="doctor-chat-placeholder">
                                <User size={24} color="#94a3b8" />
                              </div>
                            )}
                            <div className="doctor-chat-info">
                              <h4>{doc.name}</h4>
                              <p>{doc.specialty || doc.deptName}</p>
                              {doc.timeSlots && doc.timeSlots.length > 0 && (
                                <p className="time">
                                  ⏱ {doc.timeSlots[0].start} -{' '}
                                  {doc.timeSlots[0].end}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            className="doctor-chat-btn"
                            onClick={() => setSelectedDoctorForBooking(doc)}
                          >
                            <CalendarPlus size={14} /> সিরিয়াল দিন
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="chat-message bot">
                <div className="chat-avatar">
                  <Bot size={18} />
                </div>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="quick-actions">
            {QUICK_ACTIONS.map((qa, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-chip"
                onClick={() => handleQuickAction(qa.query)}
                disabled={isLoading || isSubmitting}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form className="chat-input-area" onSubmit={handleSubmit}>
            <button
              type="button"
              className="chat-action-btn"
              onClick={() =>
                alert('ভয়েস ইনপুট শীঘ্রই আসছে। এখন টাইপ করে প্রশ্ন করুন।')
              }
              title="ভয়েস ইনপুট (শীঘ্রই আসছে)"
              aria-label="ভয়েস ইনপুট"
            >
              <Mic size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন..."
              disabled={isLoading || isSubmitting}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isLoading || isSubmitting}
              aria-label="পাঠান"
            >
              {isLoading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      )}

      {/* ✅ মেসেঞ্জারের মতো পপআপ মেসেজ */}
      {showPopup && !isOpen && (
        <div className="chat-popup" onClick={handleOpenChat}>
          <strong>আল-আফিয়াহ হসপিটাল:</strong><br/>
          আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?
        </div>
      )}

      {!isOpen && (
        <button
          className="chat-fab"
          onClick={handleOpenChat}
          title="চ্যাট করুন"
          aria-label="চ্যাট খুলুন"
        >
          <MessageCircle size={28} />
          {/* ✅ লাল নোটিফিকেশন ব্যাজ */}
          {hasUnread && <span className="chat-badge">1</span>}
        </button>
      )}
    </>
  );
}