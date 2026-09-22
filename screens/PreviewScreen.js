// screens/PreviewScreen.js
// ==================================================
// 📋 Preview Screen — ডাক্তার প্যানেল
// ==================================================
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
import HeaderMenu from '../components/HeaderMenu';

export default function PreviewScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [footer, setFooter] = useState(null);

  // ==================================================
  // ✅ Header-এ Menu Button যোগ
  // ==================================================
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerRight: () => <HeaderMenu />,
        headerRightContainerStyle: {
          paddingRight: 12,
        },
      });
    }
  }, [navigation]);

  // ==================================================
  // ✅ Data Load
  // ==================================================
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

  // ==================================================
  // ✅ Loading State
  // ==================================================
  if (loading) {
    return <PreviewSkeleton />;
  }

  // ==================================================
  // ✅ Filter doctors (যারা panel-এ আছে)
  // ==================================================
  const activeDoctorIds = new Set(activePanel?.activeDoctorIds || []);
  const visibleDepts = departments
    .map((dept) => ({
      ...dept,
      doctors: (dept.doctors || []).filter(
        (d) => activeDoctorIds.size === 0 || activeDoctorIds.has(d.id)
      ),
    }))
    .filter((dept) => dept.doctors.length > 0);

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {activePanel?.title || 'ডক্টরস প্যানেল'}
        </Text>
        <Text style={styles.headerSubtext}>
          আজকের ডাক্তারদের সময়সূচি
        </Text>
      </View>

      {/* Departments */}
      {visibleDepts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            এই মুহূর্তে কোনো ডাক্তার নেই
          </Text>
          <Text style={styles.emptyStateSubtext}>
            অনুগ্রহ করে পরে আবার দেখুন
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

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  content: {
    paddingBottom: 20,
  },

  // Header
  header: {
    backgroundColor: '#1c5fa8',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },

  // Department Block
  deptBlock: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },

  // Footer
  footer: {
    backgroundColor: '#eef4fb',
    margin: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
    textAlign: 'center',
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c5fa8',
    marginTop: 8,
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1c5fa8',
    marginTop: 4,
  },
});