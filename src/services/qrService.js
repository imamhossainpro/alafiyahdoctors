import QRCode from 'qrcode';
import { db, doc, getDoc, updateDoc } from '../firebase';

// QR কোড জেনারেট করা (URL এনকোড করা)
export const generateQRCode = async (appointmentId) => {
  try {
    // অ্যাপয়েন্টমেন্টের তথ্য নেওয়া
    const apptRef = doc(db, 'appointments', appointmentId);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) throw new Error('Appointment not found');
    
    const data = apptSnap.data();
    
    // 🔥 পরিবর্তন: JSON এর বদলে পুরো চেক-ইন URL এনকোড করা
    const baseUrl = window.location.origin;
    const qrData = `${baseUrl}/checkin/${appointmentId}`;
    
    // QR কোড ইমেজ ডেটা (Base64)
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1c5fa8',
        light: '#ffffff'
      }
    });
    
    // Firebase-এ QR কোড সেভ করা (ঐচ্ছিক)
    await updateDoc(apptRef, {
      qrCode: qrImage,
      qrData: qrData, // এখন এটি URL হবে
      qrGeneratedAt: new Date().toISOString()
    });
    
    return qrImage;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// QR কোড ভেরিফাই করা (চেক-ইনের সময়)
export const verifyQRCode = async (qrData) => {
  try {
    // যদি qrData একটি URL হয়, তাহলে তা থেকে appointmentId বের করা
    let appointmentId = null;
    if (typeof qrData === 'string' && qrData.includes('/checkin/')) {
      const parts = qrData.split('/checkin/');
      appointmentId = parts[1]?.split('?')[0] || null;
    } else {
      // ব্যাকওয়ার্ড কম্প্যাটিবিলিটি: যদি কেউ JSON ডেটা দিয়ে স্ক্যান করে
      try {
        const parsed = JSON.parse(qrData);
        appointmentId = parsed.id;
      } catch (e) {
        // যদি JSON না হয়, তাহলে সরাসরি স্ট্রিং হিসেবে ধরা
        appointmentId = qrData;
      }
    }
    
    if (!appointmentId) throw new Error('Invalid QR code');
    
    const apptRef = doc(db, 'appointments', appointmentId);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) throw new Error('Appointment not found');
    
    const data = apptSnap.data();
    
    // ভেরিফাই: অ্যাপয়েন্টমেন্ট ইতিমধ্যে চেক-ইন হয়ে গেলে
    if (data.status === 'checked-in' || data.status === 'completed') {
      throw new Error('Already checked in');
    }
    
    // ভেরিফাই: আজকের তারিখের অ্যাপয়েন্টমেন্ট কিনা
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
    const apptRef = doc(db, 'appointments', appointmentId);
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

// অ্যাপয়েন্টমেন্টের QR কোড পাওয়া (যদি আগে জেনারেট করা থাকে)
export const getAppointmentQR = async (appointmentId) => {
  try {
    const apptRef = doc(db, 'appointments', appointmentId);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) return null;
    const data = apptSnap.data();
    return data.qrCode || null;
  } catch (error) {
    console.error('Get QR error:', error);
    return null;
  }
};