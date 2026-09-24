// src/theme/typography.js
// ==================================================
// ✍️ Al Afiyah Hospital — Typography System
// ==================================================
// Bengali-compatible (Hind Siliguri)
// Clear hierarchy, comfortable reading
// ==================================================

export const fontFamily = {
  regular: 'HindSiliguri-Regular',
  medium: 'HindSiliguri-Medium',
  semiBold: 'HindSiliguri-SemiBold',
  bold: 'HindSiliguri-Bold',
  light: 'HindSiliguri-Light',
};

export const typography = {
  // ==========================================
  // Display / Hero
  // ==========================================
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  // ==========================================
  // Headings
  // ==========================================
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
  },
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },

  // ==========================================
  // Body
  // ==========================================
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },

  // ==========================================
  // Labels / UI
  // ==========================================
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  labelLarge: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  buttonSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
};

export default typography;