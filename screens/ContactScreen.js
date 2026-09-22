// screens/ContactScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('ত্রুটি', 'কল করা যাচ্ছে না')
    );
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@alafiyahhospital.com').catch(() =>
      Alert.alert('ত্রুটি', 'ইমেইল খোলা যাচ্ছে না')
    );
  };

  const handleWebsite = () => {
    Linking.openURL('https://alafiyahhospital.com').catch(() =>
      Alert.alert('ত্রুটি', 'ওয়েবসাইট খোলা যাচ্ছে না')
    );
  };

  const handleMap = () => {
    const query = 'Al Afiyah Hospital, Bakalia, Chittagong';
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
      .catch(() => Alert.alert('ত্রুটি', 'ম্যাপ খোলা যাচ্ছে না'));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="call" size={60} color="#1c5fa8" />
        <Text style={styles.title}>যোগাযোগ করুন</Text>
        <Text style={styles.subtitle}>
          যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন
        </Text>
      </View>

      {/* Phone Numbers */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📞 ফোন</Text>
        <TouchableOpacity style={styles.contactBtn} onPress={() => handleCall('01886776512')}>
          <Ionicons name="call" size={20} color="#16a34a" />
          <Text style={styles.contactBtnText}>01886 776 512</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactBtn} onPress={() => handleCall('01886776513')}>
          <Ionicons name="call" size={20} color="#16a34a" />
          <Text style={styles.contactBtnText}>01886 776 513</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Other */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>অন্যান্য</Text>

        <TouchableOpacity style={styles.contactBtn} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#dc2626" />
          <Text style={styles.contactBtnText}>ইমেইল পাঠান</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactBtn} onPress={handleWebsite}>
          <Ionicons name="globe" size={20} color="#1c5fa8" />
          <Text style={styles.contactBtnText}>ওয়েবসাইট</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactBtn} onPress={handleMap}>
          <Ionicons name="map" size={20} color="#f59e0b" />
          <Text style={styles.contactBtnText}>ম্যাপে দেখুন</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 ঠিকানা</Text>
        <Text style={styles.address}>
          বাকলিয়া এক্সেস রোড,{'\n'}
          বাকলিয়া, চট্টগ্রাম।{'\n'}
          বাংলাদেশ।
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginVertical: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#1c5fa8', marginTop: 12 },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contactBtnText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  address: {
    fontSize: 14.5,
    color: '#475569',
    lineHeight: 24,
  },
});