import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import HospitalSwitcher from './HospitalSwitcher';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <HospitalSwitcher />
        </div>
        <Outlet />
      </div>
    </div>
  );
}