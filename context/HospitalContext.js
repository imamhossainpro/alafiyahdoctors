// context/HospitalContext.js
// ==================================================
// 🏥 হাসপাতাল কনটেক্সট
// সব জায়গায় হাসপাতালের তথ্য পাওয়ার জন্য
// ==================================================
import React, { createContext, useContext } from 'react';

const HospitalContext = createContext();

// ✅ আপনার হাসপাতাল আইডি (Web app এর সাথে একই)
const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export function HospitalProvider({ children }) {
  const hospitalId = DEFAULT_HOSPITAL_ID;
  const currentHospital = {
    id: hospitalId,
    name: 'আল-আফিয়া হাসপাতাল',
    subtitle: 'স্বাস্থ্যসেবায় বিশ্বাস',
  };

  return (
    <HospitalContext.Provider value={{ hospitalId, currentHospital }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within HospitalProvider');
  }
  return context;
}