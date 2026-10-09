// src/components/patient/PatientDashboard.jsx
// ==================================================
// 👤 Patient Dashboard — My Bookings
// ==================================================
// ✅ Real-time booking list
// ✅ Filter by status
// ✅ Statistics summary
// ✅ Modern UI with cards
// ✅ Header-এ action buttons
// ✅ Mobile না থাকলে banner (redirect নয়)
// ✅ Sorting: সর্বশেষ updated booking সবার উপরে
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User as UserIcon,
  LogOut,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Phone,
  Plus,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import {
  subscribeToPatientBookings,
  linkAppointmentsToPatient,
} from '../../services/patientAuthService';
import BookingCard from './BookingCard';
import EmptyState from './EmptyState';
import { AppShellSkeleton } from '../ui/SkeletonScreens';

// ==================================================
// ✅ Filter tabs
// ==================================================
const FILTERS = [
  { key: 'all', label: 'সব', icon: Calendar },
  { key: 'active', label: 'সক্রিয়', icon: TrendingUp },
  { key: 'completed', label: 'সম্পন্ন', icon: CheckCircle2 },
  { key: 'cancelled', label: 'বাতিল', icon: XCircle },
];

// ==================================================
// ✅ Helper: Get the most recent timestamp for sorting
// ==================================================
const getLatestTimestamp = (booking) => {
  // Priority: updatedAt > statusChangedAt > createdAt > timestamp > bookingDate
  const candidates = [
    booking.updatedAt,
    booking.statusChangedAt,
    booking.confirmedAt,
    booking.checkedInAt,
    booking.completedAt,
    booking.cancelledAt,
    booking.createdAt,
    booking.timestamp,
    booking.bookingDate,
  ];

  for (const ts of candidates) {
    if (!ts) continue;

    // Firestore Timestamp
    if (typeof ts === 'object' && ts.seconds) {
      return ts.seconds * 1000;
    }
    // ISO string or Date
    const parsed = new Date(ts).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  return 0;
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // ==================================================
  // ✅ Redirect if not logged in
  // ==================================================
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ==================================================
  // ✅ Link old appointments on mount
  // ==================================================
  useEffect(() => {
    const link = async () => {
      if (!user?.uid || !user?.mobile) return;
      try {
        const result = await linkAppointmentsToPatient(
          hospitalId,
          user.uid,
          user.mobile
        );
        if (result.updated > 0) {
          console.log(`✅ Linked ${result.updated} existing appointments`);
        }
      } catch (err) {
        console.warn('Link error:', err);
      }
    };
    link();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.mobile, hospitalId]);

  // ==================================================
  // ✅ Subscribe to bookings (real-time)
  // ==================================================
  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsub = subscribeToPatientBookings(
      hospitalId,
      user.uid,
      user.mobile,
      (list) => {
        setBookings(list || []);
        setLoading(false);
      },
      (err) => {
        console.error('Bookings load error:', err);
        setError('বুকিং লোড করতে সমস্যা হয়েছে');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.mobile, hospitalId, reloadKey]);

  // ==================================================
  // ✅ Sorted bookings — সর্বশেষ updated সবার উপরে
  // ==================================================
  const sortedBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    return [...bookings].sort((a, b) => {
      const timeA = getLatestTimestamp(a);
      const timeB = getLatestTimestamp(b);
      return timeB - timeA; // descending: newest first
    });
  }, [bookings]);

  // ==================================================
  // ✅ Filtered bookings (sorted order বজায় রেখে)
  // ==================================================
  const filteredBookings = useMemo(() => {
    if (filter === 'all') return sortedBookings;

    if (filter === 'active') {
      return sortedBookings.filter(
        (b) => !['completed', 'cancelled', 'no-show'].includes(b.status)
      );
    }
    if (filter === 'completed') {
      return sortedBookings.filter((b) => b.status === 'completed');
    }
    if (filter === 'cancelled') {
      return sortedBookings.filter(
        (b) => b.status === 'cancelled' || b.status === 'no-show'
      );
    }
    return sortedBookings;
  }, [sortedBookings, filter]);

  // ==================================================
  // ✅ Stats
  // ==================================================
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter(
        (b) => !['completed', 'cancelled', 'no-show'].includes(b.status)
      ).length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter(
        (b) => b.status === 'cancelled' || b.status === 'no-show'
      ).length,
    };
  }, [bookings]);

  // ==================================================
  // ✅ Refresh
  // ==================================================
  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  // ==================================================
  // ✅ Loading
  // ==================================================
  if (authLoading || (loading && bookings.length === 0 && !error)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fa' }}>
        <AppShellSkeleton />
      </div>
    );
  }

  // ==================================================
  // ✅ Not logged in
  // ==================================================
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fa',
          padding: '20px',
          fontFamily:
            "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '40px 32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            maxWidth: '420px',
          }}
        >
          <AlertCircle
            size={48}
            color="#1c5fa8"
            style={{ marginBottom: '16px' }}
          />
          <h2
            style={{
              margin: '0 0 8px',
              color: '#1e293b',
              fontSize: '20px',
            }}
          >
            লগইন প্রয়োজন
          </h2>
          <p
            style={{
              color: '#64748b',
              margin: '0 0 20px',
              fontSize: '14px',
            }}
          >
            আপনার বুকিং স্ট্যাটাস দেখতে অনুগ্রহ করে লগইন করুন।
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 24px',
              background: '#1c5fa8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          >
            লগইন করুন
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f6fa',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        paddingBottom: '60px',
      }}
    >
      {/* ==================================================
          Header
          ================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1c5fa8 0%, #2b7ec9 100%)',
          color: '#fff',
          padding: '28px 20px 60px',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserIcon size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>
                স্বাগতম
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>
                {user.name || user.email?.split('@')[0] || 'রোগী'}
              </div>
              {user.mobile && (
                <div
                  style={{
                    fontSize: '12px',
                    opacity: 0.85,
                    marginTop: '2px',
                  }}
                >
                  📱 +{user.mobile}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => navigate('/booking')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(13,148,136,0.35)',
              }}
            >
              <Plus size={15} />
              সিরিয়াল নিশ্চিত করুন
            </button>

            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Calendar size={15} />
              আজকের ডাক্তার সময়সূচি
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              রিফ্রেশ
            </button>

            <button
              onClick={() => navigate('/profile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <UserIcon size={14} />
              প্রোফাইল
            </button>

            <button
              onClick={async () => {
                await logout();
                navigate('/', { replace: true });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(220,38,38,0.9)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <LogOut size={14} />
              লগআউট
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          Mobile Missing Banner
          ================================================== */}
      {user && !user.mobile && (
        <div
          style={{
            maxWidth: '900px',
            margin: '-30px auto 0',
            padding: '0 20px',
            position: 'relative',
            zIndex: 3,
          }}
        >
          <div
            style={{
              background:
                'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1.5px solid #f59e0b',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 16px rgba(245,158,11,0.2)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '22px',
              }}
            >
              📱
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#92400e',
                  marginBottom: '2px',
                }}
              >
                মোবাইল নাম্বার যোগ করুন
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#78350f',
                  lineHeight: 1.5,
                }}
              >
                মোবাইল নাম্বার ছাড়া আপনার সিরিয়াল খুঁজে পাওয়া যাবে না।
              </div>
            </div>
            <button
              onClick={() => navigate('/add-mobile')}
              style={{
                padding: '10px 20px',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              এখনই যোগ করুন →
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          Stats Cards
          ================================================== */}
      <div
        style={{
          maxWidth: '900px',
          margin: user?.mobile ? '-30px auto 0' : '16px auto 0',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <StatCard
          label="মোট বুকিং"
          value={stats.total}
          color="#1c5fa8"
          bg="#eff6ff"
        />
        <StatCard
          label="সক্রিয়"
          value={stats.active}
          color="#d97706"
          bg="#fef3c7"
        />
        <StatCard
          label="সম্পন্ন"
          value={stats.completed}
          color="#16a34a"
          bg="#dcfce7"
        />
      </div>

      {/* ==================================================
          Filters
          ================================================== */}
      <div
        style={{
          maxWidth: '900px',
          margin: '24px auto 0',
          padding: '0 20px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          overflowX: 'auto',
        }}
      >
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: active ? '#1c5fa8' : '#fff',
                color: active ? '#fff' : '#475569',
                border: active ? 'none' : '1.5px solid #e2e8f0',
                borderRadius: '22px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                boxShadow: active
                  ? '0 4px 12px rgba(28,95,168,0.3)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {f.label}
              {f.key !== 'all' && (
                <span
                  style={{
                    padding: '1px 8px',
                    background: active
                      ? 'rgba(255,255,255,0.25)'
                      : '#f1f5f9',
                    color: active ? '#fff' : '#64748b',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  {f.key === 'active'
                    ? stats.active
                    : f.key === 'completed'
                    ? stats.completed
                    : stats.cancelled}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================
          Error
          ================================================== */}
      {error && (
        <div
          style={{
            maxWidth: '900px',
            margin: '20px auto 0',
            padding: '0 20px',
          }}
        >
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              onClick={handleRefresh}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                background: '#fff',
                color: '#991b1b',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
            >
              আবার চেষ্টা
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          Booking List
          ================================================== */}
      <div
        style={{
          maxWidth: '900px',
          margin: '20px auto 0',
          padding: '0 20px',
        }}
      >
        {filteredBookings.length === 0 ? (
          <EmptyState
            isFiltered={filter !== 'all' && bookings.length > 0}
            onReset={() => setFilter('all')}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          Floating "New Booking" button
          ================================================== */}
      <button
        onClick={() => navigate('/booking')}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 22px',
          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
          color: '#fff',
          border: 'none',
          borderRadius: '30px',
          fontSize: '14.5px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(13,148,136,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'inherit',
          zIndex: 10,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = 'scale(1.05)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = 'scale(1)')
        }
      >
        <Plus size={18} />
        নতুন সিরিয়াল
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 480px) {
          button { font-size: 13px !important; }
        }
      `}</style>
    </div>
  );
}

// ==================================================
// ✅ Stat Card
// ==================================================
function StatCard({ label, value, color, bg }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: '800',
            color: color,
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '17px',
            fontWeight: '800',
            color: '#1e293b',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}