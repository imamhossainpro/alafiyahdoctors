// components/ui/Divider.js
// ==================================================
// ➖ Divider — Horizontal / Vertical separator
// ==================================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function Divider({
  variant = 'horizontal',  // horizontal | vertical
  color = colors.border,
  thickness = 1,
  marginVertical = spacing.md,
  marginHorizontal = 0,
  style,
}) {
  if (variant === 'vertical') {
    return (
      <View
        style={[
          {
            width: thickness,
            backgroundColor: color,
            marginHorizontal,
            alignSelf: 'stretch',
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          height: thickness,
          backgroundColor: color,
          marginVertical,
          marginHorizontal,
        },
        style,
      ]}
    />
  );
}
