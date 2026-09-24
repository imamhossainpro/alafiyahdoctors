// screens/ProfileScreen.js
// ==================================================
// 👤 Profile Screen — Guest / Logged-in User
// ==================================================
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import HeaderMenu from '../components/HeaderMenu';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // ==================================================
  // ✅ Header Menu
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
  // ✅ Guest View (লগইন নেই)
  // ==================================================
  if (!user) {
    return (
      <ScrollView
        style={styles.guestContainer}
        contentContainerStyle={styles.guestContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guestIconBox}>
          <Ionicons name="person-outline" size={70} color="#1c5fa8" />
        </View>

        <Text style={styles.guestTitle}>লগইন করুন</Text>
        <Text style={styles.guestText}>
          লগইন করে আপনার প্রোফাইল, বুকিং হিস্ট্রি এবং আরও অনেক কিছু দেখতে পারবেন
        </Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" />
          <Text style={styles.loginButtonText}>লগইন করুন</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color="#1c5fa8" />
          <Text style={styles.registerButtonText}>নতুন অ্যাকাউন্ট</Text>
        </TouchableOpacity>

        {/* Quick Info */}
        <View style={styles.quickInfoBox}>
          <Text style={styles.quickInfoTitle}>
            লগইন করে যা যা পাবেন
          </Text>

          {[
            { icon: 'calendar-outline', text: 'আপনার বুকিং হিস্ট্রি' },
            { icon: 'qr-code-outline', text: 'QR দিয়ে চেক-ইন' },
            { icon: 'notifications-outline', text: 'সিরিয়াল নোটিফিকেশন' },
            { icon: 'person-circle-outline', text: 'প্রোফাইল ম্যানেজমেন্ট' },
          ].map((item, index) => (
            <View key={index} style={styles.quickInfoRow}>
              <Ionicons name={item.icon} size={18} color="#0d9488" />
              <Text style={styles.quickInfoText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ==================================================
  // ✅ Logged-in View
  // ==================================================
  const handleLogout = () => {
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'লগআউট',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  // ✅ Check if phone is missing
  const hasPhone = user?.phone || user?.phoneNormalized;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user.name || 'ব্যবহারকারী'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#fff" />
          <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
        </View>
      </View>

      {/* ✅ Phone Required Alert (if missing) */}
      {!hasPhone && (
        <TouchableOpacity
          style={styles.phoneAlert}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <View style={styles.phoneAlertIcon}>
            <Ionicons name="call-outline" size={22} color="#d97706" />
          </View>
          <View style={styles.phoneAlertText}>
            <Text style={styles.phoneAlertTitle}>ফোন নাম্বার যোগ করুন</Text>
            <Text style={styles.phoneAlertSub}>
              সিরিয়াল দেখতে ফোন নাম্বার প্রয়োজন
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#d97706" />
        </TouchableOpacity>
      )}

      {/* Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={22} color="#1c5fa8" />
          <Text style={styles.cardTitle}>আপনার তথ্য</Text>
        </View>

        <InfoRow icon="person-outline" label="নাম" value={user.name || '—'} />
        <InfoRow icon="mail-outline" label="ইমেইল" value={user.email || '—'} />
        <InfoRow
          icon="briefcase-outline"
          label="পদবী"
          value={user.designation || '—'}
        />
        <InfoRow
          icon="call-outline"
          label="ফোন"
          value={user.phone || '— যোগ করা হয়নি'}
        />
        <InfoRow
          icon="shield-outline"
          label="রোল"
          value={getRoleLabel(user.role)}
        />
        <InfoRow
          icon="checkmark-circle-outline"
          label="স্ট্যাটাস"
          value={user.approved ? 'এপ্রুভড' : 'পেন্ডিং'}
        />
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="settings-outline" size={22} color="#1c5fa8" />
          <Text style={styles.cardTitle}>সেটিংস</Text>
        </View>

        {/* ✅ Edit Profile — NEW */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color="#334155" />
          <Text style={styles.actionText}>প্রোফাইল সম্পাদনা</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('About')}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={20} color="#334155" />
          <Text style={styles.actionText}>আমাদের সম্পর্কে</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Contact')}
          activeOpacity={0.7}
        >
          <Ionicons name="call-outline" size={20} color="#334155" />
          <Text style={styles.actionText}>যোগাযোগ</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>লগআউট</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

// ==================================================
// ✅ Helper Components
// ==================================================
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#64748b" />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getRoleLabel(role) {
  const labels = {
    admin: 'অ্যাডমিন',
    'sub-admin': 'সাব-অ্যাডমিন',
    editor: 'এডিটর',
    viewer: 'ভিউয়ার',
    pending: 'পেন্ডিং',
  };
  return labels[role] || role || 'ইউজার';
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { padding: 16, paddingBottom: 40 },

  // ==================================================
  // Guest View
  // ==================================================
  guestContainer: { flex: 1, backgroundColor: '#f4f7f6' },
  guestContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestIconBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e6f0fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  guestText: {
    fontSize: 14.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#1c5fa8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#1c5fa8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#1c5fa8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  registerButtonText: { color: '#1c5fa8', fontSize: 15, fontWeight: '700' },

  quickInfoBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickInfoTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  quickInfoText: { fontSize: 14, color: '#334155', fontWeight: '500' },

  // ==================================================
  // Logged-in View
  // ==================================================
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1c5fa8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d9488',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },

  // ✅ Phone Alert
  phoneAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  phoneAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef9c3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneAlertText: { flex: 1 },
  phoneAlertTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  phoneAlertSub: {
    fontSize: 12,
    color: '#b45309',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: { fontSize: 13.5, color: '#64748b', fontWeight: '600' },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
  },

  // Action Button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#dc2626' },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
});