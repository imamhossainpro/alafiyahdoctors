// src/components/MOUPage.jsx
// ==================================================
// 📄 MOU Page — Memorandum of Understanding
// ==================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  Shield,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export default function MOUPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('PDF download feature শীঘ্রই আসছে।');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f6fa',
        padding: '40px 20px',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* ========== Top Bar ========== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              fontWeight: '600',
            }}
          >
            <ArrowLeft size={16} /> ফিরে যান
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#475569',
                fontWeight: '600',
              }}
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1c5fa8',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
                fontWeight: '600',
              }}
            >
              <Printer size={16} /> প্রিন্ট
            </button>
          </div>
        </div>

        {/* ========== Header ========== */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '2px solid #e2e8f0',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1c5fa8, #4fa3d1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FileText size={40} color="#fff" />
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: '#1c5fa8',
              margin: '0 0 8px 0',
            }}
          >
            সমঝোতা স্মারক
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#64748b',
              margin: 0,
              fontWeight: '600',
            }}
          >
            Memorandum of Understanding (MOU)
          </p>
        </div>

        {/* ========== Body ========== */}
        <div
          style={{
            lineHeight: '1.8',
            color: '#334155',
            fontSize: '15px',
          }}
        >
          {/* Section 1: Parties */}
          <section style={{ marginBottom: '28px' }}>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                color: '#1e293b',
                margin: '0 0 12px 0',
              }}
            >
              <Building2 size={20} color="#1c5fa8" />
              ১. পক্ষগণ
            </h2>
            <div
              style={{
                background: '#f8fafc',
                padding: '16px 20px',
                borderRadius: '10px',
                borderLeft: '4px solid #1c5fa8',
              }}
            >
              <p style={{ margin: '0 0 12px 0' }}>
                <strong>প্রথম পক্ষ:</strong> আল-আফিয়া হাসপাতাল এন্ড ডায়াগনস্টিক সেন্টার
              </p>
              <p style={{ margin: '0 0 12px 0' }}>
                <strong>ঠিকানা:</strong> বাকলিয়া এক্সেস রোড, বাকলিয়া, চট্টগ্রাম
              </p>
              <p style={{ margin: 0 }}>
                <strong>দ্বিতীয় পক্ষ:</strong> (রোগী / ব্যবহারকারী)
              </p>
            </div>
          </section>

          {/* Section 2: Purpose */}
          <section style={{ marginBottom: '28px' }}>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                color: '#1e293b',
                margin: '0 0 12px 0',
              }}
            >
              <Shield size={20} color="#1c5fa8" />
              ২. উদ্দেশ্য
            </h2>
            <p>
              এই সমঝোতা স্মারকের উদ্দেশ্য হলো হাসপাতাল এবং রোগীর মধ্যে
              স্বাস্থ্যসেবা সংক্রান্ত পারস্পরিক দায়-দায়িত্ব, শর্তাবলি ও
              গোপনীয়তা রক্ষার নীতি নির্ধারণ করা।
            </p>
          </section>

          {/* Section 3: Terms */}
          <section style={{ marginBottom: '28px' }}>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                color: '#1e293b',
                margin: '0 0 12px 0',
              }}
            >
              <CheckCircle2 size={20} color="#1c5fa8" />
              ৩. শর্তাবলি
            </h2>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                রোগী সঠিক ও সত্য তথ্য প্রদান করবেন।
              </li>
              <li style={{ marginBottom: '8px' }}>
                হাসপাতাল রোগীর ব্যক্তিগত তথ্য গোপন রাখবে।
              </li>
              <li style={{ marginBottom: '8px' }}>
                সিরিয়াল নিশ্চিত করার পর নির্ধারিত সময়ে উপস্থিত থাকতে হবে।
              </li>
              <li style={{ marginBottom: '8px' }}>
                জরুরি অবস্থা ছাড়া সিরিয়াল বাতিল করা যাবে না।
              </li>
              <li style={{ marginBottom: '8px' }}>
                সব পেমেন্ট হাসপাতালের অফিসিয়াল চ্যানেলের মাধ্যমে করতে হবে।
              </li>
            </ul>
          </section>

          {/* Section 4: Contact */}
          <section style={{ marginBottom: '28px' }}>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                color: '#1e293b',
                margin: '0 0 12px 0',
              }}
            >
              <Phone size={20} color="#1c5fa8" />
              ৪. যোগাযোগ
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Phone size={18} color="#1c5fa8" />
                <span>01886-776512</span>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Phone size={18} color="#1c5fa8" />
                <span>01886-776513</span>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Mail size={18} color="#1c5fa8" />
                <span>info@alafiyahhospital.com</span>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <MapPin size={18} color="#1c5fa8" />
                <span>বাকলিয়া, চট্টগ্রাম</span>
              </div>
            </div>
          </section>

          {/* Section 5: Agreement */}
          <section
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              padding: '16px 20px',
              borderRadius: '10px',
              marginBottom: '24px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14.5px',
                color: '#166534',
                fontWeight: '600',
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#16a34a',
                }}
              />
              <span>
                আমি উপরের সব শর্তাবলি পড়েছি, বুঝেছি এবং সম্মত আছি।
              </span>
            </label>
          </section>
        </div>

        {/* ========== Footer ========== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
            সর্বশেষ আপডেট: {new Date().toLocaleDateString('bn-BD')}
          </p>
          <button
            disabled={!agreed}
            onClick={() => navigate('/booking')}
            style={{
              padding: '12px 28px',
              background: agreed ? '#1c5fa8' : '#94a3b8',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: agreed ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            সম্মত ও এগিয়ে যান →
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #fff; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}