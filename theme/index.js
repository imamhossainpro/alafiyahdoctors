// src/theme/index.js
// ==================================================
// 🎨 Al Afiyah Hospital — Design System Theme
// ==================================================
// Central export for all design tokens
// ==================================================

export { colors } from './colors';
export { spacing } from './spacing';
export { typography, fontFamily } from './typography';
export { radius } from './radius';
export { shadows } from './shadows';

// Unified theme object
import { colors } from './colors';
import { spacing } from './spacing';
import { typography, fontFamily } from './typography';
import { radius } from './radius';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  fontFamily,
  radius,
  shadows,
};

export default theme;