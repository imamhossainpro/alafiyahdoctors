// src/components/QueueDisplay.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, collection, onSnapshot, query, where, doc, getDoc, getDocs, setDoc } from '../firebase';

const HOSPITAL_PATH = 'hospitals/alafiyah_main';

// ==========================================
// ✅ Bangladesh Timezone Helpers
// ==========================================
const BD_OFFSET_MINUTES = 6 * 60; // UTC+6

const getBDDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (BD_OFFSET_MINUTES * 60000));
};

const getTodayString = () => {
  const d = getBDDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getBDMinutesNow = () => {
  const d = getBDDate();
  return d.getHours() * 60 + d.getMinutes();
};

// ==========================================
// ✅ Day Name Mappings (Bengali + English)
// ==========================================
const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTodayDayNames = () => {
  const d = getBDDate();
  const dayIdx = d.getDay();
  return { bn: WEEKDAYS_BN[dayIdx], en: WEEKDAYS_EN[dayIdx], idx: dayIdx };
};

// ==========================================
// ✅ Time Parser – supports multiple formats
// ==========================================
// Supports:
//   "09:00 AM", "13:30", "10:00", "9:00 PM"
//   "সকাল ১০টা", "দুপুর ২টা", "রাত ১১টা" ইত্যাদি
// ==========================================
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const banglaToEnglish = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  let s = String(timeStr).replace(/[০-৯]/g, (c) => banglaToEnglish[c]).trim();

  let explicitPeriod = null;
  if (/রাত|সন্ধ্যা|বিকাল|বিকেল|দুপুর/.test(s)) {
    explicitPeriod = 'PM';
    s = s.replace(/রাত|সন্ধ্যা|বিকাল|বিকেল|দুপুর/g, '').trim();
  } else if (/সকাল/.test(s)) {
    explicitPeriod = 'AM';
    s = s.replace(/সকাল/g, '').trim();
  }

  // Try "HH:MM AM/PM"
  let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const p = (m[3] || explicitPeriod || '').toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    else if (p === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  // Try "HH:MM" 24-hour
  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    return h * 60 + min;
  }

  // Bengali "১০টা" or "১০.৩০টা"
  m = s.match(/(\d{1,2})(?:[:.](\d{2}))?/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2] || '0', 10);
    if (explicitPeriod === 'PM' && h !== 12) h += 12;
    else if (explicitPeriod === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  return null;
};

// ==========================================
// ✅ Extract schedule slots from a doctor object
// ==========================================
const getDoctorSlots = (doctor) => {
  const slots = [];

  // 1. New format – timeSlots array
  if (Array.isArray(doctor.timeSlots) && doctor.timeSlots.length > 0) {
    doctor.timeSlots.forEach((slot) => {
      const start = parseTimeToMinutes(slot?.start);
      const end = parseTimeToMinutes(slot?.end);
      if (start !== null && end !== null) slots.push({ start, end });
    });
  }

  // 2. Legacy format – single "start - end" string
  if (slots.length === 0 && doctor.time) {
    const parts = String(doctor.time).split(/[-–—]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const start = parseTimeToMinutes(parts[0]);
      const end = parseTimeToMinutes(parts[1]);
      if (start !== null && end !== null) slots.push({ start, end });
    }
  }

  return slots;
};

// ==========================================
// ✅ Check if doctor is inside chamber NOW
// ==========================================
const isDoctorInChamber = (doctor, currentMinutes) => {
  const slots = getDoctorSlots(doctor);
  if (slots.length === 0) return false;

  for (const slot of slots) {
    let { start, end } = slot;
    const isOvernight = end < start;
    if (isOvernight) end += 24 * 60;

    // Check for current day
    if (currentMinutes >= start && currentMinutes < end) return true;

    // Check for overnight slot (previous day started, we are in early morning of next day)
    if (isOvernight && (currentMinutes + 24 * 60) >= start && (currentMinutes + 24 * 60) < end) {
      return true;
    }
  }
  return false;
};

