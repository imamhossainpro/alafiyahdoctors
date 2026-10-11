// src/config/hospital.js
// ==================================================
// 🏥 Hospital Configuration
// ==================================================
// ✅ Al Afiyah Hospital & Diagnostic Centre Limited
// ✅ Bakalia Access Road, Bakalia, Chattogram
// ✅ Coordinates verified from Google Maps
// ==================================================

export const HOSPITAL_CONFIG = {
  id: 'alafiyah_main',
  name: 'Al-Afiyah Hospital & Diagnostic Centre Limited',
  nameBn: 'আল-আফিয়াহ হাসপাতাল এন্ড ডায়াগনস্টিক সেন্টার',

  // ✅ Hospital GPS Coordinates (Verified from Google Maps)
  location: {
    latitude: 22.3508119,
    longitude: 91.8475064,
    fullAddress: 'Jane Alom Dovash Road (Bakalia Access Road), Bakalia, Chattogram',
    city: 'Chattogram',
    district: 'Chattogram',
    division: 'Chattogram',
    country: 'Bangladesh',
    countryCode: 'BD',
    postcode: '4000',
  },

  // ✅ Contact Info
  contact: {
    hotline: '01886-776512',
    secondaryHotline: '01886-776513',
  },

  // ✅ Feature Flags
  features: {
    trackLocation: true,
    calculateDistance: true,
    showMapView: false,
  },
};

export default HOSPITAL_CONFIG;