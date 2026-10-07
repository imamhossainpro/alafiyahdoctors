import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'; // ✅ সরাসরি firestore থেকে import
import { RefreshCw } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const hospitalSnap = await getDocs(collection(db, 'hospitals'));
      const allLogs = [];
      for (const h of hospitalSnap.docs) {
        const logSnap = await getDocs(collection(db, 'hospitals', h.id, 'audit_logs'));
        logSnap.docs.forEach(d => {
          allLogs.push({ id: d.id, hospitalId: h.id, ...d.data() });
        });
      }
      allLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setLogs(allLogs.slice(0, 100));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Activity Logs</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Platform-wide audit trail</p>
        </div>
        <button onClick={loadLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><RefreshCw size={16} /> Refresh</button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No activity logs found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={log.id || i} style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{log.details || log.action || 'Action'}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {log.performedBy || 'Unknown'} · {log.hospitalId && `Hospital: ${log.hospitalId}`}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}