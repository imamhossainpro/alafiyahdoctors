import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Hospital, Users, Calendar, Stethoscope, 
  CreditCard, Activity, Settings, LogOut, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/super-admin', icon: LayoutDashboard, label: 'Overview' },
    { path: '/super-admin/hospitals', icon: Hospital, label: 'Hospitals' },
    { path: '/super-admin/users', icon: Users, label: 'Users' },
    { path: '/super-admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/super-admin/doctors', icon: Stethoscope, label: 'Doctors' },
    { path: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/super-admin/activity', icon: Activity, label: 'Activity Logs' },
    { path: '/super-admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      background: '#0f172a',
      color: '#94a3b8',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      flexShrink: 0
    }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={24} color="#8b5cf6" />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Super Admin</span>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{user?.email}</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: active ? '#1e293b' : 'transparent',
                color: active ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s',
                marginBottom: '2px'
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#1e293b'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}