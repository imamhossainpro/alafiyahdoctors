import QRCode from 'qrcode';
import { db, doc, getDoc, updateDoc } from '../firebase';

const HOSPITAL_PATH = 'hospitals/alafiyah_main';

// QR কোড জেনারেট করা (URL এনকোড করা)
export const generateQRCode = async (appointmentId) => {
  try {
    const apptRef = doc(db, HOSPITAL_PATH, 'appointments', appointmentId);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) throw new Error('Appointment not found');
    
    const data = apptSnap.data();
    const baseUrl = window.location.origin;
    const qrData = `${baseUrl}/checkin/${appointmentId}`;
    
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1c5fa8',
        light: '#ffffff'
      }
    });
    
    await updateDoc(apptRef, {
      qrCode: qrImage,
      qrData: qrData,
      qrGeneratedAt: new Date().toISOString()
    });
    
    return qrImage;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// QR কোড ভেরিফাই করা
export const verifyQRCode = async (qrData) => {
  try {
    let appointmentId = null;
    if (typeof qrData === 'string' && qrData.includes('/checkin/')) {
      const parts = qrData.split('/checkin/');
      appointmentId = parts[1]?.split('?')[0] || null;
    } else {
      try {
        const parsed = JSON.parse(qrData);
        appointmentId = parsed.id;
      } catch (e) {
        appointmentId = qrData;
      }
    }
    
    if (!appointmentId) throw new Error('Invalid QR code');
    
    const apptRef = doc(db, HOSPITAL_PATH, 'appointments', appointmentId);
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
    console.error('QR verification error:', error);
    throw error;
  }
};

// QR কোড দিয়ে চেক-ইন করা
export const checkInWithQR = async (appointmentId) => {
  try {
    const apptRef = doc(db, HOSPITAL_PATH, 'appointments', appointmentId);
    await updateDoc(apptRef, {
      status: 'checked-in',
      checkedInAt: new Date().toISOString(),
      checkedInVia: 'qr'
    });
    return true;
  } catch (error) {
    console.error('Check-in error:', error);
    throw error;
  }
};

// অ্যাপয়েন্টমেন্টের QR কোড পাওয়া
export const getAppointmentQR = async (appointmentId) => {
  try {
    const apptRef = doc(db, HOSPITAL_PATH, 'appointments', appointmentId);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) return null;
    const data = apptSnap.data();
    return data.qrCode || null;
  } catch (error) {
    console.error('Get QR error:', error);
    return null;
  }
};