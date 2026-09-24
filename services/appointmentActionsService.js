// services/appointmentActionsService.js
// ==================================================
// 📅 Appointment Actions — Cancel, Status Update
// ==================================================
import {
  db,
  doc,
  getDoc,
  updateDoc,
} from '../firebase';

// ==================================================
// ✅ Cancel rules (client-side check)
// ==================================================
// Only `pending` status can be cancelled by patient
// ==================================================
export const canPatientCancel = (appointment) => {
  if (!appointment) return false;
  return appointment.status === 'pending';
};

// ==================================================
// ✅ Cancel appointment (patient-initiated)
// ==================================================
export const cancelAppointmentByPatient = async (
  hospitalId,
  appointmentId,
  user
) => {
  if (!hospitalId || !appointmentId) {
    throw new Error('Hospital ID and Appointment ID required');
  }

  // 1. Fetch current appointment
  const apptRef = doc(db, 'hospitals', hospitalId, 'appointments', appointmentId);
  const snap = await getDoc(apptRef);

  if (!snap.exists()) {
    throw new Error('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি');
  }

  const data = snap.data();

  // 2. Verify cancel rules
  if (!canPatientCancel(data)) {
    throw new Error(
      'এই সিরিয়ালটি বাতিল করা যাবে না। শুধু অপেক্ষমাণ সিরিয়াল বাতিল করা যায়।'
    );
  }

  // 3. Update status
  await updateDoc(apptRef, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledBy: 'patient',
    cancelledByUserId: user?.uid || null,
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ Appointment ${appointmentId} cancelled by patient`);
  return { success: true };
};

// ==================================================
// ✅ Get appointment by ID (for detail screen)
// ==================================================
export const getAppointmentById = async (hospitalId, appointmentId) => {
  if (!hospitalId || !appointmentId) return null;

  try {
    const apptRef = doc(db, 'hospitals', hospitalId, 'appointments', appointmentId);
    const snap = await getDoc(apptRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('❌ getAppointmentById error:', err);
    return null;
  }
};

export default {
  canPatientCancel,
  cancelAppointmentByPatient,
  getAppointmentById,
};