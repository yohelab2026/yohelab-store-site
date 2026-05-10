/* Affiliate referral tracking — captures ?ref=AFF-XXXX-XXXX and decorates Stripe checkout links. */
(function(){
  var REF_RE = /^AFF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  var COOKIE_NAME = 'yohelab_aff';
  var ATTRIBUTION_DAYS = 30;

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  var url;
  try { url = new URL(location.href); } catch(e){ return; }
  var refFromUrl = (url.searchParams.get('ref') || '').toUpperCase();
  var existing = (getCookie(COOKIE_NAME) || '').toUpperCase();
  var activeRef = '';

  if (refFromUrl && REF_RE.test(refFromUrl)) {
    setCookie(COOKIE_NAME, refFromUrl, ATTRIBUTION_DAYS);
    activeRef = refFromUrl;
    try { fetch('/api/affiliate-click?code=' + encodeURIComponent(refFromUrl), {method:'POST', keepalive:true}); } catch(e){}
  } else if (REF_RE.test(existing)) {
    activeRef = existing;
  }

  if (!activeRef) return;

  var STRIPE_HOST = 'buy.stripe.com';
  function decorateLinks() {
    var links = document.querySelectorAll('a[href*="' + STRIPE_HOST + '"]');
    links.forEach(function(a){
      try {
        var u = new URL(a.href);
        if (u.host !== STRIPE_HOST) return;
        var current = u.searchParams.get('client_reference_id') || '';
        if (current.indexOf(':' + activeRef) !== -1) return;
        current = current.replace(/:AFF-[A-Z0-9-]+$/, '');
        u.searchParams.set('client_reference_id', current + ':' + activeRef);
        a.href = u.toString();
      } catch(e){}
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateLinks);
  } else {
    decorateLinks();
  }
})();
