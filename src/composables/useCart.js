import { ref, computed, watch } from 'vue';

const cartItems = ref([]);
const CART_STORAGE_KEY = 'lil_magnet_cart';

// Load cart from localStorage on initialization
const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      cartItems.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    cartItems.value = [];
  }
};

// Save cart to localStorage whenever it changes
watch(
  cartItems,
  (newItems) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  },
  { deep: true }
);

// Initialize cart on module load
loadCartFromStorage();

export function useCart() {
  // Calculate price per unit based on quantity and pricing tiers
  const calculatePricePerUnit = (quantity, pricing) => {
    if (!pricing || Object.keys(pricing).length === 0) return 0;

    // Sort pricing tiers by quantity (descending)
    const tiers = Object.entries(pricing)
      .map(([qty, price]) => ({ qty: parseInt(qty), price: parseFloat(price) }))
      .sort((a, b) => b.qty - a.qty);

    // Find the best pricing tier for this quantity
    for (const tier of tiers) {
      if (quantity >= tier.qty) {
        return tier.price / tier.qty; // Price per unit
      }
    }

    // If quantity is less than smallest tier, use smallest tier
    const smallestTier = tiers[tiers.length - 1];
    return smallestTier ? smallestTier.price / smallestTier.qty : 0;
  };

  // Find the best pricing tier for display
  const getBestPricingTier = (quantity, pricing) => {
    if (!pricing || Object.keys(pricing).length === 0) return null;

    const tiers = Object.entries(pricing)
      .map(([qty, price]) => ({ qty: parseInt(qty), price: parseFloat(price) }))
      .sort((a, b) => b.qty - a.qty);

    for (const tier of tiers) {
      if (quantity >= tier.qty) {
        return tier.qty;
      }
    }

    return tiers[tiers.length - 1]?.qty || null;
  };

  const addToCart = (product, quantity = 1) => {
    const existingIndex = cartItems.value.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      const newQuantity = cartItems.value[existingIndex].quantity + quantity;
      const pricePerUnit = calculatePricePerUnit(newQuantity, product.pricing);
      const pricingTier = getBestPricingTier(newQuantity, product.pricing);

      cartItems.value[existingIndex] = {
        ...cartItems.value[existingIndex],
        quantity: newQuantity,
        pricePerUnit,
        pricingTier,
        totalPrice: pricePerUnit * newQuantity,
      };
    } else {
      // Add new item
      const pricePerUnit = calculatePricePerUnit(quantity, product.pricing);
      const pricingTier = getBestPricingTier(quantity, product.pricing);

      cartItems.value.push({
        productId: product.id,
        productName: product.description,
        productImage: product.imageUrl || '',
        quantity,
        pricePerUnit,
        pricingTier,
        totalPrice: pricePerUnit * quantity,
        productPricing: product.pricing, // Store full pricing structure for recalculation
      });
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const itemIndex = cartItems.value.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex >= 0) {
      const item = cartItems.value[itemIndex];
      const pricePerUnit = calculatePricePerUnit(
        newQuantity,
        item.productPricing
      );
      const pricingTier = getBestPricingTier(newQuantity, item.productPricing);

      cartItems.value[itemIndex] = {
        ...item,
        quantity: newQuantity,
        pricePerUnit,
        pricingTier,
        totalPrice: pricePerUnit * newQuantity,
      };
    }
  };

  const removeFromCart = (productId) => {
    const index = cartItems.value.findIndex(
      (item) => item.productId === productId
    );
    if (index >= 0) {
      cartItems.value.splice(index, 1);
    }
  };

  const clearCart = () => {
    cartItems.value = [];
  };

  const cartItemCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0);
  });

  const cartSubtotal = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.totalPrice, 0);
  });

  const getCartItem = (productId) => {
    return cartItems.value.find((item) => item.productId === productId);
  };

  return {
    cartItems,
    cartItemCount,
    cartSubtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItem,
  };
}
