// src/services/qrService.js
// ==================================================
// 📱 QR Service — Generate, Verify, Check-in
// ==================================================
// ✅ QR code generation (URL-encoded)
// ✅ QR verification
// ✅ Check-in with location tracking
// ✅ Backward compatible (works with/without location data)
// ==================================================
import QRCode from 'qrcode';
import { db, doc, getDoc, updateDoc } from '../firebase';

const HOSPITAL_PATH = 'hospitals/alafiyah_main';

// ==================================================
// ✅ QR কোড জেনারেট করা (URL এনকোড করা)
// ==================================================
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
        light: '#ffffff',
      },
    });

    await updateDoc(apptRef, {
      qrCode: qrImage,
      qrData: qrData,
      qrGeneratedAt: new Date().toISOString(),
    });

    return qrImage;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// ==================================================
// ✅ QR কোড ভেরিফাই করা
// ==================================================
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

// ==================================================
// ✅ QR কোড দিয়ে চেক-ইন করা — WITH LOCATION TRACKING
// ==================================================
// @param {string} appointmentId
// @param {Object} options - { location: { gps, geo, device, capturedAt } }
// ==================================================
export const checkInWithQR = async (appointmentId, options = {}) => {
  try {
    const apptRef = doc(db, HOSPITAL_PATH, 'appointments', appointmentId);

    // ✅ Build update data
    const updateData = {
      status: 'checked-in',
      checkedInAt: new Date().toISOString(),
      checkedInVia: 'qr',
    };

    // ==================================================
    // ✅ Add location data if provided
    // ==================================================
    const { location } = options;

    if (location) {
      // ✅ Full location details
      updateData.checkInLocation = {
        // GPS coordinates
        latitude: location.gps?.latitude ?? null,
        longitude: location.gps?.longitude ?? null,
        accuracy: location.gps?.accuracy ?? null,

        // Reverse geocoded address
        country: location.geo?.country || '',
        countryCode: location.geo?.countryCode || '',
        division: location.geo?.division || '',
        district: location.geo?.district || '',
        city: location.geo?.city || '',
        area: location.geo?.area || '',
        road: location.geo?.road || '',
        postcode: location.geo?.postcode || '',
        fullAddress: location.geo?.fullAddress || '',

        // Device info
        browser: location.device?.browser || '',
        os: location.device?.os || '',
        deviceType: location.device?.deviceType || '',
        language: location.device?.language || '',
        screenSize: location.device?.screenSize || '',
        timezone: location.device?.timezone || '',
        referrer: location.device?.referrer || '',
        userAgent: location.device?.userAgent || '',

        // Meta
        capturedAt: location.capturedAt || new Date().toISOString(),
      };

      // ✅ Human-readable summary for quick display
      const summaryParts = [
        location.geo?.area,
        location.geo?.city,
        location.geo?.district,
        location.geo?.division,
      ].filter(Boolean);

      // Remove duplicates (e.g., "Chattogram, Chattogram")
      const uniqueSummary = [...new Set(summaryParts)];
      updateData.checkInLocationSummary =
        uniqueSummary.length > 0
          ? uniqueSummary.join(', ')
          : 'Unknown Location';

      console.log('✅ Check-in with location:', {
        appointmentId,
        summary: updateData.checkInLocationSummary,
        hasGPS: !!location.gps,
        hasGeo: !!location.geo,
        device: location.device?.deviceType,
      });
    } else {
      // ✅ No location data — still save check-in
      updateData.checkInLocationSummary = 'Location not captured';
      console.log('✅ Check-in without location:', appointmentId);
    }

    // ==================================================
    // ✅ Update Firestore
    // ==================================================
    await updateDoc(apptRef, updateData);

    return true;
  } catch (error) {
    console.error('Check-in error:', error);
    throw error;
  }
};

// ==================================================
// ✅ অ্যাপয়েন্টমেন্টের QR কোড পাওয়া
// ==================================================
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

// ==================================================
// ✅ Default export (ঐচ্ছিক)
// ==================================================
export default {
  generateQRCode,
  verifyQRCode,
  checkInWithQR,
  getAppointmentQR,
};