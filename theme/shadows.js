// src/theme/shadows.js
// ==================================================
// 🌓 Al Afiyah Hospital — Shadow / Elevation Presets
// ==================================================
// Cross-platform (iOS shadow + Android elevation)
// Subtle by design (no heavy shadows)
// ==================================================

import { Platform } from 'react-native';

export const shadows = {
  none: {},

  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
  }),

  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
  }),

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
  }),

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
    },
    android: { elevation: 5 },
  }),

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
  }),

  // Colored shadows (for CTA buttons)
  primary: Platform.select({
    ios: {
      shadowColor: '#1c5fa8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),

  accent: Platform.select({
    ios: {
      shadowColor: '#0d9488',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
};

export default shadows;