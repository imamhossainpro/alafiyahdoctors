// utils/doctorUtils.js
// ==================================================
// 🩺 Doctor Utilities — availability, filtering, schedule
// ==================================================

export const BANGLA_DAYS = [
  'শনিবার',
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
];

// English day index → Bengali day name
// JS getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
const JS_DAY_TO_BANGLA = {
  0: 'রবিবার',
  1: 'সোমবার',
  2: 'মঙ্গলবার',
  3: 'বুধবার',
  4: 'বৃহস্পতিবার',
  5: 'শুক্রবার',
  6: 'শনিবার',
};

export const getTodayBanglaDay = () => {
  return JS_DAY_TO_BANGLA[new Date().getDay()];
};

// ==================================================
// ✅ Get availability — which days this doctor works
// ==================================================
export const getDoctorAvailability = (doctorId, panels) => {
  const availability = {};
  BANGLA_DAYS.forEach((day) => {
    const panel = panels.find((p) => p.name === day || p.id === day);
    availability[day] = panel?.activeDoctorIds?.includes(doctorId) || false;
  });
  return availability;
};

// ==================================================
// ✅ Check if doctor is available today
// ==================================================
export const isDoctorAvailableToday = (doctorId, panels) => {
  const today = getTodayBanglaDay();
  const panel = panels.find((p) => p.name === today || p.id === today);
  return panel?.activeDoctorIds?.includes(doctorId) || false;
};

// ==================================================
// ✅ NEW — Check if doctor is available on specific day
// ==================================================
export const isDoctorAvailableOnDay = (doctorId, dayName, panels) => {
  if (!panels || !dayName) return true;
  const panel = panels.find((p) => p.name === dayName || p.id === dayName);
  return panel?.activeDoctorIds?.includes(doctorId) || false;
};

// ==================================================
// ✅ Check if doctor is currently in chamber
// ==================================================
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = String(timeStr)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const p = match[3].toUpperCase();

  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;

  return h * 60 + m;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const isDoctorInChamberNow = (doctor) => {
  if (!doctor?.timeSlots || doctor.timeSlots.length === 0) return false;

  const currentMinutes = getCurrentMinutes();

  return doctor.timeSlots.some((slot) => {
    const start = parseTimeToMinutes(slot.start);
    const end = parseTimeToMinutes(slot.end);
    if (start === null || end === null) return false;

    const isOvernight = end < start;
    if (isOvernight) {
      return currentMinutes >= start || currentMinutes < end;
    }
    return currentMinutes >= start && currentMinutes < end;
  });
};

// ==================================================
// ✅ Format doctor's today time slots
// ==================================================
export const getTodayTimeDisplay = (doctor) => {
  if (!doctor?.timeSlots || doctor.timeSlots.length === 0) return null;

  return doctor.timeSlots
    .map((slot) => `${slot.start} - ${slot.end}`)
    .join(' | ');
};

// ==================================================
// ✅ Check if doctor matches time filter
// ==================================================
export const matchesTimeFilter = (doctor, timeFilter) => {
  if (!timeFilter || timeFilter === 'all') return true;
  if (!doctor?.timeSlots || doctor.timeSlots.length === 0) return false;

  return doctor.timeSlots.some((slot) => {
    const start = parseTimeToMinutes(slot.start);
    if (start === null) return false;

    const hour = Math.floor(start / 60);

    if (timeFilter === 'morning') return hour >= 6 && hour < 12;
    if (timeFilter === 'afternoon') return hour >= 12 && hour < 17;
    if (timeFilter === 'evening') return hour >= 17 && hour < 22;
    return true;
  });
};

// ==================================================
// ✅ Get doctor by id from departments
// ==================================================
export const findDoctorById = (doctorId, departments) => {
  for (const dept of departments) {
    const doctor = (dept.doctors || []).find((d) => d.id === doctorId);
    if (doctor) {
      return {
        ...doctor,
        deptId: dept.id,
        deptName: dept.name,
        deptColor: dept.color,
        deptIcon: dept.icon,
      };
    }
  }
  return null;
};

// ==================================================
// ✅ Get all doctors flattened
// ==================================================
export const flattenDoctors = (departments) => {
  const all = [];
  departments.forEach((dept) => {
    (dept.doctors || []).forEach((doc) => {
      all.push({
        ...doc,
        deptId: dept.id,
        deptName: dept.name,
        deptColor: dept.color,
        deptIcon: dept.icon,
      });
    });
  });
  return all;
};

// ==================================================
// ✅ Get doctor's weekly schedule (derived from panels)
// ==================================================
export const getDoctorWeeklySchedule = (doctorId, panels, doctor) => {
  const schedule = [];

  BANGLA_DAYS.forEach((day) => {
    const panel = panels.find((p) => p.name === day || p.id === day);
    const isAvailable = panel?.activeDoctorIds?.includes(doctorId) || false;

    if (isAvailable) {
      schedule.push({
        day,
        timeSlots: doctor?.timeSlots || [],
      });
    }
  });

  return schedule;
};

export default {
  BANGLA_DAYS,
  getTodayBanglaDay,
  getDoctorAvailability,
  isDoctorAvailableToday,
  isDoctorAvailableOnDay,
  isDoctorInChamberNow,
  getTodayTimeDisplay,
  matchesTimeFilter,
  findDoctorById,
  flattenDoctors,
  getDoctorWeeklySchedule,
};