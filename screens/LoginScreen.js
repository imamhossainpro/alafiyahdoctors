// screens/auth/LoginScreen.js
// ==================================================
// 🔐 Login Screen — Email + Google Sign-In
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ==================================================
  // ✅ Email/Password Login
  // ==================================================
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('⚠️', 'ইমেইল লিখুন');
      return;
    }
    if (!password.trim()) {
      Alert.alert('⚠️', 'পাসওয়ার্ড লিখুন');
      return;
    }
    if (password.length < 6) {
      Alert.alert('⚠️', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('❌ লগইন ব্যর্থ', result.error);
    }
  };

  // ==================================================
  // ✅ Google Sign-In
  // ==================================================
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices();

      // Google account picker দেখাবে
      const userInfo = await GoogleSignin.signIn();

      // idToken বের করুন (লাইব্রেরি version অনুযায়ী data.idToken বা idToken)
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        throw new Error('Google idToken পাওয়া যায়নি');
      }

      // Firebase Credential তৈরি
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Firebase-এ সাইন ইন
      await signInWithCredential(auth, googleCredential);

      // ✅ AuthContext-এর onAuthStateChanged listener বাকিটা handle করবে
      console.log('✅ Google Sign-In সফল');
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);

      let errorMessage = error.message || 'আবার চেষ্টা করুন';

      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'লগইন বাতিল করা হয়েছে';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'লগইন চলছে...';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Google Play Services পাওয়া যায়নি';
      }

      Alert.alert('❌ Google লগইন ব্যর্থ', errorMessage);
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
        style={styles.scrollView}
      >
        {/* Logo + Hospital Name */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="medkit" size={60} color="#1c5fa8" />
          </View>
          <Text style={styles.hospitalName}>Al Afiyah Hospital</Text>
          <Text style={styles.subtitle}>স্বাস্থ্যসেবায় বিশ্বাস</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.title}>লগইন করুন</Text>
          <Text style={styles.subtitle2}>আপনার অ্যাকাউন্টে প্রবেশ করুন</Text>

          {/* ✅ Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#1c5fa8" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>
                  Sign in with Google
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

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>ইমেইল</Text>
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
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>পাসওয়ার্ড</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>পাসওয়ার্ড ভুলে গেছেন?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || googleLoading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading || googleLoading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>লগইন করুন</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>নতুন ব্যবহারকারী? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>রেজিস্ট্রেশন করুন</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#e6f0fa',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hospitalName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c5fa8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle2: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },

  // ✅ Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // Form
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    paddingVertical: 12,
    paddingLeft: 10,
  },
  eyeButton: {
    padding: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 13,
    color: '#1c5fa8',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1c5fa8',
    borderRadius: 12,
    paddingVertical: 15,
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
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15.5,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  registerText: {
    fontSize: 13.5,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 13.5,
    color: '#1c5fa8',
    fontWeight: '700',
  },
});