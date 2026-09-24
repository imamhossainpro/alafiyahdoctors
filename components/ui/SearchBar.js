// src/components/ui/SearchBar.js
// ==================================================
// 🔍 SearchBar — Search input with clear button
// ==================================================
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'খুঁজুন...',
  onClear,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="search"
        size={20}
        color={colors.textTertiary}
        style={{ marginRight: spacing.sm }}
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {value ? (
        <TouchableOpacity
          onPress={() => {
            onChangeText?.('');
            onClear?.();
          }}
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingLeft: 0,
  },
  clearButton: {
    padding: 4,
  },
});