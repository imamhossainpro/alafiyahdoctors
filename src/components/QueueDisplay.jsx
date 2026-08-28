import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, doc, getDoc, getDocs } from '../firebase';

const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 🔥 বাংলা সময় পার্স করার লজিক
const parseBanglaTimeToMinutes = (timeString) => {
  if (!timeString) return null;
  const banglaToEnglish = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const englishTime = timeString.replace(/[০-৯]/g, (char) => banglaToEnglish[char]);
  const parts = englishTime.split('-').map(part => part.trim());
  if (parts.length !== 2) return null;

  const parseSingleTime = (part) => {
    let period = 'AM'; let timePart = part;
    if (part.includes('রাত')) { period = 'PM'; timePart = part.replace(/রাত/g, '').trim(); }
    else if (part.includes('সন্ধ্যা')) { period = 'PM'; timePart = part.replace(/সন্ধ্যা/g, '').trim(); }
    else if (part.includes('বিকাল')) { period = 'PM'; timePart = part.replace(/বিকাল/g, '').trim(); }
    else if (part.includes('দুপুর')) { period = 'PM'; timePart = part.replace(/দুপুর/g, '').trim(); }
    else if (part.includes('সকাল')) { period = 'AM'; timePart = part.replace(/সকাল/g, '').trim(); }

    const hourMatch = timePart.match(/(\d+)/);
    if (!hourMatch) return null;
    let hour = parseInt(hourMatch[1], 10);
    if (period === 'PM' && hour !== 12) hour += 12;
    else if (period === 'AM' && hour === 12) hour = 0;
    return hour * 60;
  };

  const startMinutes = parseSingleTime(parts[0]);
  const endMinutes = parseSingleTime(parts[1]);
  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes < startMinutes) return { start: startMinutes, end: endMinutes + (24 * 60) };
  return { start: startMinutes, end: endMinutes };
};

const QueueCSS = `
  .tv-display { font-family: 'Hind Siliguri', Arial, sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; padding: 24px; box-sizing: border-box; overflow-y: auto; }
  .tv-header { text-align: center; margin-bottom: 30px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04); padding: 20px; }
  
  /* 👇 লোগো */
  .tv-header img { height: 160px; width: auto; object-fit: contain; margin-bottom: 10px; }
  .tv-header .tv-datetime { font-size: 20px; color: #475569; margin-top: 5px; font-weight: 600; }

  .tv-doctors-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; }
  .tv-doctor-card { background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; border-top: 6px solid #0d9488; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }
  
  .doctor-info { margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  .doctor-name { font-size: 28px; font-weight: 800; color: #1d4ed8; }
  .doctor-dept { font-size: 18px; color: #475569; margin-top: 4px; }
  .doctor-time { font-size: 15px; color: #d97706; margin-top: 5px; font-weight: 600; }

  /* 👇 "এখন চেম্বারে" বক্স */
  .current-patient-box { background: #f0fdf4; border-radius: 10px; padding: 12px; margin-bottom: 15px; border: 1px solid #bbf7d0; min-height: 120px; display: flex; flex-direction: column; justify-content: center; }
  .current-label { font-size: 14px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 1px; }
  .current-patient { font-size: 28px; font-weight: 800; color: #111827; margin-top: 4px; }
  
  /* 👇 দুই লাইনের নো-পেশেন্ট মেসেজ */
  .no-patient-main { font-size: 34px; font-weight: 800; color: #475569; margin-top: 6px; }
  .no-patient-sub { font-size: 20px; font-weight: 500; color: #94a3b8; margin-top: 6px; }

  .queue-section-title { font-size: 15px; font-weight: 700; color: #d97706; margin-bottom: 10px; }
  .queue-list { display: flex; flex-direction: column; gap: 8px; }
  .queue-item { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
  .queue-item.next-item { background: #fef3c7; border-color: #fcd34d; }
  .queue-badge { font-size: 24px; font-weight: 800; color: #92400e; }
  .queue-name { font-size: 16px; font-weight: 600; color: #334155; flex: 1; margin-left: 12px; }
  .queue-msg { font-size: 12px; color: #16a34a; font-weight: 700; }

  .empty-state { font-size: 22px; color: #64748b; padding: 20px; text-align: center; grid-column: 1 / -1; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1; }

  @media (max-width: 1000px) {
    .tv-doctors-grid { grid-template-columns: 1fr; }
    .doctor-name { font-size: 24px; }
    .current-patient { font-size: 24px; }
    .tv-header img { height: 100px; }
    .no-patient-main { font-size: 26px; }
    .no-patient-sub { font-size: 16px; }
  }
`;

