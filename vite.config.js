import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    // ✅ Faster minification
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // ✅ Firebase – আলাদা chunks
            if (id.includes('firebase/firestore')) return 'vendor-firestore';
            if (id.includes('firebase/auth')) return 'vendor-auth';
            if (id.includes('firebase/storage')) return 'vendor-storage';
            if (id.includes('@firebase')) return 'vendor-firebase-internal';
            if (id.includes('firebase')) return 'vendor-firebase';

            // ✅ Charts (recharts + d3)
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('d3-') || id.includes('victory') || id.includes('internmap')) return 'vendor-d3';

            // ✅ Icons (lucide-react)
            if (id.includes('lucide-react')) return 'vendor-icons';

            // ✅ PDF (jspdf + html2canvas + dependencies)
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify') || id.includes('fflate')) {
              return 'vendor-pdf';
            }

            // ✅ QR Code
            if (id.includes('qrcode') || id.includes('pngjs') || id.includes('dijkstrajs')) {
              return 'vendor-qrcode';
            }

            // ✅ React core (sabse age load hobe)
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }

            // ✅ Router
            if (id.includes('react-router')) return 'vendor-router';

            // ✅ Baileys / Socket (client-এ দরকার নেই, কিন্তু safety)
            if (id.includes('@whiskeysockets') || id.includes('baileys')) return 'vendor-baileys';
            if (id.includes('pino')) return 'vendor-pino';

            // ✅ বাকি সব
            return 'vendor';
          }
        },
        // ✅ Chunk filename আরো readable
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // ✅ Dev server fast startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'lucide-react',
    ],
    // ✅ Baileys pre-bundle থেকে বাদ (client-এ দরকার নেই)
    exclude: ['@whiskeysockets/baileys'],
  },
  server: {
    // ✅ Faster dev server
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/AdminDashboard.jsx',
      ],
    },
  },
});