// ==========================================
// ✅ CSS
// ==========================================
const QueueCSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .tv-display {
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
    background: #f1f5f9;
    color: #1e293b;
    min-height: 100vh;
    padding: 20px 28px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100vh;
  }

  /* ==========================================
     ✅ HEADER – বড় Logo, বড় Date/Time, নিচে Margin
     ========================================== */
  .tv-header {
    text-align: center;
    margin-bottom: 28px;          /* ✅ আগে 16px ছিল → এখন 28px */
    padding: 18px 24px;           /* ✅ আগে 10px → এখন 18px */
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    border: 1px solid #e9edf2;
    flex-shrink: 0;
  }
  .tv-header img {
    height: 150px !important;                 /* ✅ আগে 56px → এখন 90px */
    width: auto;
    object-fit: contain;
    margin-bottom: 10px;          /* ✅ Logo ও Date/Time এর মাঝে gap */
  }
  .tv-datetime {
    font-size: 32px;              /* ✅ আগে 17px → এখন 32px */
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 0.5px;
    line-height: 1.3;
    margin-top: 4px;
  }
  .tv-datetime span { color: #0f172a; }

  /* ==========================================
     CAROUSEL
     ========================================== */
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
    gap: 22px;
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

  .carousel-slide::-webkit-scrollbar { width: 6px; }
  .carousel-slide::-webkit-scrollbar-track { background: #e9edf2; border-radius: 10px; }
  .carousel-slide::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }

  /* ==========================================
     DOCTOR CARD – বড় Font
     ========================================== */
  .tv-doctor-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px 22px 22px;      /* ✅ আরো padding */
    border: 1px solid #e9edf2;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    transition: transform 0.15s, box-shadow 0.15s;
    height: fit-content;
  }
  .tv-doctor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 34px rgba(0,0,0,0.08);
  }

  .doctor-header {
    border-bottom: 3px solid #eef2f6;
    padding-bottom: 16px;
    margin-bottom: 18px;
  }
  .doctor-name {
    font-size: 34px;              /* ✅ আগে 23px → এখন 34px */
    font-weight: 800;
    color: #1e40af;
    line-height: 1.2;
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .doctor-name .serial-badge {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    background: #1e40af;
    padding: 3px 14px;
    border-radius: 30px;
  }
  .doctor-specialty {
    font-size: 21px;              /* ✅ আগে 15px → এখন 21px */
    color: #475569;
    margin-top: 6px;
    font-weight: 500;
    line-height: 1.3;
  }
  .doctor-time {
    font-size: 18px;              /* ✅ আগে 13px → এখন 18px */
    color: #b45309;
    margin-top: 8px;
    font-weight: 700;
    background: #fef3c7;
    padding: 4px 18px;
    border-radius: 30px;
    display: inline-block;
  }
  .doctor-status {
    display: inline-block;
    background: #dcfce7;
    color: #166534;
    font-size: 17px;              /* ✅ আগে 12.5px → এখন 17px */
    font-weight: 700;
    padding: 5px 16px;
    border-radius: 30px;
    margin-top: 8px;
    margin-left: 6px;
  }

  /* ==========================================
     CURRENT PATIENT – বড় করে দেখাও
     ========================================== */
  .current-patient-box {
    background: #f0fdf4;
    border-radius: 14px;
    padding: 18px 18px;
    margin-bottom: 18px;
    border-left: 5px solid #22c55e;
    min-height: 90px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .current-label {
    font-size: 15px;              /* ✅ আগে 12px → এখন 15px */
    font-weight: 800;
    color: #16a34a;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }
  .current-patient {
    font-size: 32px;              /* ✅ আগে 22px → এখন 32px */
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
  }
  .no-patient-main {
    font-size: 26px;              /* ✅ আগে 22px → এখন 26px */
    font-weight: 700;
    color: #94a3b8;
  }
  .no-patient-sub {
    font-size: 17px;              /* ✅ আগে 15px → এখন 17px */
    font-weight: 400;
    color: #cbd5e1;
    margin-top: 4px;
  }

  /* ==========================================
     QUEUE LIST – বড় Text
     ========================================== */
  .queue-section { flex: 1; }
  .queue-section-title {
    font-size: 18px;              /* ✅ আগে 14px → এখন 18px */
    font-weight: 800;
    color: #d97706;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .queue-item {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px 16px;
    border: 1px solid #eef2f6;
    transition: background 0.2s;
  }
  .queue-item.next-item { background: #fffbeb; border-color: #fcd34d; }
  .queue-badge {
    font-size: 26px;              /* ✅ আগে 20px → এখন 26px */
    font-weight: 800;
    color: #d97706;
    min-width: 42px;
    text-align: center;
  }
  .queue-name {
    font-size: 20px;              /* ✅ আগে 16px → এখন 20px */
    font-weight: 600;
    color: #1e293b;
    flex: 1;
  }
  .queue-msg {
    font-size: 14px;              /* ✅ আগে 12px → এখন 14px */
    font-weight: 700;
    color: #16a34a;
    background: #dcfce7;
    padding: 3px 14px;
    border-radius: 30px;
  }
  .queue-empty {
    font-size: 18px;              /* ✅ আগে 15px → এখন 18px */
    color: #94a3b8;
    padding: 10px 0;
  }

  /* ==========================================
     OFF / LOADING STATES
     ========================================== */
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
  .display-off-icon { font-size: 84px; margin-bottom: 20px; opacity: 0.6; }
  .display-off-title { font-size: 42px; font-weight: 800; color: #94a3b8; margin-bottom: 12px; }
  .display-off-sub { font-size: 24px; color: #cbd5e1; }

  .empty-state {
    font-size: 26px;
    color: #94a3b8;
    padding: 40px 20px;
    text-align: center;
    grid-column: 1 / -1;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e9edf2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
  }
  .empty-state-icon { font-size: 76px; opacity: 0.5; }

  /* ==========================================
     CAROUSEL DOTS
     ========================================== */
  .carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 18px;
    flex-shrink: 0;
    padding: 6px 0;
  }
  .carousel-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cbd5e1;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    padding: 0;
  }
  .carousel-dot.active { background: #1e40af; width: 34px; border-radius: 6px; }
  .carousel-dot:hover { background: #94a3b8; }

  /* ==========================================
     RESPONSIVE
     ========================================== */
  @media (max-width: 1200px) {
    .carousel-slide { grid-template-columns: repeat(3, 1fr); gap: 18px; }
    .doctor-name { font-size: 30px; }
    .current-patient { font-size: 28px; }
    .tv-datetime { font-size: 28px; }
  }
  @media (max-width: 992px) {
    .carousel-slide { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .doctor-name { font-size: 28px; }
    .doctor-specialty { font-size: 19px; }
    .current-patient { font-size: 26px; }
    .no-patient-main { font-size: 22px; }
    .queue-name { font-size: 18px; }
    .queue-badge { font-size: 22px; }
    .tv-datetime { font-size: 24px; }
    .tv-header img { height: 72px; }
  }
  @media (max-width: 640px) {
    .carousel-slide { grid-template-columns: 1fr; gap: 14px; }
    .tv-header img { height: 56px; }
    .tv-header { padding: 12px 16px; margin-bottom: 18px; }
    .doctor-name { font-size: 24px; }
    .doctor-specialty { font-size: 17px; }
    .doctor-time { font-size: 15px; }
    .doctor-status { font-size: 14px; }
    .current-patient { font-size: 22px; }
    .no-patient-main { font-size: 19px; }
    .no-patient-sub { font-size: 14px; }
    .queue-badge { font-size: 20px; min-width: 32px; }
    .queue-name { font-size: 16px; }
    .queue-section-title { font-size: 15px; }
    .tv-datetime { font-size: 18px; }
    .display-off-title { font-size: 28px; }
    .empty-state { font-size: 20px; }
  }
  @media (min-width: 1024px) {
    .carousel-slide { grid-template-columns: repeat(3, 1fr) !important; }
  }
  /* Full HD 1920x1080 TV-এর জন্য Extra Large */
  @media (min-width: 1600px) {
    .doctor-name { font-size: 38px; }
    .doctor-specialty { font-size: 23px; }
    .doctor-time { font-size: 20px; }
    .doctor-status { font-size: 19px; }
    .current-patient { font-size: 36px; }
    .no-patient-main { font-size: 30px; }
    .queue-badge { font-size: 30px; min-width: 48px; }
    .queue-name { font-size: 23px; }
    .queue-section-title { font-size: 20px; }
    .tv-datetime { font-size: 38px; }
    .tv-header img { height: 110px; }
  }
`;

// ==========================================
// ✅ Main Component
// ==========================================
export default function QueueDisplay() {
  const [doctors, setDoctors] = useState([]);
  const [activeDoctorIds, setActiveDoctorIds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [displaySettings, setDisplaySettings] = useState({
    isActive: true,
    useTimeRange: false,
    startTime: '08:00',
    endTime: '22:00'
  });

  // ✅ Bangladesh timezone-aware states
  const [currentTime, setCurrentTime] = useState(() => getBDDate());
  const [currentMinutes, setCurrentMinutes] = useState(() => getBDMinutesNow());
  const [todayStr, setTodayStr] = useState(() => getTodayString());
  const [dayInfo, setDayInfo] = useState(() => getTodayDayNames());

  const [currentSlide, setCurrentSlide] = useState(0);
  const autoScrollRef = useRef(null);

  
  // ==========================================
  // ✅ Clock tick – প্রতি সেকেন্ডে clock update (real-time seconds)
useEffect(() => {
  const tick = () => {
    setCurrentTime(getBDDate());
  };
  tick();
  const interval = setInterval(tick, 1000); // ⏱️ প্রতি 1 সেকেন্ড
  return () => clearInterval(interval);
}, []);

// ✅ Doctor status evaluation – প্রতি 30 সেকেন্ডে (performance-এর জন্য)
useEffect(() => {
  const evaluate = () => {
    const newDate = getBDDate();
    const newDateStr = getTodayString();
    const newMinutes = newDate.getHours() * 60 + newDate.getMinutes();

    setCurrentMinutes(newMinutes);

    // Date change (midnight rollover)
    if (newDateStr !== todayStr) {
      setTodayStr(newDateStr);
      setDayInfo(getTodayDayNames());
    }
  };

  evaluate();
  const interval = setInterval(evaluate, 30000); // 30 seconds
  return () => clearInterval(interval);
}, [todayStr]);

  // ==========================================
  // ✅ 2. Load Display Settings
  // ==========================================
  useEffect(() => {
    let mounted = true;
    const loadDisplaySettings = async () => {
      try {
        const docRef = doc(db, HOSPITAL_PATH, 'displaySettings', 'data');
        const docSnap = await getDoc(docRef);
        if (!mounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplaySettings({
            isActive: data.isActive !== undefined ? data.isActive : true,
            useTimeRange: data.useTimeRange !== undefined ? data.useTimeRange : false,
            startTime: data.startTime || '08:00',
            endTime: data.endTime || '22:00'
          });
        } else {
          await setDoc(docRef, {
            isActive: true,
            useTimeRange: false,
            startTime: '08:00',
            endTime: '22:00'
          });
        }
      } catch (err) {
        console.error('Display settings load error:', err);
      } finally {
        if (mounted) setSettingsLoaded(true);
      }
    };
    loadDisplaySettings();
    return () => { mounted = false; };
  }, []);

  // ==========================================
  // ✅ 3. Real-time Doctors (departments → doctors[])
  // ==========================================
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, HOSPITAL_PATH, 'departments'),
      (snap) => {
        const docs = [];
        snap.forEach((deptDoc) => {
          const data = deptDoc.data();
          if (Array.isArray(data.doctors)) {
            data.doctors.forEach((d) => {
              docs.push({
                id: d.id,
                name: d.name,
                specialty: d.specialty || d.quals || data.name,
                timeSlots: d.timeSlots || [],
                time: d.time || '',
                isOnLeave: d.isOnLeave === true,
                dept: data.name,
                deptId: deptDoc.id,
              });
            });
          }
        });
        setDoctors(docs);
      },
      (err) => console.error('Doctors listener error:', err)
    );
    return () => unsub();
  }, []);

  // ==========================================
  // ✅ 4. Real-time Panels (today's activeDoctorIds)
  // ==========================================
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, HOSPITAL_PATH, 'panels'),
      (snap) => {
        let ids = [];
        snap.forEach((panelDoc) => {
          const data = panelDoc.data();
          const nameMatch =
            data.name === dayInfo.bn ||
            data.name === dayInfo.en ||
            panelDoc.id === dayInfo.bn ||
            panelDoc.id === dayInfo.en;
          if (nameMatch) {
            ids = data.activeDoctorIds || [];
          }
        });
        setActiveDoctorIds(ids);
      },
      (err) => console.error('Panels listener error:', err)
    );
    return () => unsub();
  }, [dayInfo]);

  // ==========================================
  // ✅ 5. Real-time Appointments (today only)
  // ==========================================
  useEffect(() => {
    if (!todayStr) return;
    const q = query(
      collection(db, HOSPITAL_PATH, 'appointments'),
      where('bookingDate', '==', todayStr)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => Number(a.serialNo) - Number(b.serialNo));
        setAppointments(data);
      },
      (err) => console.error('Appointments listener error:', err)
    );
    return () => unsub();
  }, [todayStr]);

  // ==========================================
  // ✅ 6. Doctor is currently chambering?
  //    Requirements:
  //      - doctor in today's panel
  //      - not on leave
  //      - current time inside one of their slots
  // ==========================================
  const activeDoctors = useMemo(() => {
    return doctors
      .filter((doc) => activeDoctorIds.includes(doc.id))
      .filter((doc) => !doc.isOnLeave)
      .filter((doc) => isDoctorInChamber(doc, currentMinutes));
  }, [doctors, activeDoctorIds, currentMinutes]);

  // ==========================================
  // ✅ 7. Build doctor cards with serial info
  // ==========================================
  const doctorCards = useMemo(() => {
    return activeDoctors.map((doc, index) => {
      // doctor match by name (fallback if no doctorId in appointments)
      const docAppts = appointments
        .filter((a) => a.doctorName === doc.name)
        .sort((a, b) => Number(a.serialNo) - Number(b.serialNo));

      const currentPatient = docAppts.find((a) => a.status === 'checked-in') || null;
      const waitingList = docAppts.filter((a) => a.status === 'confirmed');
      const nextPatient = waitingList[0] || null;

      // Display time range (from slots)
      const slots = getDoctorSlots(doc);
      let timeDisplay = doc.time || '';
      if (slots.length > 0 && !timeDisplay) {
        timeDisplay = slots.map((s) => {
          const sH = Math.floor(s.start / 60);
          const sM = s.start % 60;
          const eH = Math.floor((s.end % (24 * 60)) / 60);
          const eM = s.end % 60;
          const fmt = (h, m) => {
            const p = h >= 12 ? 'PM' : 'AM';
            const hh = h % 12 === 0 ? 12 : h % 12;
            return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
          };
          return `${fmt(sH, sM)} - ${fmt(eH, eM)}`;
        }).join(' | ');
      }

      return {
        doctor: doc,
        index: index + 1,
        currentPatient,
        nextPatient,
        waitingList: waitingList.slice(0, 5),
        waitingCount: waitingList.length,
        timeDisplay,
      };
    });
  }, [activeDoctors, appointments]);

  // ==========================================
  // ✅ 8. Build slides for carousel (6 cards per slide)
  // ==========================================
  const slides = useMemo(() => {
    const itemsPerSlide = 6;
    const newSlides = [];
    for (let i = 0; i < doctorCards.length; i += itemsPerSlide) {
      newSlides.push(doctorCards.slice(i, i + itemsPerSlide));
    }
    return newSlides;
  }, [doctorCards]);

  // Reset slide when slides change
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // ==========================================
  // ✅ 9. Auto-scroll carousel (every 8 seconds)
  // ==========================================
  useEffect(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    if (slides.length <= 1) return;

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

  // ==========================================
  // ✅ 10. Is display active (time-range check)?
  // ==========================================
  const isDisplayActive = () => {
    if (!displaySettings.isActive) return false;
    if (displaySettings.useTimeRange) {
      const now = getBDDate();
      const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return currentStr >= displaySettings.startTime && currentStr <= displaySettings.endTime;
    }
    return true;
  };

  const displayActive = isDisplayActive();

  // ==========================================
  // ✅ 11. Loading / Display-off / Empty states
  // ==========================================
  if (!settingsLoaded) {
    return (
      <div className="tv-display">
        <style>{QueueCSS}</style>
        <div className="tv-header">
          <img src="/logo.png" alt="Logo" />
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
          <img src="/logo.png" alt="Logo" />
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
          <img src="/logo.png" alt="Logo" />
          <div className="tv-datetime">
            <span>{currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {' | '}
            <span>{currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
        <div className="carousel-container">
          <div className="empty-state">
            <div className="empty-state-icon">🩺</div>
            <div>এই মুহূর্তে কোনো ডাক্তারের চেম্বার টাইম চলছে না।</div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px' }}>
              আজ {dayInfo.bn} · {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ✅ 12. Render
  // ==========================================
  return (
    <div className="tv-display">
      <style>{QueueCSS}</style>

      <div className="tv-header">
        <img src="/logo.png" alt="Logo" />
        <div className="tv-datetime">
          <span>{currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {' | '}
          <span>{currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      <div className="carousel-container">
        {slides.map((slideData, slideIndex) => (
          <div
            key={slideIndex}
            className={`carousel-slide ${slideIndex === currentSlide ? 'active' : ''}`}
          >
            {slideData.map(({ doctor, index, currentPatient, nextPatient, waitingList, waitingCount, timeDisplay }) => (
              <div key={doctor.id} className="tv-doctor-card">
                <div className="doctor-header">
                  <div className="doctor-name">
                    {index}. {doctor.name}
                  </div>
                  <div className="doctor-specialty">{doctor.specialty}</div>
                  {timeDisplay && (
                    <div className="doctor-time">⏱ {timeDisplay}</div>
                  )}
                  <span className="doctor-status">✓ চেম্বার করছেন</span>
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
                  <div className="queue-section-title">
                    ⏳ পরবর্তী সিরিয়াল
                    {waitingCount > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        অপেক্ষায়: {waitingCount}
                      </span>
                    )}
                  </div>
                  <div className="queue-list">
                    {waitingList.length > 0 ? (
                      waitingList.map((appt, idx) => (
                        <div
                          key={appt.id}
                          className={`queue-item ${idx === 0 ? 'next-item' : ''}`}
                        >
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