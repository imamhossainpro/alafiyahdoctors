// services/promotionsService.js
// ==================================================
// 🎁 Promotions Service — Home Carousel Banners
// ==================================================
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '../firebase';

// ==================================================
// ✅ Check if promotion is within active date range
// ==================================================
const isWithinDateRange = (promo) => {
  const today = new Date().toISOString().split('T')[0];
  if (promo.startDate && today < promo.startDate) return false;
  if (promo.endDate && today > promo.endDate) return false;
  return true;
};

// ==================================================
// ✅ Fetch active promotions (client-side sort)
// ==================================================
export const getActivePromotions = async (hospitalId) => {
  if (!hospitalId) return [];

  try {
    const ref = collection(db, 'hospitals', hospitalId, 'promotions');
    const q = query(ref, where('isActive', '==', true));

    const snapshot = await getDocs(q);
    const promos = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (isWithinDateRange(data)) {
        promos.push({ id: doc.id, ...data });
      }
    });

    // Client-side sort by `order`
    promos.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999;
      const orderB = typeof b.order === 'number' ? b.order : 999;
      return orderA - orderB;
    });

    console.log(`🎁 Loaded ${promos.length} active promotions`);
    return promos;
  } catch (err) {
    console.error('❌ getActivePromotions error:', err);
    return [];
  }
};

// ==================================================
// ✅ Fallback default
// ==================================================
export const getDefaultPromotions = () => {
  return [
    {
      id: 'default-1',
      title: 'স্বাগতম',
      subtitle: 'আল-আফিয়া হাসপাতালে',
      description: 'অভিজ্ঞ ডাক্তার, আধুনিক সেবা, ২৪/৭ জরুরি বিভাগ',
      bgColor: '#1c5fa8',
      textColor: '#ffffff',
      ctaLabel: 'ডাক্তার দেখুন',
      ctaAction: 'open_doctors',
      ctaValue: '',
      isActive: true,
      order: 0,
      _isDefault: true,
    },
  ];
};

// ==================================================
// ✅ Main loader
// ==================================================
export const loadPromotions = async (hospitalId) => {
  const firebasePromos = await getActivePromotions(hospitalId);

  if (firebasePromos.length > 0) {
    return firebasePromos;
  }

  console.log('⚠️ No Firebase promos — using default');
  return getDefaultPromotions();
};

export default {
  getActivePromotions,
  getDefaultPromotions,
  loadPromotions,
};