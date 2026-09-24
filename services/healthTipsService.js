// services/healthTipsService.js
// ==================================================
// 💡 Health Tips — Placeholder Service
// ==================================================
// NOTE: No Firebase collection exists yet for health tips.
// This returns static placeholder tips.
//
// TODO (Future): Connect to Firebase collection:
//   hospitals/alafiyah_main/healthTips/{tipId}
//   Fields: title, content, category, imageUrl, isActive, order
//
// When Firebase collection is ready:
//   1. Replace getHealthTips() with Firestore query
//   2. No UI changes needed — component signature same
// ==================================================

const PLACEHOLDER_TIPS = [
  {
    id: 'tip-1',
    title: 'প্রতিদিন পর্যাপ্ত পানি পান করুন',
    content:
      'প্রতিদিন কমপক্ষে ৮ গ্লাস পানি পান করুন। এটি আপনার শরীরকে সতেজ ও সুস্থ রাখতে সাহায্য করে।',
    icon: 'water-outline',
    category: 'সাধারণ',
  },
  {
    id: 'tip-2',
    title: 'নিয়মিত হাত ধুয়ে রাখুন',
    content:
      'খাওয়ার আগে ও বাইরে থেকে ফিরে সাবান দিয়ে ২০ সেকেন্ড হাত ধুয়ে নিন। সংক্রমণ প্রতিরোধে এটি সবচেয়ে কার্যকর উপায়।',
    icon: 'hand-left-outline',
    category: 'সতর্কতা',
  },
  {
    id: 'tip-3',
    title: 'নিয়মিত ব্যায়াম করুন',
    content:
      'প্রতিদিন অন্তত ৩০ মিনিট হাঁটাহাঁটি বা হালকা ব্যায়াম করুন। এতে হৃদযন্ত্র সুস্থ থাকে এবং মানসিক চাপ কমে।',
    icon: 'fitness-outline',
    category: 'ফিটনেস',
  },
];

export const getHealthTips = async (hospitalId, limit = 3) => {
  return PLACEHOLDER_TIPS.slice(0, limit);
};

export const isUsingPlaceholderData = () => true;

export default {
  getHealthTips,
  isUsingPlaceholderData,
};