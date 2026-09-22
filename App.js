// App.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Mobile App
// ==================================================
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ✅ Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';

// ✅ Main Screens
import PreviewScreen from './screens/PreviewScreen';
import BookingScreen from './screens/BookingScreen';
import ProfileScreen from './screens/ProfileScreen';

// ✅ Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import PendingScreen from './screens/auth/PendingScreen';

// ✅ Extra Screens
import AboutScreen from './screens/AboutScreen';
import ContactScreen from './screens/ContactScreen';
import OnlineReportScreen from './screens/OnlineReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ==================================================
// ✅ Bottom padding calculation (fallback সহ)
// ==================================================
const getBottomPadding = (insetsBottom) => {
  if (insetsBottom > 0) return insetsBottom;

  if (Platform.OS === 'android') {
    return 16;
  }
  return 0;
};

// ==================================================
// ✅ Main Tabs — SafeArea-aware bottom tab
// ==================================================
function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = getBottomPadding(insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#1c5fa8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#1c5fa8',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Preview') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Booking') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ title: 'ডাক্তার প্যানেল', tabBarLabel: 'প্যানেল' }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'সিরিয়াল বুকিং', tabBarLabel: 'বুকিং' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'প্রোফাইল', tabBarLabel: 'প্রোফাইল' }}
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
        name="OnlineReport"
        component={OnlineReportScreen}
        options={{ title: 'অনলাইন রিপোর্ট' }}
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
// ✅ App Navigator
// ==================================================
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthStack key="auth" />;
  }

  const isPending = user.role === 'pending' || user.approved === false;
  if (isPending) {
    return <PendingStack key="pending" />;
  }

  return <MainAppStack key="main" />;
}

// ==================================================
// ✅ App Root
// ==================================================
export default function App() {
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