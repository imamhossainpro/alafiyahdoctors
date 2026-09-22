// services/qrService.js
// ==================================================
// 📱 QR Code Service (React Native)
// ==================================================
import QRCode from 'react-native-qrcode-svg';
import { db, doc, getDoc, updateDoc } from '../firebase';

// ✅ আপনার production URL (web app যেখানে হোস্ট)
const WEB_APP_URL = 'https://doctors.alafiyahhospital.com';

const HOSPITAL_ID = 'alafiyah_main';

// ==================================================
// ✅ QR কোড জেনারেট (URL string রিটার্ন করে)
// ==================================================
export const generateQRCodeData = (appointmentId) => {
  return `${WEB_APP_URL}/checkin/${appointmentId}`;
};

// ==================================================
// ✅ Appointment-এ QR সেভ করা
// ==================================================
export const saveQRToAppointment = async (appointmentId) => {
  try {
    const qrData = generateQRCodeData(appointmentId);
    const apptRef = doc(
      db,
      'hospitals',
      HOSPITAL_ID,
      'appointments',
      appointmentId
    );

    await updateDoc(apptRef, {
      qrData,
      qrGeneratedAt: new Date().toISOString(),
    });

    return qrData;
  } catch (error) {
    console.error('❌ saveQRToAppointment error:', error);
    return null;
  }
};

// ==================================================
// ✅ QR ভেরিফাই (Check-In এর জন্য)
// ==================================================
export const verifyQRCode = async (qrData) => {
  try {
    let appointmentId = null;

    if (typeof qrData === 'string' && qrData.includes('/checkin/')) {
      const parts = qrData.split('/checkin/');
      appointmentId = parts[1]?.split('?')[0] || null;
    } else {
      appointmentId = qrData;
    }

    if (!appointmentId) throw new Error('Invalid QR code');

    const apptRef = doc(
      db,
      'hospitals',
      HOSPITAL_ID,
      'appointments',
      appointmentId
    );
    const apptSnap = await getDoc(apptRef);

    if (!apptSnap.exists()) throw new Error('Appointment not found');

    const data = apptSnap.data();

    if (data.status === 'checked-in' || data.status === 'completed') {
      throw new Error('Already checked in');
    }

    const today = new Date().toISOString().split('T')[0];
    if (data.bookingDate !== today) {
      throw new Error('Appointment is not for today');
    }

    return { appointmentId, data };
  } catch (error) {
    console.error('❌ verifyQRCode error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Check-In করা
// ==================================================
export const checkInWithQR = async (appointmentId) => {
  try {
    const apptRef = doc(
      db,
      'hospitals',
      HOSPITAL_ID,
      'appointments',
      appointmentId
    );

    await updateDoc(apptRef, {
      status: 'checked-in',
      checkedInAt: new Date().toISOString(),
      checkedInVia: 'qr',
    });

    return true;
  } catch (error) {
    console.error('❌ checkInWithQR error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Appointment-এর QR ডেটা পাওয়া
// ==================================================
export const getAppointmentQR = async (appointmentId) => {
  try {
    const apptRef = doc(
      db,
      'hospitals',
      HOSPITAL_ID,
      'appointments',
      appointmentId
    );
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) return null;
    const data = apptSnap.data();
    return data.qrData || null;
  } catch (error) {
    console.error('❌ getAppointmentQR error:', error);
    return null;
  }
};

export default {
  generateQRCodeData,
  saveQRToAppointment,
  verifyQRCode,
  checkInWithQR,
  getAppointmentQR,
};