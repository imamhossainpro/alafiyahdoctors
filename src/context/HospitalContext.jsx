// src/context/HospitalContext.jsx
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const HospitalContext = createContext();

export function HospitalProvider({ children }) {
  const { user } = useAuth();
  // ইউজারের hospitalId ব্যবহার করুন, অথবা ডিফল্ট
  const hospitalId = user?.hospitalId || 'alafiyah_main';
  const currentHospital = { id: hospitalId, name: 'আল-আফিয়া হাসপাতাল' };

  return (
    <HospitalContext.Provider value={{ currentHospital }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) throw new Error('useHospital must be used within HospitalProvider');
  return context;
}