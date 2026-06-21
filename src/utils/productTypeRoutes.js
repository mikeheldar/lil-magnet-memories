/** Firestore product category remains `designer`; public URLs use `novelty`. */
export const NOVELTY_ROUTE = 'novelty';
export const NOVELTY_CATEGORY = 'designer';

export function routeTypeToCategory(routeType) {
  if (routeType === NOVELTY_ROUTE || routeType === NOVELTY_CATEGORY) {
    return NOVELTY_CATEGORY;
  }
  return routeType;
}

export function categoryToRouteType(category) {
  if (category === NOVELTY_CATEGORY) {
    return NOVELTY_ROUTE;
  }
  return category;
}

export function productsListPath(categoryOrRoute) {
  return `/products/${categoryToRouteType(categoryOrRoute)}`;
}

export function productDetailPath(categoryOrRoute, productId) {
  return `/product/${categoryToRouteType(categoryOrRoute)}/${productId}`;
}

export function categoryListTitle(routeType) {
  if (routeType === 'custom') return 'Custom Photo Magnets';
  if (routeType === NOVELTY_ROUTE || routeType === NOVELTY_CATEGORY) {
    return 'Novelty Magnets';
  }
  if (routeType === 'specialty') return 'Specialty Magnets';
  return 'Products';
}
