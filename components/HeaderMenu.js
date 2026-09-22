// components/HeaderMenu.js
// ==================================================
// ☰ Header Dropdown Menu
// ==================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function HeaderMenu() {
  const navigation = useNavigation();
  const { user, logout, isAdmin, canViewAdmin } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = () => setMenuVisible(false);

  const handleNavigate = (screen) => {
    closeMenu();
    setTimeout(() => navigation.navigate(screen), 200);
  };

  const handleLogout = async () => {
    closeMenu();
    setTimeout(async () => {
      await logout();
    }, 200);
  };

  // ==================================================
  // ✅ Menu Items
  // ==================================================
  const menuItems = [
    // Public items
    {
      icon: 'information-circle-outline',
      label: 'আমাদের সম্পর্কে',
      screen: 'About',
      show: true,
    },
    {
      icon: 'call-outline',
      label: 'যোগাযোগ',
      screen: 'Contact',
      show: true,
    },

    // ✅ Online Report (App-এর ভিতরে WebView)
    {
      icon: 'globe-outline',
      label: 'অনলাইন রিপোর্ট',
      subtitle: 'লগইন ছাড়াই দেখুন',
      screen: 'OnlineReport',
      show: true,
      color: '#0d9488',
    },

    // Auth items
    {
      divider: true,
      show: !user,
    },
    {
      icon: 'log-in-outline',
      label: 'লগইন',
      screen: 'Login',
      show: !user,
    },
    {
      icon: 'person-add-outline',
      label: 'রেজিস্ট্রেশন',
      screen: 'Register',
      show: !user,
    },

    // Logged-in items
    {
      divider: true,
      show: !!user,
    },
    {
      icon: 'person-circle-outline',
      label: user?.name || 'প্রোফাইল',
      subtitle: user?.email,
      screen: 'Profile',
      show: !!user,
    },

    // Admin item
    {
      icon: 'shield-checkmark-outline',
      label: 'অ্যাডমিন প্যানেল',
      screen: 'Main',
      show: !!user && canViewAdmin,
    },

    // Logout
    {
      divider: true,
      show: !!user,
    },
    {
      icon: 'log-out-outline',
      label: 'লগআউট',
      onPress: handleLogout,
      show: !!user,
      color: '#dc2626',
    },
  ];

  return (
    <>
      {/* ☰ Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal Dropdown */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <View style={styles.menuBox}>
            {/* Header */}
            <View style={styles.menuHeader}>
              {user ? (
                <>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.name || 'ব্যবহারকারী'}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={28} color="#fff" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>অতিথি</Text>
                    <Text style={styles.userEmail}>
                      লগইন করে আরও ফিচার পাবেন
                    </Text>
                  </View>
                </>
              )}
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuList}>
              {menuItems
                .filter((item) => item.show)
                .map((item, index) => {
                  if (item.divider) {
                    return <View key={index} style={styles.divider} />;
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => {
                        if (item.onPress) item.onPress();
                        else if (item.screen) handleNavigate(item.screen);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={item.color || '#334155'}
                      />
                      <View style={styles.menuItemContent}>
                        <Text
                          style={[
                            styles.menuItemLabel,
                            item.color && { color: item.color },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.menuItemSubtitle}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {/* Footer */}
            <View style={styles.menuFooter}>
              <Text style={styles.footerText}>Al Afiyah Hospital</Text>
              <Text style={styles.footerSubtext}>v1.0.0</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 6,
    marginRight: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuBox: {
    backgroundColor: '#fff',
    width: '80%',
    maxWidth: 340,
    height: '100%',
    paddingTop: 50,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1c5fa8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12.5,
    color: '#64748b',
  },
  closeBtn: {
    position: 'absolute',
    top: -10,
    right: 10,
    padding: 4,
  },
  menuList: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c5fa8',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});