// src/services/patientAuthService.js
// ==================================================
// 👤 Patient Auth Service — Patient-specific helpers
// ==================================================
// ✅ Link existing appointments to a patient's userId
// ✅ Subscribe to patient's bookings (real-time)
// ✅ Save/update patient profile
// ==================================================
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from '../firebase';

// ==================================================
// ✅ Normalize mobile number (returns array of variants)
// ==================================================
const getMobileVariants = (mobile) => {
  if (!mobile) return [];
  const clean = String(mobile).replace(/[^0-9]/g, '');
  if (!clean) return [];

  const variants = new Set();

  // Add the raw cleaned version
  variants.add(clean);

  // If starts with 88 → also add without 88, and with 0
  if (clean.startsWith('88')) {
    const withoutCC = clean.slice(2);
    variants.add(withoutCC);
    if (!withoutCC.startsWith('0')) {
      variants.add('0' + withoutCC);
    }
  } else if (clean.startsWith('0')) {
    // starts with 0 → add without 0, and with 88
    const withoutZero = clean.slice(1);
    variants.add(withoutZero);
    variants.add('88' + clean);
    variants.add('88' + withoutZero);
  } else {
    // doesn't start with 0 or 88
    variants.add('0' + clean);
    variants.add('88' + clean);
  }

  return [...variants].filter(Boolean);
};

// ==================================================
// ✅ Link existing appointments to a patient's userId
// (mobile number দিয়ে match করে)
// ==================================================
export const linkAppointmentsToPatient = async (
  hospitalId,
  userId,
  mobile
) => {
  if (!hospitalId || !userId || !mobile) return { updated: 0 };

  try {
    const variants = getMobileVariants(mobile);
    let updatedCount = 0;

    // Query appointments by each mobile variant
    for (const variant of variants) {
      try {
        const q = query(
          collection(db, 'hospitals', hospitalId, 'appointments'),
          where('mobile', '==', variant)
        );
        const snap = await getDocs(q);

        for (const apptDoc of snap.docs) {
          const data = apptDoc.data();
          // Only link if not already linked to a different user
          if (!data.userId) {
            await setDoc(
              apptDoc.ref,
              { userId, linkedAt: serverTimestamp() },
              { merge: true }
            );
            updatedCount++;
          } else if (data.userId === userId) {
            // Already linked, skip
          }
        }
      } catch (innerErr) {
        console.warn(`Mobile variant query failed (${variant}):`, innerErr.message);
      }
    }

    if (updatedCount > 0) {
      console.log(`✅ Linked ${updatedCount} appointments to user ${userId}`);
    }
    return { updated: updatedCount };
  } catch (err) {
    console.error('❌ linkAppointmentsToPatient error:', err);
    return { updated: 0 };
  }
};

// ==================================================
// ✅ Subscribe to patient's bookings (real-time)
// Primary: by userId
// Fallback: by mobile
// ==================================================
export const subscribeToPatientBookings = (
  hospitalId,
  userId,
  mobile,
  callback,
  errorCallback
) => {
  if (!hospitalId || !userId) {
    if (callback) callback([]);
    return () => {};
  }

  try {
    // Primary query: by userId
    const q = query(
      collection(db, 'hospitals', hospitalId, 'appointments'),
      where('userId', '==', userId)
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        // Collect primary results
        const bookingsMap = new Map();
        snap.docs.forEach((d) => {
          bookingsMap.set(d.id, { id: d.id, ...d.data() });
        });

        // ✅ Fallback: also fetch by mobile variants
        if (mobile) {
          const variants = getMobileVariants(mobile);
          for (const variant of variants) {
            try {
              const q2 = query(
                collection(db, 'hospitals', hospitalId, 'appointments'),
                where('mobile', '==', variant)
              );
              const snap2 = await getDocs(q2);
              snap2.forEach((d) => {
                if (!bookingsMap.has(d.id)) {
                  bookingsMap.set(d.id, { id: d.id, ...d.data() });
                }
              });
            } catch (err) {
              // Silent fail on individual variant
            }
          }
        }

        // Convert to array
        const bookings = Array.from(bookingsMap.values());

        // Sort by createdAt desc (newest first)
        bookings.sort((a, b) => {
          const getTime = (item) => {
            const created = item.createdAt;
            if (!created) return 0;
            if (typeof created === 'object' && created.seconds) {
              return created.seconds * 1000;
            }
            if (created.toDate && typeof created.toDate === 'function') {
              return created.toDate().getTime();
            }
            try {
              return new Date(created).getTime();
            } catch {
              return 0;
            }
          };
          return getTime(b) - getTime(a);
        });

        if (callback) callback(bookings);
      },
      (err) => {
        console.error('❌ subscribeToPatientBookings error:', err);
        if (errorCallback) errorCallback(err);
      }
    );

    return unsub;
  } catch (err) {
    console.error('❌ subscribeToPatientBookings setup error:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Save / update patient profile
// ==================================================
export const upsertPatientProfile = async (hospitalId, userId, profile) => {
  if (!hospitalId || !userId) return;

  try {
    const ref = doc(db, 'hospitals', hospitalId, 'users', userId);
    await setDoc(
      ref,
      {
        ...profile,
        role: profile.role || 'patient',
        approved: true,
        isActive: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err) {
    console.error('❌ upsertPatientProfile error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Get single booking by ID
// ==================================================
export const getBookingById = async (hospitalId, appointmentId) => {
  if (!hospitalId || !appointmentId) return null;
  try {
    const ref = doc(db, 'hospitals', hospitalId, 'appointments', appointmentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('❌ getBookingById error:', err);
    return null;
  }
};

// ==================================================
// ✅ Default export
// ==================================================
export default {
  linkAppointmentsToPatient,
  subscribeToPatientBookings,
  upsertPatientProfile,
  getBookingById,
};