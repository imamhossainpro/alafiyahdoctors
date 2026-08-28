import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc, addDoc, collection } from './firebase';
import { Send, Loader2, User, Phone, MapPin, Stethoscope, CalendarDays, ArrowLeft, PlusCircle, CheckCircle2 } from 'lucide-react';

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toEnglishDigits = (str) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return str.replace(/[০-৯]/g, (char) => banglaDigits.indexOf(char) !== -1 ? englishDigits[banglaDigits.indexOf(char)] : char);
};

function CustomCalendar({ selectedDate, onDateChange }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getTodayString();
  
  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleDateClick = (day) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange(formattedDate);
  };

  return (
    <div className="custom-calendar">
      <div className="cal-header">
        <button type="button" onClick={handlePrevMonth}>&lt;</button>
        <span>{viewDate.toLocaleString('bn-BD', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={handleNextMonth}>&gt;</button>
      </div>
      <div className="cal-grid cal-weekdays">
        {days.map(d => <div key={d} className="cal-day-name">{d}</div>)}
      </div>
      <div className="cal-grid cal-days">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="cal-day empty"></div>)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          return (
            <div key={day} className={`cal-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''} ${isToday ? 'today' : ''}`} onClick={() => !isPast && handleDateClick(day)}>{day}</div>
          );
        })}
      </div>
    </div>
  );
}

const BookingCSS = `
  .booking-wrapper { max-width: 650px; margin: 40px auto; padding: 20px; font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif; background: #f4f7f6; border-radius: 20px; }
  .booking-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); padding: 30px; border: 1px solid #e2e8f0; min-height: 500px; position: relative; }
  .booking-title { text-align: center; color: #0f766e; font-size: 24px; font-weight: 700; margin-bottom: 25px!important; }
  .form-section { margin-bottom: 25px; }
  .section-title { font-size: 15px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; font-size: 13.5px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .input, .select, .textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-family: inherit; color: #1e293b; background: #fff; transition: all 0.2s ease; box-sizing: border-box; }
  .input:focus, .select:focus, .textarea:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15); }
  .textarea { resize: vertical; min-height: 80px; }
  .conditional-field { margin-top: 10px; padding: 10px; background: #f0fdfa; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; animation: slideDown 0.3s ease; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  .day-badge { display: inline-block; background: #0f766e; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; margin-top: 5px; }
  .doctor-options { max-height: 250px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px; background: #fff; }
  .doctor-option { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
  .doctor-option:last-child { border-bottom: none; }
  .doctor-option:hover, .doctor-option.selected { background: #f0fdfa; }
  .doctor-name { font-weight: 700; color: #1e293b; font-size: 15px; }
  .doctor-details { font-size: 12.5px; color: #64748b; margin-top: 2px; text-align: left; }
  .clear-doctor-btn { width: 100%; padding: 10px; margin-top: 10px; background: #f1f5f9; border: 1px dashed #cbd5e1; color: #475569; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
  .clear-doctor-btn:hover { background: #e2e8f0; color: #1e293b; }
  .summary-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
  .summary-label { color: #64748b; font-weight: 500; }
  .summary-value { color: #1e293b; font-weight: 700; text-align: right; }
  .submit-btn { width: 100%; padding: 14px; background: linear-gradient(45deg, #0d9488, #14b8a6); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2); position: relative; overflow: hidden; }
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.3); }
  .submit-btn:active { transform: scale(0.96); }
  .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .custom-calendar { background: linear-gradient(135deg, #0d9488, #0f766e); padding: 20px; border-radius: 16px; color: white; box-shadow: 0 10px 25px rgba(13, 148, 136, 0.3); margin-bottom: 20px; }
  .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-weight: 800; font-size: 16px; }
  .cal-header button { background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .cal-header button:hover { background: rgba(255,255,255,0.4); }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center; }
  .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); }
  .cal-day-name { font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; justify-content: center; height: 30px; }
  .cal-day { width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; font-size: 14px; margin: 0 auto; transition: 0.2s; }
  .cal-day:hover { background: rgba(255,255,255,0.2); }
  .cal-day.empty { pointer-events: none; }
  .cal-day.selected { background: #fff; color: #0d9488; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
  .cal-day.today { border: 2px solid rgba(255,255,255,0.8); }
  .cal-day.disabled { opacity: 0.4; cursor: not-allowed; background: transparent; }

  .success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: absolute; inset: 0; padding: 40px; animation: fadeIn 0.5s ease; }
  .lottie-container { width: 120px; height: 120px; margin-bottom: 20px; }
  .animated-checkmark { width: 120px; height: 120px; }
  .animated-checkmark circle { fill: #22c55e; stroke: none; }
  .animated-checkmark path { stroke: #ffffff; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; fill: none; stroke-dasharray: 48; stroke-dashoffset: 48; animation: stroke 0.4s ease forwards; }
  @keyframes stroke { 100% { stroke-dashoffset: 0; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  
  .success-title { font-size: 30px; color: #166534; font-weight: 800; margin-bottom: 12px; }
  .success-text { font-size: 16px; color: #475569; margin-bottom: 30px; line-height: 1.8; max-width: 400px; }
  .success-buttons { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; width: 100%; }
  .success-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; }
  .success-btn-primary { background: #1c5fa8; color: #fff; }
  .success-btn-primary:hover { background: #154a82; transform: translateY(-2px); }
  .success-btn-secondary { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
  .success-btn-secondary:hover { background: #e2e8f0; transform: translateY(-2px); }

  @media (max-width: 600px) { .booking-wrapper { margin: 0; padding: 10px; } .booking-card { padding: 20px; } .summary-row { flex-direction: column; gap: 4px; } .summary-value { text-align: left; } .cal-day { width: 30px; height: 30px; font-size: 12px; } }
`;

