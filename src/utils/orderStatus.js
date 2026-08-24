// Shared "is this order actually fulfilled?" logic.
//
// The app tracks TWO independent fields on an order:
//   status         — new → paid → in_progress → completed  (updateOrderStatus)
//   shippingStatus — pending → shipped → delivered          (updateShippingStatus)
// "Mark as Shipped/Delivered" only sets shippingStatus and deliberately never
// touches status, so an order shipped months ago can still read status:'paid'.
//
// That split is what produced the phantom "N open orders" 9am reminder email
// (fixed in functions on 2026-08-23) — and the admin order list has the same
// blind spot: it treated only status==='completed' as done. This helper is the
// single source of truth so the reminder, the list filter and the data-cleanup
// reconcile all agree on what "fulfilled" means.

export const OPEN_STATUSES = ['new', 'paid', 'in_progress'];
export const FULFILLED_SHIPPING = ['shipped', 'delivered'];

// An order is fulfilled if its status is completed OR it has already shipped /
// been delivered (shippingStatus), regardless of the stale status field.
export function isOrderFulfilled(order) {
  if (!order) return false;
  if (order.status === 'completed') return true;
  return FULFILLED_SHIPPING.includes(order.shippingStatus);
}
