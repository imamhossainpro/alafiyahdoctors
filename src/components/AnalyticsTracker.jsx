// src/components/AnalyticsTracker.jsx
// ==================================================
// 📊 AnalyticsTracker — GA4 + Meta Pixel
// ==================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../firebase';
import { trackMetaPageView } from '../utils/metaPixel';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = location.pathname + location.search;

    // ✅ GA4 page_view
    trackEvent('page_view', {
      page_path: pagePath,
      page_title: document.title,
    });

    // ✅ Meta Pixel PageView (SPA-aware)
    console.log('📄 Route changed:', pagePath);
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return null;
}