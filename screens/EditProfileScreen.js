// screens/EditProfileScreen.js
// ==================================================
// ✏️ EditProfileScreen — Add/Update phone number
// ==================================================
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { normalizePhone, toEnglishDigits } from '../utils/bengaliDigits';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AppText from '../components/ui/AppText';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('⚠️', 'নাম লিখুন');
      return;
    }

    if (phone.trim()) {
      const normalized = normalizePhone(phone);
      if (normalized.length !== 11) {
        setPhoneError('সঠিক ১১ digit মোবাইল নম্বর লিখুন');
        return;
      }
      setPhoneError('');
    }

    setSaving(true);
    try {
      const userRef = doc(
        db,
        'hospitals',
        DEFAULT_HOSPITAL_ID,
        'users',
        user.uid
      );

      const updates = {
        name: name.trim(),
        designation: designation.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (phone.trim()) {
        updates.phone = toEnglishDigits(phone.trim());
        updates.phoneNormalized = normalizePhone(phone);
      }

      await updateDoc(userRef, updates);

      Alert.alert('✅ সফল', 'আপনার প্রোফাইল আপডেট হয়েছে।', [
        { text: 'ঠিক আছে', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('❌ Profile update error:', err);
      Alert.alert('❌ ব্যর্থ', err.message || 'আবার চেষ্টা করুন');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card variant="outline" padding="lg">
            <Input
              label="নাম"
              value={name}
              onChangeText={setName}
              placeholder="আপনার নাম"
              icon="person-outline"
              required
            />

            <Input
              label="মোবাইল নম্বর"
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9০-৯]/g, '');
                setPhone(cleaned);
                if (phoneError) setPhoneError('');
              }}
              placeholder="01712345678"
              icon="call-outline"
              keyboardType="phone-pad"
              maxLength={14}
              error={phoneError}
              helper="১১ digit (যেমন: 01712345678)"
            />

            <Input
              label="পদবী (ঐচ্ছিক)"
              value={designation}
              onChangeText={setDesignation}
              placeholder="যেমন: BDM"
              icon="briefcase-outline"
            />

            <Button
              title={saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              onPress={handleSave}
              variant="primary"
              size="lg"
              icon="checkmark-circle"
              loading={saving}
              disabled={saving}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Card>

          <Card variant="flat" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.infoDark}
              />
              <AppText variant="bodySmall" color="infoDark" style={styles.infoText}>
                আপনার ফোন নাম্বার দিয়েই পুরোনো সিরিয়াল/বুকিং খুঁজে আনা হবে।
              </AppText>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoCard: { marginTop: spacing.md },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, lineHeight: 19 },
});