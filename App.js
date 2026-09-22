// App.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Mobile App
// ==================================================
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';

import PreviewScreen from './screens/PreviewScreen';
import BookingScreen from './screens/BookingScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerStyle: { backgroundColor: '#1c5fa8' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              tabBarActiveTintColor: '#1c5fa8',
              tabBarInactiveTintColor: '#888',
              tabBarIcon: ({ color, size }) => {
                const name = route.name === 'Preview' ? 'list' : 'calendar';
                return <Ionicons name={name} size={size} color={color} />;
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
              options={{ title: 'বুকিং', tabBarLabel: 'বুকিং' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </HospitalProvider>
    </AuthProvider>
  );
}