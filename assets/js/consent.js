/* Eques Fin — cookie consent (GDPR / ePrivacy)
 * Nothing non-essential loads before the visitor opts in:
 *   - Analytics  -> Google Tag Manager (GTM-K2SXR99G) + Consent Mode analytics_storage
 *   - Marketing  -> Leadfeeder / Dealfront (B2B visitor identification) + Consent Mode ad_* signals
 * The choice is stored for 6 months in a first-party cookie "eqf_consent", then asked again.
 * Any link with [data-cookie-settings] reopens the preferences panel.
 */
(function () {
  var COOKIE = 'eqf_consent';
  var VERSION = 1;
  var MAX_AGE = 60 * 60 * 24 * 182; // ~6 months
  var GTM_ID = 'GTM-K2SXR99G';
  var LF_ID = 'JMvZ8gvYznza2pOd';
  var loaded = { gtm: false, lf: false };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function read() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)eqf_consent=([^;]*)/);
      if (!m) return null;
      var v = JSON.parse(decodeURIComponent(m[1]));
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }

  function write(c) {
    var v = { v: VERSION, analytics: !!c.analytics, marketing: !!c.marketing, ts: new Date().toISOString() };
    document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(v)) +
      '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    return v;
  }

  function clearTrackingCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (p) {
      var name = p.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_gcl|_lfa|_dc_gtm)/.test(name)) {
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; Path=/' + d;
        });
      }
    });
  }

  function loadGTM() {
    if (loaded.gtm) return; loaded.gtm = true;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  function loadLeadfeeder() {
    if (loaded.lf) return; loaded.lf = true;
    window.ldfdr = window.ldfdr || function () { (window.ldfdr._q = window.ldfdr._q || []).push([].slice.call(arguments)); };
    var s = document.createElement('script');
    s.async = true; s.src = 'https://sc.lfeeder.com/lftracker_v1_' + LF_ID + '.js';
    document.head.appendChild(s);
  }

  function apply(c) {
    gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
    window.dataLayer.push({ event: 'consent_update', consent_analytics: !!c.analytics, consent_marketing: !!c.marketing });
    try { document.dispatchEvent(new CustomEvent('eqf:consent', { detail: { analytics: !!c.analytics, marketing: !!c.marketing } })); } catch (e) {}
    if (c.analytics) loadGTM();
    if (c.marketing) loadLeadfeeder();
  }

  /* ---------- UI ---------- */
  var banner, prefs;

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function buildBanner() {
    banner = el(
      '<div class="cc-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">' +
        '<div class="cc-inner">' +
          '<div class="cc-text"><strong>We value your privacy.</strong> We use cookies and similar technologies to measure our audience (Google Tag Manager / Analytics), to identify the companies visiting our site (Leadfeeder) and to display our LinkedIn posts. They are only activated with your consent. You can change your choice at any time via &ldquo;Cookie settings&rdquo; at the bottom of each page. <a href="/privacy-policy#cookies">Learn more</a></div>' +
          '<div class="cc-actions">' +
            '<button type="button" class="cc-btn" data-cc="reject">Reject all</button>' +
            '<button type="button" class="cc-btn" data-cc="customize">Customize</button>' +
            '<button type="button" class="cc-btn" data-cc="accept">Accept all</button>' +
          '</div>' +
        '</div>' +
      '</div>');
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-cc');
      if (a === 'accept') decide({ analytics: true, marketing: true });
      if (a === 'reject') decide({ analytics: false, marketing: false });
      if (a === 'customize') openPrefs();
    });
  }

  function buildPrefs() {
    prefs = el(
      '<div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="cc-title" hidden>' +
        '<div class="cc-panel">' +
          '<h2 id="cc-title">Cookie settings</h2>' +
          '<p class="cc-lead">Choose which categories you allow. Strictly necessary cookies cannot be disabled.</p>' +
          '<div class="cc-row"><div><b>Strictly necessary</b><p>Required for the site to work and to remember your cookie choice.</p></div><span class="cc-always">Always on</span></div>' +
          '<label class="cc-row"><div><b>Audience measurement</b><p>Google Tag Manager / Google Analytics &mdash; anonymous statistics on how the site is used.</p></div><input type="checkbox" id="cc-analytics"><span class="cc-switch" aria-hidden="true"></span></label>' +
          '<label class="cc-row"><div><b>Marketing &amp; B2B visitor identification</b><p>Leadfeeder (Dealfront) &mdash; identifies the companies visiting our site from their network address. LinkedIn &mdash; displays our latest LinkedIn posts on the home page (LinkedIn may set its own cookies).</p></div><input type="checkbox" id="cc-marketing"><span class="cc-switch" aria-hidden="true"></span></label>' +
          '<div class="cc-actions">' +
            '<button type="button" class="cc-btn" data-cc="reject">Reject all</button>' +
            '<button type="button" class="cc-btn" data-cc="save">Save my choices</button>' +
            '<button type="button" class="cc-btn" data-cc="accept">Accept all</button>' +
          '</div>' +
        '</div>' +
      '</div>');
    document.body.appendChild(prefs);
    prefs.addEventListener('click', function (e) {
      if (e.target === prefs) { closePrefs(); return; }
      var a = e.target.getAttribute && e.target.getAttribute('data-cc');
      if (a === 'accept') decide({ analytics: true, marketing: true });
      if (a === 'reject') decide({ analytics: false, marketing: false });
      if (a === 'save') decide({
        analytics: document.getElementById('cc-analytics').checked,
        marketing: document.getElementById('cc-marketing').checked
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && prefs && !prefs.hidden) closePrefs(); });
  }

  function openPrefs() {
    if (!prefs) buildPrefs();
    var c = read() || { analytics: false, marketing: false };
    document.getElementById('cc-analytics').checked = !!c.analytics;
    document.getElementById('cc-marketing').checked = !!c.marketing;
    prefs.hidden = false;
    var first = prefs.querySelector('input'); if (first) first.focus();
  }
  function closePrefs() { if (prefs) prefs.hidden = true; }

  function decide(c) {
    var previous = read();
    var saved = write(c);
    if (banner) { banner.remove(); banner = null; }
    closePrefs();
    var withdrawn = previous && ((previous.analytics && !saved.analytics) || (previous.marketing && !saved.marketing));
    if (withdrawn) { clearTrackingCookies(); location.reload(); return; }
    apply(saved);
  }

  function init() {
    var c = read();
    if (c) apply(c); else buildBanner();
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); openPrefs(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
