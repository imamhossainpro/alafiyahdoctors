// screens/AboutScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logo */}
      <View style={styles.logoBox}>
        <Ionicons name="medkit" size={60} color="#1c5fa8" />
        <Text style={styles.hospitalName}>Al Afiyah Hospital</Text>
        <Text style={styles.subtitle}>স্বাস্থ্যসেবায় বিশ্বাস</Text>
      </View>

      {/* About */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={22} color="#1c5fa8" />
          <Text style={styles.cardTitle}>আমাদের সম্পর্কে</Text>
        </View>
        <Text style={styles.cardText}>
          আল-আফিয়া হাসপাতাল চট্টগ্রামের বাকলিয়ায় অবস্থিত একটি আধুনিক স্বাস্থ্যসেবা প্রতিষ্ঠান। আমরা ২৪/৭ জরুরি বিভাগ, অভিজ্ঞ ডাক্তার এবং উন্নত চিকিৎসা সেবা প্রদান করি।
        </Text>
      </View>

      {/* Features */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="star" size={22} color="#1c5fa8" />
          <Text style={styles.cardTitle}>আমাদের সেবাসমূহ</Text>
        </View>

        {[
          { icon: 'medkit-outline', text: '২৪/৭ জরুরি বিভাগ' },
          { icon: 'people-outline', text: 'অভিজ্ঞ ডাক্তার প্যানেল' },
          { icon: 'flask-outline', text: 'আধুনিক ল্যাব টেস্ট' },
          { icon: 'heart-outline', text: 'কার্ডিওলজি, মেডিসিন, গাইনি সহ সব বিভাগ' },
          { icon: 'calendar-outline', text: 'অনলাইন সিরিয়াল সিস্টেম' },
          { icon: 'qr-code-outline', text: 'QR দিয়ে চেক-ইন' },
        ].map((item, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name={item.icon} size={20} color="#0d9488" />
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Contact */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="call" size={22} color="#1c5fa8" />
          <Text style={styles.cardTitle}>যোগাযোগ</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="location-outline" size={18} color="#64748b" />
          <Text style={styles.contactText}>
            বাকলিয়া এক্সেস রোড, বাকলিয়া, চট্টগ্রাম
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={18} color="#64748b" />
          <Text style={styles.contactText}>01886 776 512</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={18} color="#64748b" />
          <Text style={styles.contactText}>01886 776 513</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="globe-outline" size={18} color="#64748b" />
          <Text style={styles.contactText}>alafiyahhospital.com</Text>
        </View>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { padding: 16, paddingBottom: 40 },
  logoBox: { alignItems: 'center', marginVertical: 24 },
  hospitalName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c5fa8',
    marginTop: 12,
  },
  subtitle: { fontSize: 13.5, color: '#64748b', marginTop: 4 },
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  featureText: { fontSize: 14, color: '#334155', flex: 1 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  contactText: { fontSize: 14, color: '#334155', flex: 1 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
});