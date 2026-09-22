// screens/OnlineReportScreen.js
// ==================================================
// 🌐 Online Report — WebView (App-এর ভিতরে)
// ==================================================
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONLINE_REPORT_URL = 'http://103.121.38.138:8080/ords/f?p=ONL:ONLINE';

export default function OnlineReportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // ==================================================
  // ✅ Loading Start
  // ==================================================
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  // ==================================================
  // ✅ Loading End
  // ==================================================
  const handleLoadEnd = () => {
    setLoading(false);
  };

  // ==================================================
  // ✅ Error
  // ==================================================
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('❌ WebView error:', nativeEvent);
    setError(nativeEvent.description || 'পেজ লোড করা যায়নি');
    setLoading(false);
  };

  // ==================================================
  // ✅ Navigation State Change
  // ==================================================
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  // ==================================================
  // ✅ Retry
  // ==================================================
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // ==================================================
  // ✅ Loading UI
  // ==================================================
  const renderLoading = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#1c5fa8" />
        <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
      </View>
    );
  };

  // ==================================================
  // ✅ Error UI
  // ==================================================
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={64} color="#dc2626" />
          <Text style={styles.errorTitle}>পেজ লোড করা যায়নি</Text>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryText}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#1c5fa8" />
            <Text style={styles.backText}>ফিরে যান</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==================================================
  // ✅ Main Render
  // ==================================================
  return (
    <View style={styles.container}>
      {/* Top Bar with back/forward/reload */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarButton}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={canGoBack ? '#1c5fa8' : '#cbd5e1'}
          />
        </TouchableOpacity>

        <View style={styles.urlBox}>
          <Ionicons name="lock-closed-outline" size={13} color="#64748b" />
          <Text style={styles.urlText} numberOfLines={1}>
            {ONLINE_REPORT_URL}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.topBarButton}
          onPress={() => webViewRef.current?.reload()}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#1c5fa8" />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: ONLINE_REPORT_URL }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        // ✅ Android-এ HTTP URL support
        mixedContentMode="always"
        allowsInlineMediaPlayback
        // ✅ Android-এ http URL-এর জন্য
        originWhitelist={['*']}
        // ✅ User Agent
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            : undefined
        }
      />

      {/* Loading Overlay */}
      {renderLoading()}

      {/* Bottom Safe Area Padding */}
      <View style={{ height: insets.bottom, backgroundColor: '#fff' }} />
    </View>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6,
  },
  topBarButton: {
    padding: 6,
    borderRadius: 6,
  },
  urlBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },

  // Error
  errorBox: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#dc2626',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c5fa8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: '#1c5fa8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  backText: {
    fontSize: 14,
    color: '#1c5fa8',
    fontWeight: '600',
  },
});