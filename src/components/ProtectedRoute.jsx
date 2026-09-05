// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute কম্পোনেন্ট – নির্দিষ্ট রোলের জন্য রাউট প্রোটেক্ট করে
 * @param {Object} props
 * @param {React.ReactNode} props.children - প্রোটেক্টেড কন্টেন্ট
 * @param {string} props.requiredRole - প্রয়োজনীয় রোল (যেমন: 'admin', 'super_admin')
 * @returns {React.ReactNode}
 */
export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  // লোডিং হলে কিছু দেখান
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>লোড হচ্ছে...</div>
      </div>
    );
  }

  // ইউজার লগইন না থাকলে হোমপেজে রিডাইরেক্ট
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // সুপার অ্যাডমিন চেক
  if (requiredRole === 'super_admin') {
    if (user.role !== 'super-admin') {
      return <Navigate to="/" replace />;
    }
  }

  // অ্যাডমিন চেক (হসপিটাল অ্যাডমিন বা সুপার অ্যাডমিন)
  if (requiredRole === 'admin') {
    if (!['admin', 'sub-admin', 'super-admin'].includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // এডিটর বা ভিউয়ার চেক (যদি প্রয়োজন)
  if (requiredRole === 'editor') {
    if (!['admin', 'sub-admin', 'editor'].includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // সব ঠিক থাকলে কন্টেন্ট রেন্ডার করুন
  return children;
}

// ডিফল্ট এক্সপোর্ট (ঐচ্ছিক)
export default ProtectedRoute;