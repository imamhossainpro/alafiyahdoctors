// screens/auth/RegisterScreen.js
// ==================================================
// 📝 Register Screen — Email + Google Sign-Up
// ==================================================
// ✅ Google Branding Guidelines অনুযায়ী Dark Theme Button
// ✅ Debug logs included
// ==================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ==================================================
  // ✅ Phone handler — Bengali digits allowed, cleaned
  // ==================================================
  const handlePhoneChange = (text) => {
    // Allow only 0-9 and ০-৯
    const cleaned = text.replace(/[^0-9০-৯]/g, '');
    setPhone(cleaned);
  };

  // ==================================================
  // ✅ Register
  // ==================================================
  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('⚠️', 'আপনার নাম লিখুন');
      return;
    }
    if (!email.trim()) {
      Alert.alert('⚠️', 'ইমেইল লিখুন');
      return;
    }
    if (password.length < 6) {
      Alert.alert('⚠️', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('⚠️', 'পাসওয়ার্ড দুটি মিলছে না');
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      Alert.alert('⚠️', 'সঠিক ১১ digit মোবাইল নম্বর লিখুন');
      return;
    }

    console.log('🔍 [RegisterScreen] SUBMITTING:', {
      name,
      email,
      designation,
      phone,
      phoneType: typeof phone,
      phoneLength: phone?.length,
    });

    setLoading(true);
    const result = await register({
      name,
      email,
      password,
      designation,
      phone,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '✅ রেজিস্ট্রেশন সফল',
        'আপনার অ্যাকাউন্ট তৈরি হয়েছে। অ্যাডমিন এপ্রুভ করার পর লগইন করতে পারবেন।',
        [{ text: 'ঠিক আছে', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('❌ রেজিস্ট্রেশন ব্যর্থ', result.error);
    }
  };

  // ==================================================
  // ✅ Google Sign-Up
  // ==================================================
  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        throw new Error('Google idToken পাওয়া যায়নি');
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);

      // ✅ AuthContext-এর onAuthStateChanged বাকিটা handle করবে
      console.log('✅ Google Sign-Up সফল');
    } catch (error) {
      console.error('❌ Google Sign-Up error:', error);

      let errorMessage = error.message || 'আবার চেষ্টা করুন';

      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'লগইন বাতিল করা হয়েছে';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'লগইন চলছে...';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Google Play Services পাওয়া যায়নি';
      }

      Alert.alert('❌ Google রেজিস্ট্রেশন ব্যর্থ', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={50} color="#1c5fa8" />
          </View>
          <Text style={styles.title}>নতুন অ্যাকাউন্ট</Text>
          <Text style={styles.subtitle}>
            আল-আফিয়া হাসপাতালের সিস্টেমে যোগ দিন
          </Text>
        </View>

        {/* Register Card */}
        <View style={styles.card}>
          {/* ==========================================
              ✅ Google Sign-Up Button
              Google Branding Guidelines — Dark Theme
              ========================================== */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#E3E3E3" />
            ) : (
              <>
                {/* ✅ Google G Logo */}
                <Image
                  source={require('../../assets/g-logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>
                  Sign up with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>অথবা</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              নাম <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="আপনার পুরো নাম"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              ইমেইল <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Designation */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>পদবী</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={designation}
                onChangeText={setDesignation}
                placeholder="যেমন: ডাক্তার, নার্স, এডমিন"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Phone — REQUIRED */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              মোবাইল নম্বর <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="01712345678"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={14}
              />
            </View>
            <Text style={styles.hint}>
              ১১ digit (যেমন: 01712345678 বা ০১৭১২৩৪৫৬৭৮)
            </Text>
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              পাসওয়ার্ড <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="কমপক্ষে ৬ অক্ষর"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              পাসওয়ার্ড নিশ্চিত করুন <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="আবার পাসওয়ার্ড লিখুন"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#1e40af" />
            <Text style={styles.infoText}>
              রেজিস্ট্রেশন করার পর অ্যাডমিন এপ্রুভ করলে আপনি লগইন করতে পারবেন।
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || googleLoading) && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading || googleLoading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>রেজিস্ট্রেশন করুন</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>ইতিমধ্যে অ্যাকাউন্ট আছে? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>লগইন করুন</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#e6f0fa',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1c5fa8', marginTop: 4 },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // ==========================================
  // ✅ Google Button — Dark Theme (Google Guidelines)
  // ==========================================
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#131314',
    borderWidth: 1,
    borderColor: '#8E918F',
    borderRadius: 8,
    marginBottom: 20,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleLogo: {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E3E3E3',
    letterSpacing: 0.2,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // Form
  formGroup: { marginBottom: 14 },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  required: { color: '#dc2626' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    paddingVertical: 12,
    paddingLeft: 10,
  },
  eyeButton: { padding: 4 },
  hint: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1e40af',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#1c5fa8',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1c5fa8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: { fontSize: 14, color: '#64748b' },
  loginLink: { fontSize: 14, color: '#1c5fa8', fontWeight: '700' },
});