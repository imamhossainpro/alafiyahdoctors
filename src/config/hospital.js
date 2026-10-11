// src/config/hospital.js
// ==================================================
// 🏥 Hospital Configuration
// ==================================================
// ⚠️ IMPORTANT: latitude/longitude আপনার আসল হাসপাতালের coordinate দিন
// কীভাবে বের করবেন:
//   1. Google Maps → আপনার হাসপাতাল search করুন
//   2. Right-click → coordinate copy (যেমন: 22.3569, 91.7832)
//   3. নিচে replace করুন
// ==================================================

export const HOSPITAL_CONFIG = {
  id: 'alafiyah_main',
  name: 'Al-Afiyah Hospital',
  nameBn: 'আল-আফিয়াহ হাসপাতাল',

  // ✅ Hospital GPS Coordinates (Bakalia, Chattogram)
  location: {
    latitude: 22.4235,      // ⚠️ এটা পরিবর্তন করুন — আপনার আসল coordinate
    longitude: 91.8123,     // ⚠️ এটা পরিবর্তন করুন — আপনার আসল coordinate
    fullAddress: 'Bakalia Access Road, Bakalia, Chattogram',
    city: 'Chattogram',
    district: 'Chattogram',
    division: 'Chattogram',
    country: 'Bangladesh',
  },

  contact: {
    hotline: '01886-776512',
    secondaryHotline: '01886-776513',
  },

  features: {
    trackLocation: true,
    calculateDistance: true,
  },
};

export default HOSPITAL_CONFIG;