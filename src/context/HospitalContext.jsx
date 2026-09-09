// src/context/HospitalContext.jsx
import React, { createContext, useContext } from 'react';

const HospitalContext = createContext();

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export function HospitalProvider({ children }) {
  // সব সময় ডিফল্ট হাসপিটাল আইডি ব্যবহার করবে
  const hospitalId = DEFAULT_HOSPITAL_ID;
  const currentHospital = { id: hospitalId, name: 'আল-আফিয়া হাসপাতাল' };

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