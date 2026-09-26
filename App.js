// App.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Mobile App
// ==================================================
// ✅ Animated Splash Screen
// ✅ In-App Notifications
// ✅ Google Sign-In configured
// ✅ Bottom Tab pill highlight
// ✅ Notification Channel (Android) — System Tray Notification
// ==================================================
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as SplashScreenLib from 'expo-splash-screen';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

// ✅ Google Sign-In
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ✅ Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider, useHospital } from './context/HospitalContext';

// ✅ Notification Service
import {
  registerForPushNotificationsAsync,
  saveFcmToken,
} from './services/notificationService';

// ✅ Custom Animated Splash
import SplashScreen from './components/SplashScreen';

// ✅ Main Screens (5 tabs)
import HomeScreen from './screens/HomeScreen';
import DoctorsScreen from './screens/DoctorsScreen';
import MyAppointmentsScreen from './screens/MyAppointmentsScreen';
import ReportsScreen from './screens/ReportsScreen';
import ProfileScreen from './screens/ProfileScreen';

// ✅ Stack Screens
import BookingScreen from './screens/BookingScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import OnlineReportScreen from './screens/OnlineReportScreen';
import DoctorDetailsScreen from './screens/DoctorDetailsScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import NotificationsScreen from './screens/NotificationsScreen';

// ✅ Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import PendingScreen from './screens/auth/PendingScreen';

// ✅ Extra Screens
import AboutScreen from './screens/AboutScreen';
import ContactScreen from './screens/ContactScreen';
import DesignSystemShowcase from './screens/DesignSystemShowcase';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ==================================================
// ✅ Google Sign-In Configuration
// ==================================================
GoogleSignin.configure({
  webClientId:
    '524797545432-kshfpc8t138plq7dv3qb0tbe0707as5h.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['email', 'profile'],
});

// ✅ Native splash auto-hide বন্ধ (manual control)
SplashScreenLib.preventAutoHideAsync().catch(() => {});

// ==================================================
// ✅ Bottom padding helper
// ==================================================
const getBottomPadding = (insetsBottom) => {
  if (insetsBottom > 0) return insetsBottom;
  if (Platform.OS === 'android') return 16;
  return 0;
};

// ==================================================
// ✅ Notification Handler (Foreground behavior)
// ==================================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==================================================
// ✅ Notification Channel Setup (Android)
// ==================================================
// ⚠️ CRITICAL: Android 8+ এ Notification Channel তৈরি না হলে
//    system tray-তে notification আসে না।
//
// Backend `fcmService.js`-এ যে channelId ব্যবহার হচ্ছে:
//    channelId: 'alafiyah_default'
// → ঠিক এই নামেই App-এ channel তৈরি করতে হবে।
// ==================================================
async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;

  try {
    // ✅ Main channel (default) — backend যেটি ব্যবহার করে
    await Notifications.setNotificationChannelAsync('alafiyah_default', {
      name: 'আল-আফিয়া হাসপাতাল',
      description: 'বুকিং, সিরিয়াল ও অন্যান্য নোটিফিকেশন',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1c5fa8',
      sound: 'default',
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // ✅ Booking confirmed channel
    await Notifications.setNotificationChannelAsync('booking_confirmed', {
      name: 'সিরিয়াল নিশ্চিত',
      description: 'বুকিং নিশ্চিত হলে নোটিফিকেশন',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
      showBadge: true,
    });

    // ✅ Queue update channel
    await Notifications.setNotificationChannelAsync('queue_update', {
      name: 'সিরিয়াল আপডেট',
      description: 'আপনার সিরিয়াল আসছে',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#f59e0b',
      bypassDnd: true,
      showBadge: true,
    });

    // ✅ Promo channel
    await Notifications.setNotificationChannelAsync('promo', {
      name: 'প্রচার ও অফার',
      description: 'হাসপাতালের প্রচারমূলক বার্তা',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: false,
    });

    console.log('✅ Notification channels created');
  } catch (error) {
    console.error('❌ Notification channel setup error:', error);
  }
}

// ==================================================
// ✅ Main Tabs (5 tabs) — with pill highlight
// ==================================================
function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = getBottomPadding(insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1c5fa8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 64 + bottomPadding,
          paddingBottom: bottomPadding + 6,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Home')
            iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Doctors')
            iconName = focused ? 'medkit' : 'medkit-outline';
          else if (route.name === 'Bookings')
            iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Reports')
            iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Profile')
            iconName = focused ? 'person' : 'person-outline';

          return (
            <View
              style={[
                {
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                focused && { backgroundColor: '#e6f0fa' },
              ]}
            >
              <Ionicons name={iconName} size={size || 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'হোম' }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{ tabBarLabel: 'ডাক্তার' }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyAppointmentsScreen}
        options={{ tabBarLabel: 'সিরিয়াল' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarLabel: 'রিপোর্ট' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'প্রোফাইল' }}
      />
    </Tab.Navigator>
  );
}

// ==================================================
// ✅ Auth Stack
// ==================================================
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1c5fa8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'রেজিস্ট্রেশন' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'পাসওয়ার্ড রিসেট' }}
      />
    </Stack.Navigator>
  );
}

