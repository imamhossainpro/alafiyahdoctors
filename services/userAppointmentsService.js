// services/userAppointmentsService.js
// ==================================================
// 📅 User Appointments — Multi-layer lookup
// ==================================================
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '../firebase';
import { normalizePhone, normalizeName } from '../utils/bengaliDigits';

// ==================================================
// ✅ Multi-layer lookup: userId → phone+name → patientId
// ==================================================
export const findUserAppointments = async (hospitalId, user) => {
  if (!hospitalId || !user) return [];

  const appointmentsRef = collection(db, 'hospitals', hospitalId, 'appointments');
  const results = new Map();

  // Layer 1: userId
  try {
    const q = query(appointmentsRef, where('userId', '==', user.uid));
    const snap = await getDocs(q);
    snap.forEach((doc) => results.set(doc.id, { id: doc.id, ...doc.data() }));
    console.log(`✅ Layer 1: ${results.size} appointments`);
  } catch (err) {
    console.warn('⚠️ Layer 1 failed:', err.message);
  }

  // Layer 2: phone + name
  const phone = user.phoneNormalized || normalizePhone(user.phone);
  const userName = normalizeName(user.name);

  if (phone && userName) {
    try {
      const q = query(appointmentsRef, where('mobile', '==', phone));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        if (results.has(doc.id)) return;
        const data = doc.data();
        if (normalizeName(data.name) === userName) {
          results.set(doc.id, { id: doc.id, ...data });
        }
      });
      console.log(`✅ Layer 2 total: ${results.size} appointments`);
    } catch (err) {
      console.warn('⚠️ Layer 2 failed:', err.message);
    }
  }

  // Layer 3: patient-linked discovery
  const patientIds = new Set();
  results.forEach((appt) => {
    if (appt.patientId) patientIds.add(appt.patientId);
  });

  for (const patientId of patientIds) {
    try {
      const q = query(appointmentsRef, where('patientId', '==', patientId));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        if (!results.has(doc.id)) {
          results.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    } catch (err) {
      console.warn(`⚠️ Layer 3 failed for patient ${patientId}:`, err.message);
    }
  }

  console.log(`✅ Layer 3 total: ${results.size} appointments`);

  const appointments = Array.from(results.values());
  const active = appointments.filter((a) => a.isArchived !== true);

  active.sort((a, b) => {
    const aDate = a.bookingDate || '';
    const bDate = b.bookingDate || '';
    return bDate.localeCompare(aDate);
  });

  return active;
};

// ==================================================
// ✅ Upcoming appointment
// ==================================================
export const findUpcomingAppointments = async (hospitalId, user) => {
  const all = await findUserAppointments(hospitalId, user);
  const today = new Date().toISOString().split('T')[0];

  const upcoming = all.filter((a) => {
    const status = (a.status || '').toLowerCase();
    const isActive = ['pending', 'confirmed', 'checked-in'].includes(status);
    const isFuture = a.bookingDate >= today;
    return isActive && isFuture;
  });

  upcoming.sort((a, b) => {
    // Primary: booking date ascending
    const dateCompare = (a.bookingDate || '').localeCompare(b.bookingDate || '');
    if (dateCompare !== 0) return dateCompare;

    // Secondary: serial number ascending
    return Number(a.serialNo || 0) - Number(b.serialNo || 0);
  });

  return upcoming;
};

// ==================================================
// ✅ Upcoming appointment (singular) — backward compatible
// ==================================================
export const findUpcomingAppointment = async (hospitalId, user) => {
  const all = await findUpcomingAppointments(hospitalId, user);
  return all[0] || null;
};

// ==================================================
// ✅ Filter helpers
// ==================================================
export const filterAppointmentsByStatus = (appointments, status) => {
  if (!status || status === 'all') return appointments;
  return appointments.filter((a) => a.status === status);
};

export const groupAppointmentsByDate = (appointments) => {
  const groups = {};
  appointments.forEach((appt) => {
    const date = appt.bookingDate || 'unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(appt);
  });
  return groups;
};

export default {
  findUserAppointments,
  findUpcomingAppointments,
  findUpcomingAppointment, 
  findUpcomingAppointment,
  filterAppointmentsByStatus,
  groupAppointmentsByDate,
};