export default function BookingSystem({ departments, panels, onBack }) {
  const [formData, setFormData] = useState({
    name: '', age: '', mobile: '', gender: 'পুরুষ', address: '', // ✅ শুধু ঠিকানা
    referralSource: 'Walk-in / নিজে এসেছেন', referredDoctorName: '',
    otherReferralNote: '', departmentId: '', doctorId: ''
  });

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedDayName, setSelectedDayName] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!panels || panels.length === 0 || !departments || departments.length === 0) { setAvailableDoctors([]); return; }
    
    const dateObj = selectedDate ? new Date(selectedDate) : new Date();
    const englishDay = dateObj.getDay();
    const banglaDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const dayName = banglaDays[englishDay];
    setSelectedDayName(dayName);
    
    const dayPanel = panels.find(p => p.name === dayName);
    
    if (!dayPanel) {
      let nextDate = new Date(dateObj); let found = false;
      for (let i = 0; i < 7; i++) {
        nextDate.setDate(nextDate.getDate() + 1);
        let nextDay = nextDate.getDay();
        let nextDayName = banglaDays[nextDay];
        let nextPanel = panels.find(p => p.name === nextDayName);
        if (nextPanel) {
          const formattedDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
          setSelectedDate(formattedDate); found = true; return;
        }
      }
      if (!found) setAvailableDoctors([]); return;
    }

    const activeIds = dayPanel.activeDoctorIds || [];
    const filteredDocs = [];
    departments.forEach(dept => { dept.doctors.forEach(doc => { if (activeIds.includes(doc.id)) filteredDocs.push({ ...doc, deptName: dept.name, deptId: dept.id }); }); });
    setAvailableDoctors(filteredDocs);
    setSelectedDoctor(null);
  }, [selectedDate, panels, departments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'age' || name === 'mobile') setFormData(prev => ({ ...prev, [name]: toEnglishDigits(value) }));
    else setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'departmentId' || name === 'doctorId') setSelectedDoctor(null);
    setSuccessMsg('');
  };

  const resetForm = () => {
    setFormData({ name: '', age: '', mobile: '', gender: 'পুরুষ', address: '', referralSource: 'Walk-in / নিজে এসেছেন', referredDoctorName: '', otherReferralNote: '', departmentId: '', doctorId: '' });
    setSelectedDate(getTodayString()); setAvailableDoctors([]); setSelectedDoctor(null); setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccessMsg('');
    try {
      if (!selectedDoctor) throw new Error('ডাক্তার নির্বাচন করুন');
      if (!selectedDate) throw new Error('তারিখ নির্বাচন করুন');
      
      const counterRef = doc(db, 'counters', selectedDoctor.id);
      let serialNo = 1;
      const counterDoc = await getDoc(counterRef);
      if (counterDoc.exists()) { serialNo = counterDoc.data().count + 1; await setDoc(counterRef, { count: serialNo }, { merge: true }); }
      else { await setDoc(counterRef, { count: serialNo }); }
      
      // ✅ শুধু address ও বাকি ডেটা সেভ হবে
      const appointmentData = { 
        ...formData, 
        doctorName: selectedDoctor.name, 
        doctorDept: selectedDoctor.deptName, 
        doctorQuals: selectedDoctor.quals || '', 
        bookingDate: selectedDate, 
        bookingDay: selectedDayName, 
        serialNo: serialNo, 
        status: 'pending', 
        timestamp: new Date().toISOString() 
      };
      
      await addDoc(collection(db, 'appointments'), appointmentData);
      setSuccessMsg('আপনার সিরিয়ালটি সফলভাবে কনফার্ম করা হয়েছে। শীঘ্রই একজন প্রতিনিধি আপনাকে সিরিয়াল নাম্বার ও সময় জানিয়ে দিবেন।');
      setIsBooked(true);
    } catch (error) {
      console.error("Booking error:", error);
      alert("বুকিং সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
    } finally { setLoading(false); }
  };

  const handleNewBooking = () => { resetForm(); setIsBooked(false); };
  const handleBackToDoctors = () => { 
    if (onBack) { onBack(); }
    else { resetForm(); setIsBooked(false); }
  };

  const filteredDoctors = selectedDoctor
    ? availableDoctors.filter(doc => doc.id === selectedDoctor.id)
    : availableDoctors.filter(doc => !formData.departmentId || doc.deptId === formData.departmentId);

  return (
    <div className="booking-wrapper">
      <style>{BookingCSS}</style>
      <div className="booking-card">
        {isBooked ? (
          <div className="success-screen">
            <div className="lottie-container">
              <svg className="animated-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="25" fill="none" />
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h3 className="success-title">বুকিং সফল হয়েছে!</h3>
            <p className="success-text">{successMsg}</p>
            
            <div className="success-buttons">
              <button className="success-btn success-btn-secondary" onClick={handleBackToDoctors}>
                <ArrowLeft size={18} /> ফিরে যান হোমপেইজে
              </button>
              <button className="success-btn success-btn-primary" onClick={handleNewBooking}>
                <PlusCircle size={18} /> আরো একটি সিরিয়াল দিন
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="booking-title">রোগীর ডাক্তার বুকিং ফর্ম</h2>

            <div className="form-section">
              <div className="section-title"><CalendarDays size={18} /> বুকিং তারিখ নির্বাচন</div>
              <div className="form-group">
                <CustomCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
                {selectedDayName && <span className="day-badge">সপ্তাহের দিন: {selectedDayName}</span>}
              </div>
            </div>

            <div className="form-section">
              <div className="section-title"><User size={18} /> রোগীর তথ্য</div>
              <div className="form-group">
                <label>রোগীর নাম</label>
                <input type="text" className="input" name="name" value={formData.name} onChange={handleChange} required placeholder="আপনার পুরো নাম" />
              </div>
              <div className="form-group">
                <label>বয়স (বাংলা বা ইংরেজি সংখ্যায়)</label>
                <input type="text" className="input" name="age" value={formData.age} onChange={handleChange} required placeholder="যেমনঃ ২৫ বা 25" />
              </div>
              <div className="form-group">
                <label>মোবাইল নম্বর (বাংলা বা ইংরেজি সংখ্যায়)</label>
                <input type="tel" className="input" name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="যেমনঃ ০১৭১২৩৪৫৬৭৮ বা 01712345678" />
              </div>
              <div className="form-group">
                <label>লিঙ্গ</label>
                <select className="select" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="মহিলা">মহিলা</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>
              
              {/* ✅ শুধুমাত্র বর্তমান ঠিকানা */}
              <div className="form-group">
                <label>বর্তমান ঠিকানা</label>
                <textarea className="textarea" name="address" value={formData.address} onChange={handleChange} required placeholder="আপনার বর্তমান ঠিকানা লিখুন (রোড, বাড়ি, এলাকা, জেলা)" />
              </div>
            </div>

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

              {formData.referralSource === 'Refer Doctor' && (
                <div className="conditional-field">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>রেফারিং ডাক্তারের নাম লিখুন</label>
                    <input type="text" className="input" name="referredDoctorName" value={formData.referredDoctorName} onChange={handleChange} placeholder="যেমনঃ ডাঃ কামরুল হাসান" />
                  </div>
                </div>
              )}

              {formData.referralSource === 'অন্যান্য' && (
                <div className="conditional-field">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>অন্যান্য উৎস সম্পর্কে লিখুন</label>
                    <input type="text" className="input" name="otherReferralNote" value={formData.otherReferralNote} onChange={handleChange} placeholder="যেমনঃ ফেসবুক গ্রুপ, মাইক্রোব্লগ, পরিচিতজন ইত্যাদি" />
                  </div>
                </div>
              )}
            </div>

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
                <label>ডাক্তার নির্বাচন করুন ({selectedDayName})</label>
                <div className="doctor-options">
                  {filteredDoctors.length === 0 ? (
                    <div style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      দুঃখিত, এই বিভাগে বা এই দিনে কোনো ডাক্তারের সিরিয়াল নেই।
                    </div>
                  ) : (
                    filteredDoctors.map(doc => (
                      <div key={doc.id} className={`doctor-option ${selectedDoctor?.id === doc.id ? 'selected' : ''}`} onClick={() => setSelectedDoctor(doc)}>
                        <div>
                          <div className="doctor-name">{doc.name}</div>
                          <div className="doctor-details">{doc.specialty || doc.quals || doc.deptName}</div>
                        </div>
                        {selectedDoctor?.id === doc.id && <CheckCircle2 size={18} color="#0d9488" />}
                      </div>
                    ))
                  )}
                </div>
                
                {selectedDoctor && (
                  <button type="button" className="clear-doctor-btn" onClick={() => setSelectedDoctor(null)}>
                    ডাক্তার পরিবর্তন করুন (ডিসিলেক্ট)
                  </button>
                )}
              </div>
            </div>

            {(formData.name || selectedDoctor || formData.referralSource) && (
              <div className="summary-box">
                <div className="section-title" style={{ borderBottom: 'none', marginBottom: '10px', paddingBottom: '0' }}>বুকিং সামারি</div>
                <div className="summary-row"><span className="summary-label">তারিখ:</span><span className="summary-value">{selectedDate} ({selectedDayName})</span></div>
                <div className="summary-row"><span className="summary-label">রোগীর নাম:</span><span className="summary-value">{formData.name || '-'}</span></div>
                <div className="summary-row"><span className="summary-label">মোবাইল:</span><span className="summary-value">{formData.mobile || '-'}</span></div>
                <div className="summary-row"><span className="summary-label">ঠিকানা:</span><span className="summary-value">{formData.address || '-'}</span></div>
                <div className="summary-row"><span className="summary-label">নির্বাচিত ডাক্তার:</span><span className="summary-value">{selectedDoctor?.name || '-'}</span></div>
                <div className="summary-row"><span className="summary-label">বিভাগ:</span><span className="summary-value">{selectedDoctor?.deptName || '-'}</span></div>
                <div className="summary-row"><span className="summary-label">রেফারেল সোর্স:</span><span className="summary-value">{formData.referralSource || '-'}</span></div>
                {formData.referredDoctorName && (
                  <div className="summary-row"><span className="summary-label">রেফারিং ডাক্তার:</span><span className="summary-value">{formData.referredDoctorName}</span></div>
                )}
                {formData.otherReferralNote && (
                  <div className="summary-row"><span className="summary-label">অন্যান্য নোট:</span><span className="summary-value">{formData.otherReferralNote}</span></div>
                )}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />} 
              সিরিয়াল নিশ্চিত করুন
            </button>
          </form>
        )}
      </div>
    </div>
  );
}