// ==================================================
// ✅ Pending Stack
// ==================================================
function PendingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Pending" component={PendingScreen} />
    </Stack.Navigator>
  );
}

// ==================================================
// ✅ Main App Stack
// ==================================================
function MainAppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1c5fa8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'সিরিয়াল বুকিং' }}
      />
      <Stack.Screen
        name="DoctorDetails"
        component={DoctorDetailsScreen}
        options={{ title: 'ডাক্তারের বিস্তারিত' }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ title: 'সিরিয়াল বিস্তারিত' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'প্রোফাইল সম্পাদনা' }}
      />
      <Stack.Screen
        name="OnlineReport"
        component={OnlineReportScreen}
        options={{ title: 'অনলাইন রিপোর্ট' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'নোটিফিকেশন' }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'আমাদের সম্পর্কে' }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: 'যোগাযোগ' }}
      />
      <Stack.Screen
        name="DesignSystem"
        component={DesignSystemShowcase}
        options={{ title: 'Design System (Dev)' }}
      />
    </Stack.Navigator>
  );
}

// ==================================================
// ✅ Loading Screen
// ==================================================
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1c5fa8" />
    </View>
  );
}

// ==================================================
// ✅ App Navigator — FCM Setup
// ==================================================
function AppNavigator() {
  const { user, loading } = useAuth();
  const { hospitalId } = useHospital();

  // ✅ FCM Token Registration — logged-in user
  useEffect(() => {
    if (!user || !hospitalId) return;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync(
          user,
          hospitalId
        );
        if (token) {
          await saveFcmToken(user, hospitalId, token);
        }
      } catch (error) {
        console.warn('⚠️ Notification setup failed:', error.message);
      }
    };

    setupNotifications();
  }, [user, hospitalId]);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthStack key="auth" />;

  const isPending = user.role === 'pending' || user.approved === false;
  if (isPending) return <PendingStack key="pending" />;

  return <MainAppStack key="main" />;
}

// ==================================================
// ✅ App Root
// ==================================================
export default function App() {
  const [fontsLoaded] = useFonts({
    'HindSiliguri-Light': require('./assets/fonts/HindSiliguri-Light.ttf'),
    'HindSiliguri-Regular': require('./assets/fonts/HindSiliguri-Regular.ttf'),
    'HindSiliguri-Medium': require('./assets/fonts/HindSiliguri-Medium.ttf'),
    'HindSiliguri-SemiBold': require('./assets/fonts/HindSiliguri-SemiBold.ttf'),
    'HindSiliguri-Bold': require('./assets/fonts/HindSiliguri-Bold.ttf'),
  });

  const [showSplash, setShowSplash] = useState(true);
  const [splashStartTime] = useState(Date.now());
  const [channelsReady, setChannelsReady] = useState(false);

  const isAppReady = fontsLoaded;

  // ==================================================
  // ✅ Notification Channel Setup (App Startup)
  // ==================================================
  useEffect(() => {
    (async () => {
      await setupNotificationChannel();
      setChannelsReady(true);
    })();
  }, []);

  // ==================================================
  // ✅ Minimum Splash Duration + Exit Animation
  // ==================================================
  useEffect(() => {
    if (!isAppReady || !channelsReady) return;

    const MIN_SPLASH_DURATION = 1400;
    const elapsed = Date.now() - splashStartTime;
    const remaining = Math.max(0, MIN_SPLASH_DURATION - elapsed);

    const timer = setTimeout(() => {
      SplashScreenLib.hideAsync().catch(() => {});

      if (SplashScreen.exit) {
        SplashScreen.exit(() => {
          setShowSplash(false);
        });
      } else {
        setShowSplash(false);
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [isAppReady, channelsReady, splashStartTime]);

  // ==================================================
  // ✅ Render
  // ==================================================
  if (showSplash) {
    return (
      <View style={styles.rootContainer}>
        <SplashScreen />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HospitalProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </HospitalProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f4f7f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});