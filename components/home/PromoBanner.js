// components/home/PromoBanner.js
// ==================================================
// 🎁 PromoBanner — Poster image or text fallback
// ==================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

// ==================================================
// ✅ Default dimensions
// ==================================================
const DEFAULT_POSTER_HEIGHT = 180;   // 16:9-ish aspect for mobile banner
const DEFAULT_TEXT_HEIGHT = 140;

export default function PromoBanner({ promo, onPress, style }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!promo) return null;

  const {
    title,
    subtitle,
    description,
    imageUrl,                    // ✅ Poster image
    imageHeight,
    bgColor = colors.primary,
    textColor = colors.white,
    ctaLabel,
  } = promo;

  // ✅ If image exists and loads successfully → show poster
  const hasPoster = imageUrl && !imageError;

  // ==================================================
  // ✅ POSTER MODE (image only)
  // ==================================================
  if (hasPoster) {
    const posterHeight = imageHeight || DEFAULT_POSTER_HEIGHT;

    return (
      <TouchableOpacity
        onPress={() => onPress?.(promo)}
        activeOpacity={0.9}
        style={[
          styles.posterCard,
          {
            width: CARD_WIDTH,
            height: posterHeight,
            backgroundColor: bgColor,
          },
          style,
        ]}
      >
        {/* Poster image */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.posterImage}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />

        {/* Loading overlay (until image loads) */}
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ==================================================
  // ✅ TEXT FALLBACK MODE (no image / image error)
  // ==================================================
  return (
    <TouchableOpacity
      onPress={() => onPress?.(promo)}
      activeOpacity={0.9}
      style={[
        styles.textCard,
        {
          width: CARD_WIDTH,
          minHeight: DEFAULT_TEXT_HEIGHT,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {/* Content */}
      <View style={styles.content}>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: textColor }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}

        {title ? (
          <Text
            style={[styles.title, { color: textColor }]}
            numberOfLines={2}
          >
            {title}
          </Text>
        ) : null}

        {description ? (
          <Text
            style={[styles.description, { color: textColor }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}

        {ctaLabel ? (
          <View style={styles.cta}>
            <Text style={[styles.ctaText, { color: textColor }]}>
              {ctaLabel}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={textColor}
              style={{ marginLeft: 4 }}
            />
          </View>
        ) : null}
      </View>

      {/* Decorative circle */}
      <View
        style={[
          styles.decorCircle,
          { backgroundColor: textColor },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ==================================================
  // ✅ POSTER MODE
  // ==================================================
  posterCard: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadows.md,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==================================================
  // ✅ TEXT FALLBACK MODE
  // ==================================================
  textCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    ...shadows.md,
  },
  content: {
    maxWidth: '80%',
    zIndex: 2,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 4,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 4,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: spacing.xs,
  },
  ctaText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
  },
  decorCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.08,
    right: -60,
    top: -60,
  },
});