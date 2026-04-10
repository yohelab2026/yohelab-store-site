import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        radar: "apps/radar/index.html",
        proposal: "apps/proposal/index.html",
        xHelper: "apps/x-helper/index.html",
        ecCopy: "apps/ec-copy/index.html",
        aioMini: "apps/aio-mini/index.html",
        wpLabs: "labs/wordpress/index.html",
        chromeLabs: "labs/chrome/index.html",
      },
    },
  },
});
