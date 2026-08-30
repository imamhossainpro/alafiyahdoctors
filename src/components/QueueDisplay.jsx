import React, { useState, useEffect, useRef } from 'react';
import { db, collection, onSnapshot, query, where, doc, getDoc, getDocs, setDoc } from '../firebase';

const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// বাংলা সময় পার্স করার লজিক
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

// ---------- CSS (লাইট থিম) ----------
const QueueCSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .tv-display {
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
    background: #f1f5f9;
    color: #1e293b;
    min-height: 100vh;
    padding: 20px 24px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100vh;
  }

  .tv-header {
    text-align: center;
    margin-bottom: 24px;
    padding: 12px 20px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #e9edf2;
    flex-shrink: 0;
  }
  .tv-header img {
    height: 64px;
    width: auto;
    object-fit: contain;
    margin-bottom: 4px;
  }
  .tv-datetime {
    font-size: 18px;
    font-weight: 500;
    color: #475569;
    letter-spacing: 0.3px;
  }
  .tv-datetime span { color: #0f172a; }

  .carousel-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    min-height: 0;
  }

  .carousel-slide {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease;
    position: absolute;
    inset: 0;
    padding: 4px;
    overflow-y: auto;
    visibility: hidden;
  }
  .carousel-slide.active {
    opacity: 1;
    visibility: visible;
    position: relative;
  }

  .carousel-slide::-webkit-scrollbar { width: 4px; }
  .carousel-slide::-webkit-scrollbar-track { background: #e9edf2; border-radius: 10px; }
  .carousel-slide::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }

  .tv-doctor-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 20px 18px 18px;
    border: 1px solid #e9edf2;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    transition: transform 0.15s, box-shadow 0.15s;
    height: fit-content;
  }
  .tv-doctor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  }

  .doctor-header {
    border-bottom: 2px solid #eef2f6;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .doctor-name {
    font-size: 24px;
    font-weight: 800;
    color: #1e40af;
    line-height: 1.2;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .doctor-name .serial-badge {
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    background: #1e40af;
    padding: 2px 10px;
    border-radius: 30px;
  }
  .doctor-specialty {
    font-size: 16px;
    color: #475569;
    margin-top: 4px;
    font-weight: 500;
  }
  .doctor-time {
    font-size: 14px;
    color: #b45309;
    margin-top: 6px;
    font-weight: 600;
    background: #fef3c7;
    padding: 2px 14px;
    border-radius: 30px;
    display: inline-block;
  }

  .current-patient-box {
    background: #f0fdf4;
    border-radius: 12px;
    padding: 14px 14px;
    margin-bottom: 16px;
    border-left: 4px solid #22c55e;
    min-height: 74px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .current-label {
    font-size: 12px;
    font-weight: 700;
    color: #16a34a;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 2px;
  }
  .current-patient {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
  }
  .no-patient-main {
    font-size: 22px;
    font-weight: 700;
    color: #94a3b8;
  }
  .no-patient-sub {
    font-size: 15px;
    font-weight: 400;
    color: #cbd5e1;
    margin-top: 2px;
  }

  .queue-section {
    flex: 1;
  }
  .queue-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #d97706;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .queue-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8fafc;
    border-radius: 10px;
    padding: 10px 14px;
    border: 1px solid #eef2f6;
    transition: background 0.2s;
  }
  .queue-item.next-item {
    background: #fffbeb;
    border-color: #fcd34d;
  }
  .queue-badge {
    font-size: 20px;
    font-weight: 800;
    color: #d97706;
    min-width: 32px;
    text-align: center;
  }
  .queue-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
  }
  .queue-msg {
    font-size: 12px;
    font-weight: 600;
    color: #16a34a;
    background: #dcfce7;
    padding: 2px 12px;
    border-radius: 30px;
  }
  .queue-empty {
    font-size: 16px;
    color: #94a3b8;
    padding: 8px 0;
  }

  .display-off-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e9edf2;
    padding: 40px 20px;
    text-align: center;
  }
  .display-off-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  .display-off-title {
    font-size: 28px;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 8px;
  }
  .display-off-sub {
    font-size: 18px;
    color: #cbd5e1;
  }

  .empty-state {
    font-size: 22px;
    color: #94a3b8;
    padding: 40px 20px;
    text-align: center;
    grid-column: 1 / -1;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e9edf2;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 16px;
    flex-shrink: 0;
    padding: 6px 0;
  }
  .carousel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #cbd5e1;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    padding: 0;
  }
  .carousel-dot.active {
    background: #1e40af;
    width: 24px;
    border-radius: 4px;
  }
  .carousel-dot:hover {
    background: #94a3b8;
  }

  @media (max-width: 1200px) {
    .carousel-slide { grid-template-columns: repeat(3, 1fr); gap: 18px; }
  }
  @media (max-width: 992px) {
    .carousel-slide { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .doctor-name { font-size: 22px; }
    .current-patient { font-size: 20px; }
  }
  @media (max-width: 640px) {
    .carousel-slide { grid-template-columns: 1fr; gap: 14px; }
    .tv-header img { height: 44px; }
    .doctor-name { font-size: 20px; }
    .current-patient { font-size: 18px; }
    .no-patient-main { font-size: 18px; }
    .queue-badge { font-size: 18px; min-width: 28px; }
    .queue-name { font-size: 14px; }
    .tv-datetime { font-size: 14px; }
    .display-off-title { font-size: 22px; }
    .display-off-sub { font-size: 16px; }
    .display-off-icon { font-size: 48px; }
  }

  @media (min-width: 1024px) {
    .carousel-slide { grid-template-columns: repeat(3, 1fr) !important; }
  }
`;

// ---------- মূল কম্পোনেন্ট ----------
export default function QueueDisplay() {
  const [appointments, setAppointments] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [activeDoctorIds, setActiveDoctorIds] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const autoScrollRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // ডিসপ্লে সেটিংস স্টেট
  const [displaySettings, setDisplaySettings] = useState({
    isActive: true,
    useTimeRange: false,
    startTime: '08:00',
    endTime: '22:00'
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // প্রতি সেকেন্ডে ঘড়ি আপডেট
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ডিসপ্লে সেটিংস লোড
  const loadDisplaySettings = async () => {
    try {
      const docRef = doc(db, 'master', 'displaySettings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDisplaySettings(docSnap.data());
      } else {
        const defaults = {
          isActive: true,
          useTimeRange: false,
          startTime: '08:00',
          endTime: '22:00'
        };
        await setDoc(docRef, defaults);
        setDisplaySettings(defaults);
      }
    } catch (error) {
      console.error('Error loading display settings:', error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  // ডাক্তার লিস্ট রিফ্রেশ (প্রতি ১২০ সেকেন্ডে)
  const refreshDoctorList = async () => {
    try {
      const deptDoc = await getDoc(doc(db, 'master', 'departments'));
      const docs = [];
      if (deptDoc.exists()) {
        deptDoc.data().departments.forEach(dept => {
          dept.doctors.forEach(d => {
            docs.push({
              id: d.id,
              name: d.name,
              specialty: d.specialty || d.quals || dept.name,
              time: d.time || '',
              dept: dept.name
            });
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
    } catch (error) {
      console.error('Error refreshing doctors:', error);
    }
  };

  // ডিসপ্লে চালু থাকবে কিনা চেক
  const isDisplayActive = () => {
    if (!displaySettings.isActive) return false;
    
    if (displaySettings.useTimeRange) {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return currentTimeStr >= displaySettings.startTime && currentTimeStr <= displaySettings.endTime;
    }
    
    return true;
  };

  // ডেটা লোড (শুধু একবার)
  useEffect(() => {
    const fetchData = async () => {
      await loadDisplaySettings();
      await refreshDoctorList();

      const todayStr = getTodayString();
      const q = query(collection(db, 'appointments'), where('bookingDate', '==', todayStr));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => Number(a.serialNo) - Number(b.serialNo));
        setAppointments(data);
      });

      refreshIntervalRef.current = setInterval(refreshDoctorList, 120000);

      return () => {
        unsubscribe();
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      };
    };

    fetchData();
  }, []);

  // সক্রিয় ডাক্তার ফিল্টার
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

  // গ্রুপ ডেটা তৈরি
  const buildGroupedData = () => {
    const activeDoctors = getActiveDoctors();
    return activeDoctors.map((doc, index) => {
      const docAppointments = appointments.filter(a => a.doctorName === doc.name);
      const currentPatient = docAppointments.find(a => a.status === 'checked-in');
      const waitingPatients = docAppointments
        .filter(a => a.status === 'confirmed')
        .sort((a, b) => Number(a.serialNo) - Number(b.serialNo))
        .slice(0, 5);
      return { doctor: doc, index: index + 1, currentPatient, waitingPatients };
    });
  };

  // স্লাইড তৈরি
  useEffect(() => {
    const grouped = buildGroupedData();
    const itemsPerSlide = 6;
    const newSlides = [];
    for (let i = 0; i < grouped.length; i += itemsPerSlide) {
      newSlides.push(grouped.slice(i, i + itemsPerSlide));
    }
    setSlides(newSlides);
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(0);
    }
  }, [appointments, allDoctors, activeDoctorIds]);

  // অটো-স্ক্রল (৮ সেকেন্ড)
  useEffect(() => {
    if (slides.length <= 1) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      return;
    }
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [slides.length]);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 8000);
    }
  };

  // ডিসপ্লে সক্রিয় কিনা চেক
  const displayActive = isDisplayActive();

  if (!settingsLoaded) {
    return (
      <div className="tv-display">
        <style>{QueueCSS}</style>
        <div className="tv-header">
          <img src="/logo.png" alt="আল-আফিয়া হাসপাতাল" />
          <div className="tv-datetime">
            <span>{currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {' | '}
            <span>{currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
        <div className="display-off-container">
          <div className="display-off-icon">⏳</div>
          <div className="display-off-title">লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  if (!displayActive) {
    return (
      <div className="tv-display">
        <style>{QueueCSS}</style>
        <div className="tv-header">
          <img src="/logo.png" alt="আল-আফিয়া হাসপাতাল" />
          <div className="tv-datetime">
            <span>{currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {' | '}
            <span>{currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
        <div className="display-off-container">
          <div className="display-off-icon">📺</div>
          <div className="display-off-title">ডিসপ্লে বন্ধ আছে</div>
          <div className="display-off-sub">
            {displaySettings.useTimeRange 
              ? `চালু হবে ${displaySettings.startTime} – ${displaySettings.endTime} সময়ের মধ্যে`
              : 'অ্যাডমিন দ্বারা বন্ধ করা হয়েছে'}
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="tv-display">
        <style>{QueueCSS}</style>
        <div className="tv-header">
          <img src="/logo.png" alt="আল-আফিয়া হাসপাতাল" />
          <div className="tv-datetime">
            <span>{currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {' | '}
            <span>{currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
        <div className="carousel-container">
          <div className="empty-state">এই মুহূর্তে কোনো ডাক্তারের চেম্বার টাইম চলছে না।</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-display">
      <style>{QueueCSS}</style>

      <div className="tv-header">
        <img src="/logo.png" alt="আল-আফিয়া হাসপাতাল" />
        <div className="tv-datetime">
          <span>
            {currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {' | '}
          <span>
            {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="carousel-container">
        {slides.map((slideData, slideIndex) => (
          <div
            key={slideIndex}
            className={`carousel-slide ${slideIndex === currentSlide ? 'active' : ''}`}
          >
            {slideData.map(({ doctor, index, currentPatient, waitingPatients }) => (
              <div key={doctor.id} className="tv-doctor-card">
                <div className="doctor-header">
                  <div className="doctor-name">
                    {index}. {doctor.name}
                  </div>
                  <div className="doctor-specialty">{doctor.specialty}</div>
                  <div className="doctor-time">⏱ {doctor.time}</div>
                </div>

                <div className="current-patient-box">
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

                <div className="queue-section">
                  <div className="queue-section-title">⏳ পরবর্তী সিরিয়াল</div>
                  <div className="queue-list">
                    {waitingPatients.length > 0 ? (
                      waitingPatients.map((appt, idx) => (
                        <div key={appt.id} className={`queue-item ${idx === 0 ? 'next-item' : ''}`}>
                          <span className="queue-badge">{appt.serialNo}</span>
                          <span className="queue-name">{appt.name}</span>
                          {idx === 0 && <span className="queue-msg">এখন প্রস্তুত হোন</span>}
                        </div>
                      ))
                    ) : (
                      <div className="queue-empty">কেউ অপেক্ষা করছে না</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`স্লাইড ${index + 1}-এ যান`}
            />
          ))}
        </div>
      )}
    </div>
  );
}