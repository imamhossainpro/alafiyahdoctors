// screens/PreviewScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import {
  loadDepartments,
  loadPanels,
  loadFooter,
} from '../services/dataService';
import { PreviewSkeleton } from '../components/ui/SkeletonScreens';
import DeptHeader from '../components/DeptHeader';
import DoctorEntry from '../components/DoctorEntry';

export default function PreviewScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [footer, setFooter] = useState(null);

  const loadData = async () => {
    try {
      const [depts, pnls, ftr] = await Promise.all([
        loadDepartments(),
        loadPanels(),
        loadFooter(),
      ]);

      // আজকের দিনের নাম
      const today = new Date().getDay();
      const weekDays = [
        'রবিবার',
        'সোমবার',
        'মঙ্গলবার',
        'বুধবার',
        'বৃহস্পতিবার',
        'শুক্রবার',
        'শনিবার',
      ];
      const todayName = weekDays[today];
      const todayPanel = pnls.find((p) => p.name === todayName) || pnls[0];

      setDepartments(depts);
      setPanels(pnls);
      setActivePanel(todayPanel);
      setFooter(ftr);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ✅ Loading থাকলে Skeleton দেখাও
  if (loading) {
    return <PreviewSkeleton />;
  }

  // কোন ডাক্তার দেখাবে
  const activeDoctorIds = new Set(activePanel?.activeDoctorIds || []);
  const visibleDepts = departments
    .map((dept) => ({
      ...dept,
      doctors: (dept.doctors || []).filter(
        (d) => activeDoctorIds.size === 0 || activeDoctorIds.has(d.id)
      ),
    }))
    .filter((dept) => dept.doctors.length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {activePanel?.title || 'ডক্টরস প্যানেল'}
        </Text>
      </View>

      {/* Departments */}
      {visibleDepts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            এই মুহূর্তে কোনো ডাক্তার নেই
          </Text>
        </View>
      ) : (
        visibleDepts.map((dept) => (
          <View key={dept.id} style={styles.deptBlock}>
            <DeptHeader dept={dept} />
            {dept.doctors.map((doc) => (
              <DoctorEntry key={doc.id} doc={doc} accentColor={dept.color} />
            ))}
          </View>
        ))
      )}

      {/* Footer */}
      {footer && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{footer.address}</Text>
          <Text style={styles.footerText}>{footer.website}</Text>
          <Text style={styles.hospitalName}>{footer.hospitalName}</Text>
          {footer.phones?.map((p, i) => (
            <Text key={i} style={styles.phone}>
              📞 {p}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  content: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#1c5fa8',
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  deptBlock: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
  },
  footer: {
    backgroundColor: '#eef4fb',
    margin: 12,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c5fa8',
    marginTop: 8,
  },
  phone: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1c5fa8',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});