// src/services/doctorAppointmentService.js
// ==================================================
// 🩺 Doctor Appointment Service — Safe Fields Only
// ==================================================
// ✅ Doctor-specific queries (only own appointments)
// ✅ Whitelist of safe fields — NO mobile, NO referral
// ✅ Real-time subscription (appointments + doctor info)
// ✅ Summary counts computed client-side
// ==================================================

import {
  db,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from '../firebase';

// ==================================================
// ✅ Safe fields
// ==================================================
const SAFE_FIELDS = [
  'id',
  'serialNo',
  'name',
  'nameEn',
  'age',
  'gender',
  'bookingDate',
  'bookingDay',
  'doctorId',
  'doctorName',
  'doctorNameEn',
  'doctorDept',
  'doctorTime',
  'status',
  'createdAt',
  'confirmedAt',
  'checkedInAt',
  'completedAt',
  'cancelledAt',
  'isArchived',
  'isNew',
  'isRead',
  'patientId',
  'userId',
];

// ==================================================
// ✅ Sanitize
// ==================================================
const sanitize = (raw) => {
  if (!raw) return null;
  const safe = {};
  SAFE_FIELDS.forEach((field) => {
    if (raw[field] !== undefined) {
      safe[field] = raw[field];
    }
  });
  return safe;
};

// ==================================================
// ✅ Today's date in YYYY-MM-DD (Bangladesh time)
// ==================================================
export const getTodayString = () => {
  const now = new Date();
  const bdOffset = 6 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + bdOffset * 60000);
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, '0');
  const d = String(bd.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ==================================================
// ✅ Subscribe to doctor's own appointments
// ==================================================
export const subscribeToDoctorAppointments = (
  hospitalId,
  doctorId,
  callback,
  errorCallback
) => {
  if (!hospitalId || !doctorId) {
    console.warn('⚠️ subscribeToDoctorAppointments: missing params');
    return () => {};
  }

  try {
    const ref = collection(db, 'hospitals', hospitalId, 'appointments');
    const q = query(ref, where('doctorId', '==', doctorId));

    console.log(`🔍 [DoctorService] Subscribing to: doctorId=${doctorId}`);

    return onSnapshot(
      q,
      (snap) => {
        const appointments = snap.docs
          .map((d) => {
            const data = d.data();
            return sanitize({ id: d.id, ...data });
          })
          .filter(Boolean);

        appointments.sort((a, b) => {
          const dateA = a.bookingDate || '';
          const dateB = b.bookingDate || '';
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return (Number(a.serialNo) || 0) - (Number(b.serialNo) || 0);
        });

        console.log(`📊 [DoctorService] Loaded ${appointments.length} appointments`);
        if (callback) callback(appointments);
      },
      (err) => {
        console.error('❌ [DoctorService] Subscription error:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ [DoctorService] Setup error:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Real-time Doctor Info subscription
// ==================================================
export const subscribeToDoctorInfo = (
  hospitalId,
  doctorId,
  callback,
  errorCallback
) => {
  if (!hospitalId || !doctorId) return () => {};

  const deptRef = collection(db, 'hospitals', hospitalId, 'departments');

  const unsub = onSnapshot(
    deptRef,
    (snapshot) => {
      let found = null;
      snapshot.forEach((deptDoc) => {
        if (found) return;
        const deptData = deptDoc.data();
        const doctors = deptData.doctors || [];
        const me = doctors.find((d) => d.id === doctorId);
        if (me) {
          found = {
            ...me,
            deptId: deptDoc.id,
            deptName: deptData.name || '',
            deptColor: deptData.color,
            deptIcon: deptData.icon,
          };
        }
      });
      if (callback) callback(found);
    },
    (err) => {
      console.error('❌ subscribeToDoctorInfo:', err);
      if (errorCallback) errorCallback(err);
    }
  );

  return unsub;
};

// ==================================================
// ✅ Compute summary counts
// ==================================================
export const computeSummaryCounts = (appointments, dateStr = null) => {
  const active = appointments.filter((a) => a.isArchived !== true);
  const filtered = dateStr
    ? active.filter((a) => a.bookingDate === dateStr)
    : active;

  const counts = {
    total: filtered.length,
    pending: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    upcoming: 0,
  };

  filtered.forEach((a) => {
    const status = (a.status || 'pending').toLowerCase();
    switch (status) {
      case 'pending':
        counts.pending++;
        break;
      case 'confirmed':
        counts.confirmed++;
        break;
      case 'checked-in':
        counts.checkedIn++;
        break;
      case 'completed':
        counts.completed++;
        break;
      case 'cancelled':
        counts.cancelled++;
        break;
      case 'no-show':
        counts.noShow++;
        break;
      default:
        break;
    }
  });

  return counts;
};

// ==================================================
// ✅ Get unique booking dates
// ==================================================
export const getUniqueDates = (appointments) => {
  const set = new Set();
  appointments.forEach((a) => {
    if (a.bookingDate) set.add(a.bookingDate);
  });
  return Array.from(set).sort((a, b) => b.localeCompare(a));
};

// ==================================================
// ✅ Get doctor info from departments collection (one-time)
// ==================================================
export const getDoctorInfo = async (hospitalId, doctorId) => {
  if (!hospitalId || !doctorId) return null;
  try {
    const deptsSnap = await getDocs(
      collection(db, 'hospitals', hospitalId, 'departments')
    );

    let found = null;
    let foundDept = null;

    for (const deptDoc of deptsSnap.docs) {
      const deptData = deptDoc.data();
      const doctor = (deptData.doctors || []).find((d) => d.id === doctorId);
      if (doctor) {
        found = doctor;
        foundDept = {
          id: deptDoc.id,
          name: deptData.name,
          color: deptData.color,
          icon: deptData.icon,
        };
        break;
      }
    }

    if (!found) return null;

    return {
      ...found,
      deptId: foundDept?.id,
      deptName: foundDept?.name,
      deptColor: foundDept?.color,
      deptIcon: foundDept?.icon,
    };
  } catch (err) {
    console.error('❌ getDoctorInfo error:', err);
    return null;
  }
};

// ==================================================
// ✅ Get doctor's schedule
// ==================================================
export const getDoctorSchedule = async (hospitalId, doctorId) => {
  if (!hospitalId || !doctorId) return [];
  try {
    const panelsSnap = await getDocs(
      collection(db, 'hospitals', hospitalId, 'panels')
    );

    const schedule = [];
    panelsSnap.forEach((doc) => {
      const data = doc.data();
      const activeIds = data.activeDoctorIds || [];
      if (activeIds.includes(doctorId)) {
        schedule.push({
          id: doc.id,
          name: data.name || doc.id,
          title: data.title || data.name,
        });
      }
    });

    const DAY_ORDER = [
      'শনিবার',
      'রবিবার',
      'সোমবার',
      'মঙ্গলবার',
      'বুধবার',
      'বৃহস্পতিবার',
      'শুক্রবার',
    ];
    schedule.sort((a, b) => {
      const ai = DAY_ORDER.indexOf(a.name);
      const bi = DAY_ORDER.indexOf(b.name);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    return schedule;
  } catch (err) {
    console.error('❌ getDoctorSchedule error:', err);
    return [];
  }
};

export default {
  subscribeToDoctorAppointments,
  subscribeToDoctorInfo,
  computeSummaryCounts,
  getUniqueDates,
  getDoctorInfo,
  getDoctorSchedule,
  getTodayString,
  SAFE_FIELDS,
};