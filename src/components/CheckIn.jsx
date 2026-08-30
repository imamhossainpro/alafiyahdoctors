import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, User, Stethoscope, Calendar, Clock, MapPin } from 'lucide-react';
import { verifyQRCode, checkInWithQR, getAppointmentQR } from '../services/qrService';
import { db, doc, getDoc } from '../firebase';

const CheckInCSS = `
  .checkin-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
    padding: 20px;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
  }
  .checkin-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 40px 32px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    text-align: center;
  }
  .checkin-icon { font-size: 64px; margin-bottom: 16px; }
  .checkin-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  .checkin-sub { font-size: 16px; color: #475569; margin-bottom: 24px; }
  .checkin-patient-info {
    background: #f8fafc;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    text-align: left;
    border: 1px solid #e2e8f0;
  }
  .checkin-info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
    font-size: 15px;
    color: #1e293b;
  }
  .checkin-info-row strong { color: #0f172a; min-width: 80px; }
  .checkin-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .checkin-btn-primary {
    background: #1c5fa8;
    color: #fff;
  }
  .checkin-btn-primary:hover { background: #154a82; transform: translateY(-2px); }
  .checkin-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .checkin-btn-success {
    background: #22c55e;
    color: #fff;
  }
  .checkin-btn-success:hover { background: #16a34a; }
  .checkin-error {
    background: #fee2e2;
    color: #991b1b;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .checkin-success {
    background: #dcfce7;
    color: #166534;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .checkin-success-icon { font-size: 56px; margin-bottom: 8px; }
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default function CheckIn() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [success, setSuccess] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (!appointmentId || hasChecked.current) return;
      hasChecked.current = true;
      
      try {
        // অ্যাপয়েন্টমেন্ট ডেটা লোড
        const apptRef = doc(db, 'appointments', appointmentId);
        const apptSnap = await getDoc(apptRef);
        if (!apptSnap.exists()) {
          setError('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি');
          setLoading(false);
          return;
        }
        const data = apptSnap.data();
        setAppointment({ id: appointmentId, ...data });
        
        // QR কোড লোড
        const qr = await getAppointmentQR(appointmentId);
        setQrCode(qr);
        
        // যদি ইতিমধ্যে চেক-ইন হয়ে থাকে
        if (data.status === 'checked-in' || data.status === 'completed') {
          setSuccess(true);
        }
      } catch (err) {
        setError(err.message || 'ডেটা লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [appointmentId]);

  const handleCheckIn = async () => {
    if (checkingIn || !appointment) return;
    setCheckingIn(true);
    setError('');
    
    try {
      // QR কোড দিয়ে চেক-ইন
      await checkInWithQR(appointmentId);
      setSuccess(true);
      // অ্যাপয়েন্টমেন্ট স্টেট আপডেট
      setAppointment(prev => ({ ...prev, status: 'checked-in' }));
    } catch (err) {
      setError(err.message || 'চেক-ইন করতে সমস্যা হয়েছে');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="checkin-wrapper">
        <style>{CheckInCSS}</style>
        <div className="checkin-card">
          <Loader2 className="spinner" size={40} color="#1c5fa8" />
          <p style={{ marginTop: '12px', color: '#64748b' }}>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-wrapper">
      <style>{CheckInCSS}</style>
      <div className="checkin-card">
        
        {/* এরর মেসেজ */}
        {error && (
          <div className="checkin-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* সাকসেস */}
        {success ? (
          <>
            <div className="checkin-success">
              <div className="checkin-success-icon">✅</div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>
                চেক-ইন সফল হয়েছে!
              </h3>
              <p style={{ margin: 0, fontSize: '15px' }}>
                আপনার সিরিয়াল {appointment?.serialNo} কনফার্ম করা হয়েছে।
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#166534' }}>
                ডাক্তারের কাছে যাওয়ার জন্য প্রস্তুত হন।
              </p>
            </div>
            <button
              onClick={handleBack}
              className="checkin-btn checkin-btn-primary"
            >
              হোমপেজে ফিরে যান
            </button>
          </>
        ) : (
          <>
            <div className="checkin-icon">🏥</div>
            <h1 className="checkin-title">চেক-ইন করুন</h1>
            <p className="checkin-sub">আপনার সিরিয়াল নিশ্চিত করতে নিচের বাটনে ক্লিক করুন</p>

            {/* রোগীর তথ্য */}
            {appointment && (
              <div className="checkin-patient-info">
                <div className="checkin-info-row">
                  <User size={18} color="#1c5fa8" />
                  <strong>রোগী:</strong> {appointment.name}
                </div>
                <div className="checkin-info-row">
                  <Stethoscope size={18} color="#1c5fa8" />
                  <strong>ডাক্তার:</strong> {appointment.doctorName}
                </div>
                <div className="checkin-info-row">
                  <Calendar size={18} color="#1c5fa8" />
                  <strong>তারিখ:</strong> {appointment.bookingDate}
                </div>
                <div className="checkin-info-row">
                  <Clock size={18} color="#1c5fa8" />
                  <strong>সিরিয়াল:</strong> {appointment.serialNo}
                </div>
              </div>
            )}

            {/* QR কোড (যদি থাকে) */}
            {qrCode && (
              <div style={{ marginBottom: '16px' }}>
                <img src={qrCode} alt="QR Code" style={{ width: '120px', height: '120px' }} />
              </div>
            )}

            <button
              onClick={handleCheckIn}
              disabled={checkingIn || !appointment}
              className={`checkin-btn ${checkingIn ? '' : 'checkin-btn-primary'}`}
              style={checkingIn ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
            >
              {checkingIn ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  চেক-ইন হচ্ছে...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  চেক-ইন করুন
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}