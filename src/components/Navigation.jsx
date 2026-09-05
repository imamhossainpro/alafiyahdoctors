import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';

  return (
    <nav style={{ background: '#1c5fa8', padding: '10px 20px', display: 'flex', gap: '20px', alignItems: 'center', color: '#fff', flexWrap: 'wrap' }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>হোম</Link>
      <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>ড্যাশবোর্ড</Link>
      
      {(isAdmin || isSubAdmin) && (
        <Link to="/doctors" style={{ color: '#fff', textDecoration: 'none' }}>ডাক্তার লিস্ট</Link>
      )}
      
      {isAdmin && (
        <>
          <Link to="/admin/users" style={{ color: '#fff', textDecoration: 'none' }}>চাকুরা প্লাবেন</Link>
          <Link to="/admin/reports" style={{ color: '#fff', textDecoration: 'none' }}>বিবিধান বিনিয়োগ করুন</Link>
          {/* আপনার অন্যান্য অপশন */}
        </>
      )}
      
      <button onClick={handleLogout} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
        লগআউট
      </button>
    </nav>
  );
}