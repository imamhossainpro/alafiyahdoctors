import React, { useState, useEffect, useMemo } from 'react';
import { db, doc, getDoc, setDoc, addDoc, collection } from './firebase';
import { Send, Loader2, CheckCircle2, User, Phone, MapPin, Stethoscope } from 'lucide-react';

const BookingCSS = `
  .booking-wrapper {
    max-width: 650px;
    margin: 40px auto;
    padding: 20px;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
    background: #f4f7f6;
    border-radius: 20px;
  }
  .booking-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    padding: 30px;
    border: 1px solid #e2e8f0;
  }
  .booking-title {
    text-align: center;
    color: #0f766e;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 25px;
  }
  .form-section {
    margin-bottom: 25px;
  }
  .section-title {
    font-size: 15px;
    font-weight: 700;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }
  .form-group {
    margin-bottom: 15px;
  }
  .form-group label {
    display: block;
    font-size: 13.5px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
  }
  .input, .select, .textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    color: #1e293b;
    background: #fff;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  .input:focus, .select:focus, .textarea:focus {
    outline: none;
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
  }
  .textarea {
    resize: vertical;
    min-height: 80px;
  }
  .conditional-field {
    margin-top: 10px;
    padding: 10px;
    background: #f0fdfa;
    border-left: 3px solid #0d9488;
    border-radius: 0 8px 8px 0;
    animation: slideDown 0.3s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .doctor-options {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-top: 10px;
    background: #fff;
  }
  .doctor-option {
    padding: 12px 15px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .doctor-option:last-child { border-bottom: none; }
  .doctor-option:hover, .doctor-option.selected {
    background: #f0fdfa;
  }
  .doctor-name { font-weight: 700; color: #1e293b; font-size: 15px; }
  .doctor-details { font-size: 12.5px; color: #64748b; margin-top: 2px; }
  .summary-box {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 20px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .summary-label { color: #64748b; font-weight: 500; }
  .summary-value { color: #1e293b; font-weight: 700; text-align: right; }
  .submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(45deg, #0d9488, #14b8a6);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    transition: transform 0.1s ease;
  }
  .submit-btn:active { transform: scale(0.98); }
  .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  .success-msg {
    text-align: center;
    color: #047857;
    font-weight: 600;
    margin-top: 20px;
    padding: 15px;
    background: #ecfdf5;
    border-radius: 12px;
    border: 1px solid #a7f3d0;
    font-size: 15px;
    line-height: 1.6;
  }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .booking-wrapper { margin: 0; padding: 10px; }
    .booking-card { padding: 20px; }
    .summary-row { flex-direction: column; gap: 4px; }
    .summary-value { text-align: left; }
  }
`;

