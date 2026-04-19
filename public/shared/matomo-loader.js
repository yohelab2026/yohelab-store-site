(() => {
  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const baseUrl = window.YOHELAB_MATOMO_URL || (isLocal ? "http://localhost:8080/" : "https://analytics.yohelab.com/");
  const siteId = String(window.YOHELAB_MATOMO_SITE_ID || "1");
  const u = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  window._paq = window._paq || [];
  window._paq.push(["trackPageView"]);
  window._paq.push(["enableLinkTracking"]);
  window._paq.push(["setTrackerUrl", `${u}matomo.php`]);
  window._paq.push(["setSiteId", siteId]);

  const d = document;
  const g = d.createElement("script");
  const s = d.getElementsByTagName("script")[0];
  g.async = true;
  g.src = `${u}matomo.js`;
  s.parentNode.insertBefore(g, s);
})();
