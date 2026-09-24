// components/doctors/FavoriteButton.js
// ==================================================
// ⭐ FavoriteButton — AsyncStorage-based, race-free, multi-instance sync
// ==================================================
// NOTE: Favorites saved locally in AsyncStorage.
// Firebase structure change NOT required.
// Future: Can migrate to users/{uid}/favoriteDoctorIds
// ==================================================
import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';

const STORAGE_KEY = '@alafiyah_favorite_doctors';

// ==================================================
// ✅ Pub-sub for multi-instance sync
// ==================================================
const listeners = new Set();

const notifyListeners = (favorites) => {
  listeners.forEach((fn) => {
    try {
      fn(favorites);
    } catch (err) {
      console.warn('⚠️ Listener error:', err);
    }
  });
};

// ==================================================
// ✅ Storage helpers
// ==================================================
export const getFavorites = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('⚠️ Failed to read favorites:', err);
    return [];
  }
};

const saveFavorites = async (ids) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    notifyListeners(ids);
  } catch (err) {
    console.warn('⚠️ Failed to save favorites:', err);
  }
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function FavoriteButton({
  doctorId,
  size = 'md',
  onToggle,
  style,
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Load initial state + subscribe to changes
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const favorites = await getFavorites();
      if (mounted) setIsFavorite(favorites.includes(doctorId));
    };

    if (doctorId) load();

    // ✅ Subscribe to multi-instance changes
    const listener = (favorites) => {
      if (mounted) setIsFavorite(favorites.includes(doctorId));
    };
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, [doctorId]);

  const handlePress = useCallback(async () => {
    if (!doctorId) return;

    const favorites = await getFavorites();
    const currentlyFavorite = favorites.includes(doctorId);
    const nowFavorite = !currentlyFavorite;

    const updated = nowFavorite
      ? [...favorites, doctorId]
      : favorites.filter((id) => id !== doctorId);

    // ✅ Optimistic update
    setIsFavorite(nowFavorite);

    await saveFavorites(updated);

    // ✅ Correct callback with new state (not stale)
    onToggle?.(nowFavorite ? 'added' : 'removed', doctorId);
  }, [doctorId, onToggle]);

  const sizeMap = {
    sm: { button: 32, icon: 18 },
    md: { button: 40, icon: 22 },
    lg: { button: 48, icon: 26 },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.button,
        {
          width: s.button,
          height: s.button,
          borderRadius: s.button / 2,
        },
        style,
      ]}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={s.icon}
        color={isFavorite ? colors.error : colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

// ==================================================
// ✅ Export helpers for reuse
// ==================================================
export { getFavorites as getFavoriteDoctorIds };

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});