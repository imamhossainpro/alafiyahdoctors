// App.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Mobile App
// ==================================================
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

// ✅ Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider, useHospital } from './context/HospitalContext';

// ✅ Notification Service
import {
  registerForPushNotificationsAsync,
  saveFcmToken,
} from './services/notificationService';

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
// ✅ Bottom padding helper
// ==================================================
const getBottomPadding = (insetsBottom) => {
  if (insetsBottom > 0) return insetsBottom;
  if (Platform.OS === 'android') return 16;
  return 0;
};

// ✅ Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==================================================
// ✅ Main Tabs (5 tabs)
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
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding + 6,
          paddingTop: 6,
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
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
          return <Ionicons name={iconName} size={size} color={color} />;
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
// ✅ App Navigator — FCM Setup এখানে (Provider-এর ভিতরে)
// ==================================================
function AppNavigator() {
  const { user, loading } = useAuth();
  const { hospitalId } = useHospital();

  // ✅ FCM Token Registration — শুধু লগইন করা ইউজারের জন্য
  useEffect(() => {
    if (!user || !hospitalId) return;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync(user, hospitalId);
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
// ✅ App Root — শুধু Providers wrap করে
// ==================================================
export default function App() {
  const [fontsLoaded] = useFonts({
    'HindSiliguri-Light': require('./assets/fonts/HindSiliguri-Light.ttf'),
    'HindSiliguri-Regular': require('./assets/fonts/HindSiliguri-Regular.ttf'),
    'HindSiliguri-Medium': require('./assets/fonts/HindSiliguri-Medium.ttf'),
    'HindSiliguri-SemiBold': require('./assets/fonts/HindSiliguri-SemiBold.ttf'),
    'HindSiliguri-Bold': require('./assets/fonts/HindSiliguri-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c5fa8" />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f4f7f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});