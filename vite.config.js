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
        demoPreview: 'demo-preview.html',
        legalDocsPreview: 'legal-docs-preview.html',
        yakkiCheckerPreview: 'yakki-checker-preview.html',
        pricingSimulatorPreview: 'pricing-simulator-preview.html',
        contractGeneratorPreview: 'contract-generator-preview.html',
        legalCommercialTransactions: 'legal-commercial-transactions.html',
        privacyPolicy: 'privacy-policy.html',
        terms: 'terms.html',
      },
    },
  },
});
