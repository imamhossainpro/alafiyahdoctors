// components/admin/QueueControlPanel.jsx
// ==================================================
// 📺 Queue Control Panel — Staff queue management
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import { db, doc, onSnapshot } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  callNextPatient,
  resetQueue,
  pauseQueue,
  resumeQueue,
} from '../../services/queueService';
import { logActivity, LOG_MODULES, LOG_ACTIONS } from '../../services/activityLogService';
import { Bell, RefreshCw, Pause, Play, Users, Clock } from 'lucide-react';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

export default function QueueControlPanel({ user }) {
  const { currentHospital } = useHospital();
  const { user: authUser } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [departments, setDepartments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [counterData, setCounterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Load departments
  useEffect(() => {
    if (!hospitalId) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          collection(db, 'hospitals', hospitalId, 'departments')
        );
        const depts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hospitalId]);

  // Flatten doctors
  const allDoctors = useMemo(() => {
    const list = [];
    departments.forEach((dept) => {
      (dept.doctors || []).forEach((doc) => {
        list.push({
          id: doc.id,
          name: doc.name,
          deptName: dept.name,
          deptColor: dept.color,
        });
      });
    });
    return list;
  }, [departments]);

  // Real-time counter subscription
  useEffect(() => {
    if (!hospitalId || !selectedDoctor || !selectedDate) {
      setCounterData(null);
      return;
    }

    const counterId = `${selectedDoctor}_${selectedDate}`;
    const ref = doc(db, 'hospitals', hospitalId, 'counters', counterId);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setCounterData(snap.data());
      } else {
        setCounterData({ count: 0, currentSerial: 0, status: 'idle' });
      }
    });

    return () => unsub();
  }, [hospitalId, selectedDoctor, selectedDate]);

 const handleCallNext = async () => {
  if (!selectedDoctor || !selectedDate) return;
  setActionLoading(true);
  
  try {
    const result = await callNextPatient(hospitalId, selectedDoctor, selectedDate, authUser || user);

    // ✅ FCM Notification পাঠান
    if (result.success && result.currentSerial) {
      const response = await fetch('https://your-app.railway.app/api/queue/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          doctorId: selectedDoctor,
          date: selectedDate,
          nextSerial: result.currentSerial,
        }),
      });

      const data = await response.json();
      console.log('FCM response:', data);
    }

  } catch (err) {
    setError(err.message);
  } finally {
    setActionLoading(false);
  }
};

  const handleReset = async () => {
    if (!window.confirm('Queue reset করতে চান? Current serial 0 হবে।')) return;
    setActionLoading(true);
    try {
      await resetQueue(hospitalId, selectedDoctor, selectedDate, authUser || user);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseToggle = async () => {
    setActionLoading(true);
    try {
      if (counterData?.status === 'paused') {
        await resumeQueue(hospitalId, selectedDoctor, selectedDate, authUser || user);
      } else {
        await pauseQueue(hospitalId, selectedDoctor, selectedDate, authUser || user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const currentDoctor = allDoctors.find((d) => d.id === selectedDoctor);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🎛️ Queue Control Panel</h3>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div>
          <label style={styles.label}>Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Doctor</option>
            {allDoctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.deptName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={styles.label}>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {/* Counter Display */}
      {selectedDoctor && counterData ? (
        <>
          <div style={styles.counterCard}>
            <h4 style={styles.doctorName}>
              {currentDoctor?.name || 'Doctor'}
            </h4>
            <p style={styles.doctorDept}>{currentDoctor?.deptName}</p>

            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <Users size={20} color="#1c5fa8" />
                <div>
                  <div style={styles.statValue}>{counterData.count || 0}</div>
                  <div style={styles.statLabel}>মোট বুকিং</div>
                </div>
              </div>

              <div style={styles.statBox}>
                <Bell size={20} color="#0d9488" />
                <div>
                  <div style={styles.statValue}>
                    {counterData.currentSerial || 0}
                  </div>
                  <div style={styles.statLabel}>বর্তমানে চলছে</div>
                </div>
              </div>

              <div style={styles.statBox}>
                <Clock size={20} color="#d97706" />
                <div>
                  <div style={styles.statValue}>
                    {Math.max(
                      0,
                      (counterData.count || 0) -
                        (counterData.currentSerial || 0)
                    )}
                  </div>
                  <div style={styles.statLabel}>অপেক্ষমাণ</div>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div style={styles.statusRow}>
              <span
                style={{
                  ...styles.statusBadge,
                  background:
                    counterData.status === 'paused' ? '#fef3c7' : '#dcfce7',
                  color:
                    counterData.status === 'paused' ? '#92400e' : '#166534',
                }}
              >
                {counterData.status === 'paused' ? '⏸️ Paused' : '● Active'}
              </span>
              {counterData.updatedBy && (
                <span style={styles.updatedBy}>
                  Last updated by: {counterData.updatedBy.substring(0, 8)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionsRow}>
            <button
              onClick={handleCallNext}
              disabled={
                actionLoading ||
                (counterData.currentSerial || 0) >= (counterData.count || 0)
              }
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                opacity:
                  actionLoading ||
                  (counterData.currentSerial || 0) >= (counterData.count || 0)
                    ? 0.5
                    : 1,
              }}
            >
              <Bell size={18} /> পরবর্তী রোগী ডাকুন
            </button>

            <button
              onClick={handlePauseToggle}
              disabled={actionLoading}
              style={{ ...styles.btn, ...styles.btnSecondary }}
            >
              {counterData.status === 'paused' ? (
                <>
                  <Play size={18} /> Resume
                </>
              ) : (
                <>
                  <Pause size={18} /> Pause
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={actionLoading}
              style={{ ...styles.btn, ...styles.btnDanger }}
            >
              <RefreshCw size={18} /> Reset
            </button>
          </div>
        </>
      ) : (
        <div style={styles.emptyBox}>
          Doctor ও Date select করুন
        </div>
      )}
    </div>
  );
}

// ==================================================
// Styles
// ==================================================
const styles = {
  container: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  title: {
    margin: '0 0 16px 0',
    color: '#1e293b',
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '4px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '220px',
    background: '#fff',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  counterCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  doctorName: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    color: '#1e293b',
  },
  doctorDept: {
    margin: '0 0 20px 0',
    fontSize: '13px',
    color: '#64748b',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#fff',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '11.5px',
    color: '#64748b',
    marginTop: '2px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  updatedBy: {
    fontSize: '11.5px',
    color: '#94a3b8',
  },
  actionsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: '#1c5fa8',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(28, 95, 168, 0.3)',
  },
  btnSecondary: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
  },
  btnDanger: {
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94a3b8',
    fontSize: '14px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
  },
};