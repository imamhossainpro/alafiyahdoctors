// src/components/BookingSuccess.jsx
// ==================================================
// ✅ BookingSuccess — Thank You page after booking
// ==================================================
// ✅ Animated checkmark
// ✅ Fetch appointment from Firestore for reference
// ✅ Preserves direct doctor link flow
// ✅ Contact info + action buttons
// ==================================================
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  PhoneCall,
  PlusCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { db, doc, getDoc } from '../firebase';
import { useHospital } from '../context/HospitalContext';

// ==================================================
// ✅ CSS
// ==================================================
const SuccessCSS = `
  .booking-success-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
    padding: 20px;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
  }

  .booking-success-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 40px 32px;
    max-width: 560px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    text-align: center;
    animation: fadeIn 0.5s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .success-lottie {
    width: 120px;
    height: 120px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success-checkmark {
    width: 100px;
    height: 100px;
  }

  .success-checkmark circle {
    fill: #22c55e;
    stroke: none;
    stroke-width: 2;
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .success-checkmark path {
    stroke: #ffffff;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
  }

  @keyframes stroke {
    100% { stroke-dashoffset: 0; }
  }

  .success-title {
    font-size: 28px;
    font-weight: 800;
    color: #166534;
    margin-bottom: 8px;
    line-height: 1.3;
  }

  .success-sub {
    font-size: 15px;
    color: #64748b;
    margin-bottom: 24px;
  }

  .success-info-box {
    background: #f0f9ff;
    border: 1.5px solid #bae6fd;
    border-radius: 14px;
    padding: 20px 22px;
    margin-bottom: 18px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 14px;
    text-align: left;
  }

  .success-info-icon {
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    background: #e0f2fe;
    border-radius: 23px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success-info-text {
    flex: 1;
    font-size: 15px;
    color: #0c4a6e;
    line-height: 1.7;
    margin: 0;
  }

  .success-info-text strong {
    color: #1c5fa8;
    font-weight: 700;
  }

  .success-note-box {
    background: #fef9c3;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 14px 20px;
    margin-bottom: 28px;
  }

  .success-note-title {
    font-size: 13.5px;
    color: #92400e;
    margin: 0 0 8px 0;
    font-weight: 700;
  }

  .success-phones {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .success-phone-link {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #1c5fa8;
    color: #fff;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13.5px;
    font-weight: 700;
    transition: all 0.2s;
  }

  .success-phone-link:hover {
    background: #154a82;
    transform: translateY(-1px);
  }

  .success-phone-icon {
    display: flex;
    align-items: center;
  }

  .success-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .success-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 10px;
    font-size: 14.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: inherit;
    flex: 1;
    min-width: 180px;
  }

  .success-btn-primary {
    background: #1c5fa8;
    color: #fff;
  }

  .success-btn-primary:hover {
    background: #154a82;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(28, 95, 168, 0.3);
  }

  .success-btn-secondary {
    background: #f1f5f9;
    color: #1e293b;
    border: 1.5px solid #cbd5e1;
  }

  .success-btn-secondary:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
  }

  .success-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    color: #64748b;
  }

  .success-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 600px) {
    .booking-success-card { padding: 30px 20px; }
    .success-title { font-size: 22px; }
    .success-info-box {
      flex-direction: column;
      text-align: center;
      align-items: center;
      padding: 18px 16px;
    }
    .success-info-text { text-align: center; font-size: 14px; }
    .success-buttons { flex-direction: column; }
    .success-btn { width: 100%; min-width: unset; }
  }
`;

// ==================================================
// ✅ Main Component
// ==================================================
export default function BookingSuccess() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Try to fetch appointment from Firestore (for reference)
  useEffect(() => {
    let mounted = true;

    const loadAppointment = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        const apptRef = doc(
          db,
          'hospitals',
          hospitalId,
          'appointments',
          appointmentId
        );
        const apptSnap = await getDoc(apptRef);

        if (mounted && apptSnap.exists()) {
          setAppointment({ id: apptSnap.id, ...apptSnap.data() });
        }
      } catch (err) {
        console.warn('⚠️ Could not load appointment:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAppointment();

    return () => {
      mounted = false;
    };
  }, [appointmentId, hospitalId]);

  // ✅ Handle navigation
  const handleNewBooking = () => {
    const fromDoctorLink = location.state?.fromDoctorLink;
    const doctorId = location.state?.doctorId;

    if (fromDoctorLink && doctorId) {
      navigate(`/booking/${doctorId}`);
    } else {
      navigate('/booking');
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  // ==================================================
  // ✅ Loading state
  // ==================================================
  if (loading) {
    return (
      <div className="booking-success-wrapper">
        <style>{SuccessCSS}</style>
        <div className="booking-success-card">
          <div className="success-loading">
            <Loader2 size={40} className="success-spin" color="#1c5fa8" />
            <p>লোড হচ্ছে...</p>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // ✅ Success screen
  // ==================================================
  return (
    <div className="booking-success-wrapper">
      <style>{SuccessCSS}</style>
      <div className="booking-success-card">
        {/* Animated Checkmark */}
        <div className="success-lottie">
          <svg
            className="success-checkmark"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle cx="26" cy="26" r="25" fill="none" />
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="success-title">বুকিং সফল হয়েছে!</h3>
        <p className="success-sub">
          আপনার সিরিয়ালটি সফলভাবে জমা হয়েছে
        </p>

        {/* Info Box */}
        <div className="success-info-box">
          <div className="success-info-icon">
            <PhoneCall size={22} color="#1c5fa8" />
          </div>
          <p className="success-info-text">
            আপনার সিরিয়াল নিশ্চিত হলে আপনার মোবাইল নাম্বারে{' '}
            <strong>মেসেজের মাধ্যমে কনফার্মেশন</strong> পাবেন।
          </p>
        </div>

        {/* Contact Note */}
        <div className="success-note-box">
          <p className="success-note-title">
            যেকোনো জিজ্ঞাসায় যোগাযোগ করুন
          </p>
          <div className="success-phones">
            <a href="tel:01886776512" className="success-phone-link">
              <span className="success-phone-icon">
                <PhoneCall size={14} color="#fff" strokeWidth={2.5} />
              </span>
              <span>01886-776512</span>
            </a>
            <a href="tel:01886776513" className="success-phone-link">
              <span className="success-phone-icon">
                <PhoneCall size={14} color="#fff" strokeWidth={2.5} />
              </span>
              <span>01886-776513</span>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-buttons">
          <button
            className="success-btn success-btn-secondary"
            onClick={handleBackHome}
          >
            <ArrowLeft size={18} /> হোমপেজে ফিরে যান
          </button>
          <button
            className="success-btn success-btn-primary"
            onClick={handleNewBooking}
          >
            <PlusCircle size={18} /> আরো একটি সিরিয়াল দিন
          </button>
        </div>
      </div>
    </div>
  );
}