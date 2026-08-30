import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // ১ MB (ডিফল্ট ৫০০ KB)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // নোড_মডিউল থেকে বড় লাইব্রেরি আলাদা চাঙ্কে
          if (id.includes('node_modules')) {
            // Firebase
            if (id.includes('firebase')) return 'vendor-firebase';
            // Recharts (চার্ট)
            if (id.includes('recharts')) return 'vendor-recharts';
            // Lucide React (আইকন)
            if (id.includes('lucide-react')) return 'vendor-icons';
            // জেএসপিডিএফ ও html2canvas
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            // বাকি সব ভেন্ডর একত্রে
            return 'vendor';
          }
        },
      },
    },
  },
});