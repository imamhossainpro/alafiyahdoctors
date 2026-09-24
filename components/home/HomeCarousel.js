// components/home/HomeCarousel.js
// ==================================================
// 🎠 HomeCarousel — Auto-sliding promotional banners
// ==================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PromoBanner from './PromoBanner';
import { loadPromotions } from '../../services/promotionsService';
import { useHospital } from '../../context/HospitalContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const AUTO_SLIDE_INTERVAL = 4000; // 4 seconds

export default function HomeCarousel({ navigation, style }) {
  const { hospitalId } = useHospital();
  const [promotions, setPromotions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const autoSlideTimer = useRef(null);

  // ==================================================
  // ✅ Load promotions
  // ==================================================
  const loadData = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const data = await loadPromotions(hospitalId);
      setPromotions(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('❌ Carousel load error:', err);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ==================================================
  // ✅ Auto-slide
  // ==================================================
  useEffect(() => {
    if (promotions.length <= 1) return;

    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
    }

    autoSlideTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % promotions.length;

        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: next * (CARD_WIDTH + spacing.md),
            animated: true,
          });
        }

        return next;
      });
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    };
  }, [promotions.length]);

  // ==================================================
  // ✅ Handle manual scroll (pause auto-slide + update index)
  // ==================================================
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + spacing.md));
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // ==================================================
  // ✅ Handle banner press
  // ==================================================
  const handleBannerPress = (promo) => {
    if (!promo) return;

    const action = promo.ctaAction || 'none';

    switch (action) {
      case 'open_url':
        // Open URL (external)
        // Note: Link will open in browser — for in-app use WebView
        if (promo.ctaValue) {
          // We'll add Linking here
          const { Linking } = require('react-native');
          Linking.openURL(promo.ctaValue).catch(() => {});
        }
        break;

      case 'open_doctors':
        navigation?.navigate('Doctors');
        break;

      case 'open_booking':
        navigation?.navigate('Booking');
        break;

      case 'open_doctor':
        // Specific doctor
        if (promo.ctaValue) {
          navigation?.navigate('DoctorDetails', {
            doctorId: promo.ctaValue,
          });
        }
        break;

      case 'open_reports':
        navigation?.navigate('Reports');
        break;

      case 'none':
      default:
        break;
    }
  };

  // ==================================================
  // ✅ Empty state
  // ==================================================
  if (!promotions || promotions.length === 0) {
    return null;
  }

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <View style={[styles.container, style]}>
      {/* Scrollable banners */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.md}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {promotions.map((promo) => (
          <PromoBanner
            key={promo.id}
            promo={promo}
            onPress={handleBannerPress}
            style={styles.banner}
          />
        ))}
      </ScrollView>

      {/* Dots indicator */}
      {promotions.length > 1 && (
        <View style={styles.dotsContainer}>
          {promotions.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => {
                setCurrentIndex(idx);
                scrollRef.current?.scrollTo({
                  x: idx * (CARD_WIDTH + spacing.md),
                  animated: true,
                });
              }}
              style={[
                styles.dot,
                idx === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  banner: {
    // width set inline in PromoBanner
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});