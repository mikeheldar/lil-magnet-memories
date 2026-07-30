/**
 * GA4 analytics — inert unless VITE_GA_MEASUREMENT_ID is set.
 * Set the ID per environment in Vercel (prod only, or separate IDs per branch)
 * so dev/test traffic never pollutes production stats.
 *
 * SPA page views are reported manually from the router (src/boot/analytics.js);
 * e-commerce funnel events fire from the product/cart pages, useCart,
 * CheckoutPage and ThankYouPage:
 * view_item_list -> view_item -> add_to_cart/remove_from_cart -> view_cart ->
 * begin_checkout -> purchase.
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

// Map a Firestore product doc to a GA4 item (price = first pricing tier, like the
// Product JSON-LD offer). Optional index = position within a list.
export function productToGaItem(product, index) {
  const item = {
    item_id: String(product.id),
    item_name: product.description || 'Product',
  };
  if (typeof index === 'number') item.index = index;
  const pricing = product.pricing;
  if (pricing && typeof pricing === 'object') {
    const firstKey = Object.keys(pricing)[0];
    const price = Number(pricing[firstKey]);
    if (!Number.isNaN(price)) item.price = price;
  }
  return item;
}

export function trackViewItemList({ listId, listName, items }) {
  trackEvent('view_item_list', {
    item_list_id: listId,
    item_list_name: listName,
    items,
  });
}

export function trackViewItem({ value, items }) {
  trackEvent('view_item', { currency: CURRENCY, value, items });
}

export function trackViewCart({ value, items }) {
  trackEvent('view_cart', { currency: CURRENCY, value, items });
}

export function trackRemoveFromCart({ value, items }) {
  trackEvent('remove_from_cart', { currency: CURRENCY, value, items });
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
