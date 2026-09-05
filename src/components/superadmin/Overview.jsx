// src/components/superadmin/Overview.jsx
import React, { useState, useEffect } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';   // ← সঠিক পাথ
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  collectionGroup,
} from 'firebase/firestore';
import {
  Building2,
  Users,
  Stethoscope,
  CalendarCheck,
  Activity,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// StatCard কম্পোনেন্ট
const StatCard = ({ title, value, icon: Icon, color, subtext }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color] || colors.blue}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminOverview() {
  const { hospitalId } = useHospital();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // সব হসপিটাল
        const hospitalsSnap = await getDocs(collection(db, 'hospitals'));

        // সব ইউজার
        const usersSnap = await getDocs(collection(db, 'users'));

        // সব ডাক্তার (collectionGroup)
        const doctorsQuery = collectionGroup(db, 'doctors');
        const doctorsSnap = await getDocs(doctorsQuery);

        // সব অ্যাপয়েন্টমেন্ট (collectionGroup)
        const appointmentsQuery = collectionGroup(db, 'appointments');
        const appointmentsSnap = await getDocs(appointmentsQuery);

        // আজকের অ্যাপয়েন্টমেন্ট
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayAppointments = appointmentsSnap.docs.filter((doc) => {
          const data = doc.data();
          if (!data.appointmentDate) return false;
          const date = data.appointmentDate.toDate ? data.appointmentDate.toDate() : new Date(data.appointmentDate);
          return date >= today && date < tomorrow;
        });

        setStats({
          totalHospitals: hospitalsSnap.size,
          totalUsers: usersSnap.size,
          totalDoctors: doctorsSnap.size,
          totalAppointments: appointmentsSnap.size,
          todayAppointments: todayAppointments.length,
        });

        // অ্যাক্টিভিটি লগ (সিলেক্টেড হসপিটাল)
        const activityQuery = query(
          collection(db, 'hospitals', hospitalId, 'audit_logs'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const unsubscribeActivities = onSnapshot(activityQuery, (snapshot) => {
          const activities = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setRecentActivities(activities);
        }, (err) => console.error('Activity error:', err));

        // সাম্প্রতিক অ্যাপয়েন্টমেন্ট (সিলেক্টেড হসপিটাল)
        const appQuery = query(
          collection(db, 'hospitals', hospitalId, 'appointments'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const unsubscribeAppointments = onSnapshot(appQuery, (snapshot) => {
          const apps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setRecentAppointments(apps);
        }, (err) => console.error('Appointment error:', err));

        setLoading(false);

        return () => {
          unsubscribeActivities();
          unsubscribeAppointments();
        };
      } catch (err) {
        console.error('❌ SuperAdmin Overview error:', err);
        setError('ডেটা লোড করতে সমস্যা হয়েছে।');
        setLoading(false);
      }
    };

    fetchAllData();
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline hover:text-red-800"
        >
          রিফ্রেশ করুন
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">প্ল্যাটফর্ম ওভারভিউ</h1>
          <p className="text-gray-500 text-sm">সকল হসপিটালের সামগ্রিক পরিসংখ্যান</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>শেষ আপডেট: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* স্ট্যাট কার্ড */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="মোট হসপিটাল"
          value={stats.totalHospitals}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="মোট ইউজার"
          value={stats.totalUsers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="মোট ডাক্তার"
          value={stats.totalDoctors}
          icon={Stethoscope}
          color="purple"
        />
        <StatCard
          title="মোট অ্যাপয়েন্টমেন্ট"
          value={stats.totalAppointments}
          icon={CalendarCheck}
          color="orange"
        />
        <StatCard
          title="আজকের অ্যাপয়েন্টমেন্ট"
          value={stats.todayAppointments}
          icon={Activity}
          color="red"
        />
      </div>

      {/* রিসেন্ট অ্যাক্টিভিটি ও অ্যাপয়েন্টমেন্ট */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">সাম্প্রতিক কার্যক্রম</h2>
            <Link to="/super-admin/activity" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              সব দেখুন <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">কোনো কার্যক্রম নেই</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-800">{act.message}</p>
                    <p className="text-xs text-gray-400">{act.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">সর্বশেষ অ্যাপয়েন্টমেন্ট</h2>
            <Link to="/super-admin/appointments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              সব দেখুন <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
            ) : (
              recentAppointments.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.patientName || 'অজানা'}</p>
                    <p className="text-xs text-gray-400">{app.doctorName || 'ডাক্তার'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    app.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {app.status || 'pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}