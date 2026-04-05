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
        freelancerTools: 'freelancer-tools.html',
        demoPreview: 'demo-preview.html',
        goDemo: 'go-demo.html',
        goLegalDocs: 'go-legal-docs.html',
        goYakki: 'go-yakki.html',
        goPricing: 'go-pricing.html',
        goContract: 'go-contract.html',
        goBuyTakehome: 'go-buy-takehome.html',
        goBuyLegalDocs: 'go-buy-legal-docs.html',
        goBuyYakki: 'go-buy-yakki.html',
        goBuyPricing: 'go-buy-pricing.html',
        goBuyContract: 'go-buy-contract.html',
        goBuyBundle: 'go-buy-bundle.html',
        goContactTakehome: 'go-contact-takehome.html',
        goContactLegalDocs: 'go-contact-legal-docs.html',
        goContactYakki: 'go-contact-yakki.html',
        goContactPricing: 'go-contact-pricing.html',
        goContactContract: 'go-contact-contract.html',
        goContactBundle: 'go-contact-bundle.html',
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
