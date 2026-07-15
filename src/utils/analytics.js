/**
 * GA4 analytics — inert unless VITE_GA_MEASUREMENT_ID is set.
 * Set the ID per environment in Vercel (prod only, or separate IDs per branch)
 * so dev/test traffic never pollutes production stats.
 *
 * SPA page views are reported manually from the router (src/boot/analytics.js);
 * e-commerce funnel events fire from useCart, CheckoutPage and ThankYouPage.
 */

const MEASUREMENT_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID || '';
const CURRENCY = 'USD';

let initialized = false;

const isEnabled = () =>
  Boolean(MEASUREMENT_ID) && typeof window !== 'undefined';

export function initAnalytics() {
  if (!isEnabled() || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window.gtag('js', new Date());
  // send_page_view:false — the router reports SPA page views itself
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackEvent(name, params = {}) {
  if (!isEnabled() || !window.gtag) return;
  try {
    window.gtag('event', name, params);
  } catch (error) {
    console.warn('Analytics event failed:', error);
  }
}

export function trackPageView(path, title) {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

export function trackAddToCart({ value, items }) {
  trackEvent('add_to_cart', { currency: CURRENCY, value, items });
}

export function trackBeginCheckout({ value, items }) {
  trackEvent('begin_checkout', { currency: CURRENCY, value, items });
}

export function trackPurchase({ transactionId, value, shipping, tax, items }) {
  if (!isEnabled() || !transactionId) return;
  // ThankYouPage can be reloaded/revisited — only report each order once per browser
  const dedupeKey = `ga4_purchase_${transactionId}`;
  try {
    if (localStorage.getItem(dedupeKey)) return;
    localStorage.setItem(dedupeKey, '1');
  } catch {
    // storage unavailable — still report rather than lose the conversion
  }
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency: CURRENCY,
    value,
    shipping,
    tax,
    items,
  });
}
