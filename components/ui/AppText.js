// components/ui/AppText.js
// ==================================================
// 📝 AppText — Typography component
// ==================================================
// Usage:
//   <AppText variant="h1">Title</AppText>
//   <AppText variant="body" color="textSecondary">Description</AppText>
//   <AppText variant="label" weight="bold">Label</AppText>
// ==================================================
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography, fontFamily } from '../../theme/typography';
import { colors } from '../../theme/colors';

export default function AppText({
  children,
  variant = 'body',       // display | h1 | h2 | h3 | h4 | bodyLarge | body | bodySmall | label | labelLarge | caption | button | buttonSmall
  color,                   // 'textPrimary' | 'textSecondary' | 'textTertiary' | 'primary' | 'accent' | 'error' | ... OR custom hex
  weight,                  // light | regular | medium | semiBold | bold (override variant)
  align,                   // left | center | right (override)
  style,
  ...rest
}) {
  const variantStyle = typography[variant] || typography.body;

  // Resolve color
  const resolveColor = (c) => {
    if (!c) return undefined;
    if (colors[c]) return colors[c];
    return c; // assume hex/rgba
  };

  // Resolve weight override
  const weightMap = {
    light: fontFamily.light,
    regular: fontFamily.regular,
    medium: fontFamily.medium,
    semiBold: fontFamily.semiBold,
    bold: fontFamily.bold,
  };

  return (
    <Text
      style={[
        variantStyle,
        color && { color: resolveColor(color) },
        weight && { fontFamily: weightMap[weight] || fontFamily.regular },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({});