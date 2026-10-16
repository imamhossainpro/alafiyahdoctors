// src/components/AnalyticsTracker.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../firebase';
import { trackMetaPageView } from '../utils/metaPixel';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // GA4 page_view
    trackEvent('page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });

    // ✅ Meta Pixel PageView (SPA-aware)
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return null;
}