export default function BookingSystem({ departments }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    mobile: '',
    gender: 'পুরুষ',
    address: '',
    referralSource: 'Walk-in / নিজে এসেছেন',
    referredDoctorName: '',
    departmentId: '',
    doctorId: ''
  });

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Existing ফাংশনালিটি থেকে ডাক্তারদের লিস্ট বের করা
  const allDoctors = useMemo(() => {
    let docs = [];
    if (departments) {
      departments.forEach(dept => {
        dept.doctors.forEach(doc => {
          docs.push({ ...doc, deptName: dept.name, deptId: dept.id });
        });
      });
    }
    return docs;
  }, [departments]);

  // ডিপার্টমেন্ট ফিল্টার অনুযায়ী ডাক্তার
  const filteredDoctors = useMemo(() => {
    if (!formData.departmentId) return allDoctors;
    return allDoctors.filter(doc => doc.deptId === formData.departmentId);
  }, [allDoctors, formData.departmentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccessMsg('');

    // ডাক্তার পরিবর্তন হলে পুরনো সিলেকশন রিসেট
    if (name === 'departmentId' || name === 'doctorId') {
      setSelectedDoctor(null);
      if (name === 'departmentId') {
        setFormData(prev => ({ ...prev, doctorId: '' }));
      }
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({ ...prev, doctorId: doctor.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      if (!selectedDoctor) throw new Error('ডাক্তার নির্বাচন করুন');

      // ১. সিরিয়াল নম্বর তৈরির Existing লজিক (Firestore Counter)
      const counterRef = doc(db, 'counters', selectedDoctor.id);
      let serialNo = 1;
      const counterDoc = await getDoc(counterRef);
      if (counterDoc.exists()) {
        serialNo = counterDoc.data().count + 1;
        await setDoc(counterRef, { count: serialNo }, { merge: true });
      } else {
        await setDoc(counterRef, { count: serialNo });
      }

      // ২. অ্যাপয়েন্টমেন্ট ডেটা Firebase-এ সেভ (Referral এবং Appointment Doctor আলাদা)
      const appointmentData = {
        ...formData,
        doctorName: selectedDoctor.name,
        doctorDept: selectedDoctor.deptName,
        doctorQuals: selectedDoctor.quals || '',
        serialNo: serialNo,
        status: 'pending', // Important for Admin Dashboard
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);

      // ৩. সাকসেস মেসেজ
      setSuccessMsg(`ধন্যবাদ, আপনার সিরিয়ালটি কনফার্ম করা হয়েছে (সিরিয়াল: ${serialNo})। শীঘ্রই একজন প্রতিনিধি আপনাকে সিরিয়াল নাম্বার ও সময় জানিয়ে দিবেন।`);
      
      // ফর্ম রিসেট
      setFormData({
        name: '', age: '', mobile: '', gender: 'পুরুষ', address: '',
        referralSource: 'Walk-in / নিজে এসেছেন', referredDoctorName: '',
        departmentId: '', doctorId: ''
      });
      setSelectedDoctor(null);

    } catch (error) {
      console.error("Booking error:", error);
      alert("বুকিং সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-wrapper">
      <style>{BookingCSS}</style>
      <div className="booking-card">
        <h2 className="booking-title">রোগীর ডাক্তার বুকিং ফর্ম</h2>

        <form onSubmit={handleSubmit}>
          {/* 1. Patient Information */}
          <div className="form-section">
            <div className="section-title"><User size={18} /> রোগীর তথ্য</div>
            <div className="form-group">
              <label>রোগীর নাম</label>
              <input type="text" className="input" name="name" value={formData.name} onChange={handleChange} required placeholder="আপনার পুরো নাম" />
            </div>
            <div className="form-group">
              <label>বয়স</label>
              <input type="number" className="input" name="age" value={formData.age} onChange={handleChange} required placeholder="বয়স" />
            </div>
            <div className="form-group">
              <label>মোবাইল নম্বর</label>
              <input type="tel" className="input" name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="01XXXXXXXXX" />
            </div>
            <div className="form-group">
              <label>লিঙ্গ</label>
              <select className="select" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="পুরুষ">পুরুষ</option>
                <option value="মহিলা">মহিলা</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>
            <div className="form-group">
              <label>বর্তমান ঠিকানা</label>
              <textarea className="textarea" name="address" value={formData.address} onChange={handleChange} required placeholder="বর্তমান ঠিকানা" />
            </div>
          </div>

          {/* 2. Referral Information */}
          <div className="form-section">
            <div className="section-title"><MapPin size={18} /> রেফারেল তথ্য</div>
            <div className="form-group">
              <label>রোগী কীভাবে/কার মাধ্যমে এসেছেন?</label>
              <select className="select" name="referralSource" value={formData.referralSource} onChange={handleChange}>
                <option>Walk-in / নিজে এসেছেন</option>
                <option>Refer Doctor</option>
                <option>Facebook</option>
                <option>Google</option>
                <option>Campaign / Medical Camp</option>
                <option>আত্মীয়/বন্ধু</option>
                <option>অন্যান্য</option>
              </select>
            </div>

            {/* Conditional Searchable Field */}
            {formData.referralSource === 'Refer Doctor' && (
              <div className="conditional-field">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>রেফারিং ডাক্তারের নাম লিখুন</label>
                  <input type="text" className="input" name="referredDoctorName" value={formData.referredDoctorName} onChange={handleChange} placeholder="যেমনঃ ডাঃ কামরুল হাসান" />
                </div>
              </div>
            )}
          </div>

          {/* 3. Appointment Doctor Selection */}
          <div className="form-section">
            <div className="section-title"><Stethoscope size={18} /> অ্যাপয়েন্টমেন্ট ডাক্তার নির্বাচন</div>
            
            <div className="form-group">
              <label>বিভাগ নির্বাচন করুন</label>
              <select className="select" name="departmentId" value={formData.departmentId} onChange={handleChange}>
                <option value="">সব বিভাগ</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>ডাক্তার নির্বাচন করুন</label>
              <div className="doctor-options">
                {filteredDoctors.length === 0 ? (
                  <div style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>কোনো ডাক্তার পাওয়া যায়নি</div>
                ) : (
                  filteredDoctors.map(doc => (
                    <div
                      key={doc.id}
                      className={`doctor-option ${selectedDoctor?.id === doc.id ? 'selected' : ''}`}
                      onClick={() => handleDoctorSelect(doc)}
                    >
                      <div>
                        <div className="doctor-name">{doc.name}</div>
                        <div className="doctor-details">
                          {doc.specialty || doc.quals || doc.deptName}
                        </div>
                      </div>
                      {selectedDoctor?.id === doc.id && <CheckCircle2 size={18} color="#0d9488" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. Booking Summary */}
          {(formData.name || selectedDoctor || formData.referralSource) && (
            <div className="summary-box">
              <div className="section-title" style={{ borderBottom: 'none', marginBottom: '10px', paddingBottom: '0' }}>বুকিং সামারি</div>
              <div className="summary-row">
                <span className="summary-label">রোগীর নাম:</span>
                <span className="summary-value">{formData.name || '-'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">মোবাইল:</span>
                <span className="summary-value">{formData.mobile || '-'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">নির্বাচিত ডাক্তার:</span>
                <span className="summary-value">{selectedDoctor?.name || '-'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">বিভাগ:</span>
                <span className="summary-value">{selectedDoctor?.deptName || '-'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">রেফারেল সোর্স:</span>
                <span className="summary-value">{formData.referralSource || '-'}</span>
              </div>
              {formData.referredDoctorName && (
                <div className="summary-row">
                  <span className="summary-label">রেফারিং ডাক্তার:</span>
                  <span className="summary-value">{formData.referredDoctorName}</span>
                </div>
              )}
            </div>
          )}

          {/* 5. Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />} 
            বুকিং নিশ্চিত করুন
          </button>

          {successMsg && (
            <div className="success-msg">
              <CheckCircle2 size={32} /> 
              <div style={{ marginTop: '10px' }}>{successMsg}</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}