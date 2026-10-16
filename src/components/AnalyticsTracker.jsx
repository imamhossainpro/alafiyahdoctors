// src/components/AnalyticsTracker.jsx
// ==================================================
// 📊 AnalyticsTracker — GA4 + Meta Pixel PageView
// ==================================================
// ✅ GA4 page_view
// ✅ Meta Pixel PageView (SPA-aware)
// ✅ Module-level guard — StrictMode duplicate প্রতিরোধ
// ==================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../firebase';
import { trackMetaPageView } from '../utils/metaPixel';

// ==================================================
// ✅ Module-level guard
// ==================================================
// useRef-এর বদলে module-level Set ব্যবহার করছি, কারণ
// React.StrictMode-এ component remount হলে useRef reset হয়,
// কিন্তু module-level variable browser session পর্যন্ত থাকে।
// ==================================================
const trackedPaths = new Set();

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // ✅ Guard: Already tracked হলে skip
    if (trackedPaths.has(currentPath)) {
      console.log(`⏭️ [Analytics] Skipping duplicate PageView: ${currentPath}`);
      return;
    }

    // ✅ Memory limit: সর্বোচ্চ 50 paths রাখি
    if (trackedPaths.size > 50) {
      const firstItem = trackedPaths.values().next().value;
      trackedPaths.delete(firstItem);
    }

    trackedPaths.add(currentPath);

    // ✅ GA4 page_view
    trackEvent('page_view', {
      page_path: currentPath,
      page_title: document.title,
    });

    // ✅ Meta Pixel PageView
    trackMetaPageView();

    console.log(`📄 [Analytics] PageView fired: ${currentPath}`);
  }, [location.pathname, location.search]);

  return null;
}