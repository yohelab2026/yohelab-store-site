import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        standalone: 'standalone.html',
        analytics: 'analytics.html',
        legalCommercialTransactions: 'legal-commercial-transactions.html',
        privacyPolicy: 'privacy-policy.html',
        terms: 'terms.html',
      },
    },
  },
});
