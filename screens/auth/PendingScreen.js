// screens/auth/PendingScreen.js
// ==================================================
// ⏳ Pending Approval Screen
// ==================================================
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function PendingScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="hourglass-outline" size={80} color="#f59e0b" />
      </View>

      <Text style={styles.title}>অ্যাকাউন্ট পেন্ডিং</Text>

      <Text style={styles.greeting}>
        স্বাগতম, {user?.name || 'ব্যবহারকারী'}!
      </Text>

      <Text style={styles.text}>
        আপনার অ্যাকাউন্ট এখনো অ্যাডমিন এপ্রুভ করেনি।{'\n'}
        এপ্রুভ হলে আপনি লগইন করে সিস্টেম ব্যবহার করতে পারবেন।
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#1e40af" />
        <Text style={styles.infoText}>
          অ্যাডমিনের সাথে যোগাযোগ করুন — যত দ্রুত সম্ভব আপনার অ্যাকাউন্ট এপ্রুভ করা হবে।
        </Text>
      </View>

      <View style={styles.contactBox}>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={18} color="#64748b" />
          <Text style={styles.contactText}>01886 776 512</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={18} color="#64748b" />
          <Text style={styles.contactText}>01886 776 513</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>লগআউট করুন</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7f6',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    width: 140,
    height: 140,
    backgroundColor: '#fef3c7',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c5fa8',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 14.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#dbeafe',
    padding: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 19,
  },
  contactBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});