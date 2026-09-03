import React, { createContext, useContext, useState, useEffect } from 'react';

const HospitalContext = createContext();

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
}

export function HospitalProvider({ children }) {
  // ✅ সবসময় ডিফল্ট হাসপাতাল সেট থাকবে (লগইন ছাড়াও)
  const [currentHospital, setCurrentHospital] = useState({
    id: 'alafiyah_main',
    name: 'আল-আফিয়া হাসপাতাল'
  });
  const [loading, setLoading] = useState(false);

  // ভবিষ্যতে হাসপাতাল পরিবর্তনের ফাংশন
  const switchHospital = (hospitalId) => {
    setCurrentHospital({
      id: hospitalId,
      name: 'আল-আফিয়া হাসপাতাল'
    });
  };

  return (
    <HospitalContext.Provider value={{ currentHospital, loading, switchHospital }}>
      {children}
    </HospitalContext.Provider>
  );
}