export default function QueueDisplay() {
  const [appointments, setAppointments] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [activeDoctorIds, setActiveDoctorIds] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 🔥 ঘড়ি এখন প্রতি ১ সেকেন্ডে আপডেট হবে
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const deptDoc = await getDoc(doc(db, 'master', 'departments'));
      const docs = [];
      if (deptDoc.exists()) {
        deptDoc.data().departments.forEach(dept => {
          dept.doctors.forEach(d => {
            docs.push({ id: d.id, name: d.name, specialty: d.specialty || d.quals || dept.name, time: d.time || '', dept: dept.name });
          });
        });
      }
      setAllDoctors(docs);

      const today = new Date();
      const weekDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const todayName = weekDays[today.getDay()];

      const panelsSnapshot = await getDocs(collection(db, 'panels'));
      let activeIds = [];
      panelsSnapshot.forEach(panelDoc => {
        const data = panelDoc.data();
        if (data.name === todayName || panelDoc.id === todayName) {
          activeIds = data.activeDoctorIds || [];
        }
      });
      setActiveDoctorIds(activeIds);

      const todayStr = getTodayString();
      const q = query(collection(db, 'appointments'), where('bookingDate', '==', todayStr));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => Number(a.serialNo) - Number(b.serialNo));
        setAppointments(data);
      });

      return () => unsubscribe();
    };

    fetchData();
  }, []);

  const getActiveDoctors = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return allDoctors.filter(doc => {
      if (!activeDoctorIds.includes(doc.id)) return false;
      const parsedTime = parseBanglaTimeToMinutes(doc.time);
      if (!parsedTime) return true;
      const { start, end } = parsedTime;
      return currentMinutes >= start && currentMinutes <= end;
    });
  };

  const activeDoctors = getActiveDoctors();

  const groupedByDoctor = activeDoctors.map(doc => {
    const docAppointments = appointments.filter(a => a.doctorName === doc.name);
    
    // "এখন চেম্বারে" - যারা Checked-in
    const currentPatient = docAppointments.find(a => a.status === 'checked-in');

    // শুধুমাত্র "confirmed" স্ট্যাটাস ওয়েটিং লিস্টে দেখাবে
    const waitingPatients = docAppointments
      .filter(a => a.status === 'confirmed')
      .sort((a, b) => Number(a.serialNo) - Number(b.serialNo))
      .slice(0, 5);

    return { doctor: doc, currentPatient, waitingPatients };
  });

  return (
    <div className="tv-display">
      <style>{QueueCSS}</style>

      <div className="tv-header">
        <img src="/logo.png" alt="আল-আফিয়া হাসপাতাল" />
        
        {/* 🔥 সেকেন্ডসহ ডায়নামিক সময় */}
        <div className="tv-datetime">
          {currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {" | "}
          {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      <div className="tv-doctors-grid">
        {groupedByDoctor.length === 0 ? (
          <div className="empty-state">এই মুহূর্তে কোনো ডাক্তারের চেম্বার টাইম চলছে না।</div>
        ) : (
          groupedByDoctor.map(({ doctor, currentPatient, waitingPatients }) => (
            <div key={doctor.id} className="tv-doctor-card">
              <div className="doctor-info">
                <div className="doctor-name">{doctor.name}</div>
                <div className="doctor-dept">{doctor.specialty}</div>
                <div className="doctor-time">চেম্বার টাইম: {doctor.time}</div>
              </div>

              <div className="current-patient-box">
                {/* 👇 "কেবিনে" এর বদলে "চেম্বারে" ব্যবহার করা হয়েছে */}
                <div className="current-label">🔔 এখন চেম্বারে</div>
                {currentPatient ? (
                  <div className="current-patient">
                    সিরিয়াল: {currentPatient.serialNo} | {currentPatient.name}
                  </div>
                ) : (
                  <>
                    <div className="no-patient-main">বর্তমানে কোনো রোগী নেই</div>
                    <div className="no-patient-sub">নতুন রোগীর জন্য অপেক্ষা করা হচ্ছে</div>
                  </>
                )}
              </div>

              {/* 👇 শিরোনাম পরিবর্তন করা হয়েছে */}
              <div className="queue-section-title">⏳ পরবর্তী সিরিয়াল</div>
              <div className="queue-list">
                {waitingPatients.length > 0 
                  ? waitingPatients.map((appt, index) => (
                      <div key={appt.id} className={`queue-item ${index === 0 ? 'next-item' : ''}`}>
                        <span className="queue-badge">{appt.serialNo}</span>
                        <span className="queue-name">{appt.name}</span>
                        {index === 0 && <span className="queue-msg">এখন প্রস্তুত হোন</span>}
                      </div>
                    ))
                  : <div style={{ fontSize: '18px', color: '#64748b' }}>কেউ অপেক্ষা করছে না</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}