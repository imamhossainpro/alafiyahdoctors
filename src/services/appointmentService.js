import { db, collection, onSnapshot, updateDoc, deleteDoc, doc, addDoc, query, orderBy, getDoc } from '../firebase';

// ✅ status যাচাই করে normalize করুন
const normalizeStatus = (appt) => {
  const status = typeof appt.status === 'string' ? appt.status : 'pending';
  if (status === 'approved') return { ...appt, status: 'confirmed' };
  if (status === 'deleted') return { ...appt, status: 'archived', isArchived: true };
  return { ...appt, status };
};

// ✅ অ্যাপয়েন্টমেন্ট লিসেনার (hospitalId ভিত্তিক)
export const subscribeToAppointments = (hospitalId, callback) => {
  if (!hospitalId) {
    console.warn('⚠️ subscribeToAppointments: hospitalId নেই');
    return () => {};
  }
  if (typeof callback !== 'function') {
    console.error('❌ subscribeToAppointments: callback একটি ফাংশন হতে হবে');
    return () => {};
  }
  
  const q = collection(db, 'hospitals', hospitalId, 'appointments');
  return onSnapshot(q, (snapshot) => {
    const appointments = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const normalized = normalizeStatus({ id: doc.id, ...data });
      if (!normalized.isArchived) appointments.push(normalized);
    });
    callback(appointments);
  }, (error) => {
    console.error('❌ subscribeToAppointments error:', error);
    callback([]);
  });
};

// ✅ আর্কাইভ অ্যাপয়েন্টমেন্ট লিসেনার
export const subscribeToArchivedAppointments = (hospitalId, callback) => {
  if (!hospitalId) {
    console.warn('⚠️ subscribeToArchivedAppointments: hospitalId নেই');
    return () => {};
  }
  if (typeof callback !== 'function') {
    console.error('❌ subscribeToArchivedAppointments: callback একটি ফাংশন হতে হবে');
    return () => {};
  }

  const q = collection(db, 'hospitals', hospitalId, 'appointments');
  return onSnapshot(q, (snapshot) => {
    const archived = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const normalized = normalizeStatus({ id: doc.id, ...data });
      if (normalized.isArchived || normalized.status === 'archived') archived.push(normalized);
    });
    callback(archived);
  }, (error) => {
    console.error('❌ subscribeToArchivedAppointments error:', error);
    callback([]);
  });
};

// ✅ অডিট লগ লিসেনার
export const subscribeToAuditLogs = (hospitalId, callback) => {
  if (!hospitalId) {
    console.warn('⚠️ subscribeToAuditLogs: hospitalId নেই');
    return () => {};
  }
  if (typeof callback !== 'function') {
    console.error('❌ subscribeToAuditLogs: callback একটি ফাংশন হতে হবে');
    return () => {};
  }

  const q = query(collection(db, 'hospitals', hospitalId, 'audit_logs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((doc) => logs.push({ id: doc.id, ...doc.data() }));
    callback(logs);
  }, (error) => {
    console.error('❌ subscribeToAuditLogs error:', error);
    callback([]);
  });
};

// ✅ অডিট লগ যোগ করুন
export const addAuditLog = async (hospitalId, logData) => {
  if (!hospitalId) {
    console.warn('⚠️ addAuditLog: hospitalId নেই');
    return;
  }
  try {
    await addDoc(collection(db, 'hospitals', hospitalId, 'audit_logs'), {
      ...logData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Audit log error:', error);
  }
};

// ✅ স্ট্যাটাস আপডেট
export const updateAppointmentStatus = async (hospitalId, id, status) => {
  if (!hospitalId || !id) return;
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId, 'appointments', id), { 
      status, 
      isArchived: status === 'archived' 
    });
  } catch (error) {
    console.error('❌ updateAppointmentStatus error:', error);
  }
};

// ✅ আর্কাইভ
export const archiveAppointment = async (hospitalId, id) => {
  if (!hospitalId || !id) return;
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId, 'appointments', id), { 
      status: 'archived', 
      isArchived: true 
    });
  } catch (error) {
    console.error('❌ archiveAppointment error:', error);
  }
};

// ✅ রিস্টোর
export const restoreAppointment = async (hospitalId, id) => {
  if (!hospitalId || !id) return;
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId, 'appointments', id), { 
      status: 'pending', 
      isArchived: false 
    });
  } catch (error) {
    console.error('❌ restoreAppointment error:', error);
  }
};

// ✅ ডিলিট (স্থায়ী) – লোকেশন কাউন্টও আপডেট করে
export const deleteAppointment = async (hospitalId, id) => {
  if (!hospitalId || !id) return;
  try {
    // ১. অ্যাপয়েন্টমেন্ট ডেটা থেকে লোকেশন আইডি বের করুন
    const apptRef = doc(db, 'hospitals', hospitalId, 'appointments', id);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) {
      console.warn('⚠️ অ্যাপয়েন্টমেন্ট পাওয়া যায়নি, ডিলিট স্কিপ');
      return;
    }
    const apptData = apptSnap.data();
    const locationId = apptData.locationId;

    // ২. অ্যাপয়েন্টমেন্ট ডিলিট করুন
    await deleteDoc(apptRef);

    // ৩. লোকেশন কাউন্ট আপডেট করুন (যদি লোকেশন আইডি থাকে)
    if (locationId) {
      const locRef = doc(db, 'hospitals', hospitalId, 'locations', locationId);
      const locSnap = await getDoc(locRef);
      if (locSnap.exists()) {
        const currentCount = locSnap.data().patientCount || 0;
        const newCount = Math.max(0, currentCount - 1);
        if (newCount === 0) {
          await deleteDoc(locRef);
          console.log(`🗑️ লোকেশন ${locationId} ডিলিট (কাউন্ট 0)`);
        } else {
          await updateDoc(locRef, { 
            patientCount: newCount, 
            updatedAt: new Date().toISOString() 
          });
        }
      }
    }
    return true;
  } catch (error) {
    console.error('❌ deleteAppointment error:', error);
    throw error;
  }
};