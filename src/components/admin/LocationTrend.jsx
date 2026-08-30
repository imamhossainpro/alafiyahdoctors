import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { db, collection, getDocs, query, where } from '../../firebase';
import { getAllLocations } from '../../services/locationService';

export default function LocationTrend() {
  const [trendData, setTrendData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // লোকেশন লিস্ট লোড
        const locs = await getAllLocations();
        setLocations(locs);

        // গত ৩০ দিনের ডেটা
        const days = 30;
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
        }

        // সব অ্যাপয়েন্টমেন্ট লোড
        const snapshot = await getDocs(collection(db, 'appointments'));
        const appointments = [];
        snapshot.forEach(doc => appointments.push({ id: doc.id, ...doc.data() }));

        // লোকেশন অনুযায়ী গ্রুপ
        const locationMap = {};
        locs.forEach(l => { locationMap[l.id] = { name: l.name, data: [] }; });

        // প্রতি দিনের কাউন্ট
        const result = dates.map(date => {
          const row = { date };
          locs.forEach(l => {
            const count = appointments.filter(a => a.locationId === l.id && a.bookingDate === date).length;
            row[l.id] = count;
          });
          return row;
        });

        setTrendData(result);
      } catch (error) {
        console.error('Load trend error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>;

  const colors = ['#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3', '#e0653a', '#4438ab', '#7a2d5c', '#159a72', '#8a6a2e'];

  const filteredLocations = selectedLocation === 'all' 
    ? locations 
    : locations.filter(l => l.id === selectedLocation);

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ margin: 0 }}>📈 লোকেশন ট্রেন্ড (গত ৩০ দিন)</h4>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
        >
          <option value="all">সব লোকেশন</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {filteredLocations.map((l, idx) => (
            <Line
              key={l.id}
              type="monotone"
              dataKey={l.id}
              name={l.name}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}