import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        // ── Manual chunk grouping for optimal code splitting ────────
        manualChunks(id) {
          // React core — loaded first, cached forever
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Animation library
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Data & state libraries
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/zustand')) {
            return 'vendor-data';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Search
          if (id.includes('node_modules/fuse.js')) {
            return 'vendor-search';
          }
          // Page chunks — lazy loaded on route visit
          if (id.includes('/pages/HomePage')) return 'page-home';
          if (id.includes('/pages/DetailPage')) return 'page-detail';
          if (id.includes('/pages/CollectionsPage')) return 'page-collections';
          if (id.includes('/pages/GenrePage')) return 'page-genre';
          if (id.includes('/pages/SearchPage')) return 'page-search';
          if (id.includes('/pages/WatchlistPage')) return 'page-watchlist';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
