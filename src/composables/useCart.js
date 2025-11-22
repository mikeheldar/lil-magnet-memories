import { ref, computed, watch } from 'vue';
import { auth } from '../firebase/config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseService } from '../services/firebaseService.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const cartItems = ref([]);
const CART_STORAGE_KEY = 'lil_magnet_cart';
let currentUserId = null;
let isSyncingToFirestore = false;
let cartListenerUnsubscribe = null;

// Load cart from localStorage on initialization (for anonymous users)
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

// Save cart to localStorage and Firestore (if logged in)
const saveCart = async (items) => {
  try {
    // Always save to localStorage as backup
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    console.log('🛒 Cart saved to localStorage:', items.length, 'items');
    
    // If user is logged in, also save to Firestore
    const user = auth.currentUser;
    if (user && !user.isAnonymous && user.uid) {
      if (!isSyncingToFirestore) {
        isSyncingToFirestore = true;
        try {
          console.log('🛒 Saving cart to Firestore for user:', user.uid, items.length, 'items');
          await firebaseService.saveUserCart(user.uid, items);
          currentUserId = user.uid;
          console.log('✅ Cart saved to Firestore successfully');
        } catch (error) {
          console.error('❌ Error saving cart to Firestore:', error);
          // Don't throw - localStorage save succeeded
        } finally {
          isSyncingToFirestore = false;
        }
      } else {
        console.log('⏳ Cart sync already in progress, skipping...');
      }
    } else {
      console.log('ℹ️ User not logged in (or anonymous), cart saved to localStorage only');
    }
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

// Watch cart changes and save
watch(
  cartItems,
  (newItems) => {
    saveCart(newItems);
  },
  { deep: true }
);

// Initialize cart on module load
loadCartFromStorage();

// Check if user is already logged in on page load
const checkInitialAuthState = async () => {
  const user = auth.currentUser;
  if (user && !user.isAnonymous) {
    console.log('🔄 Initial auth check: User already logged in:', user.uid);
    try {
      const firestoreCart = await firebaseService.loadUserCart(user.uid);
      if (firestoreCart && firestoreCart.length > 0) {
        console.log('✅ Initial load: Cart from Firestore:', firestoreCart.length, 'items');
        cartItems.value = firestoreCart;
        currentUserId = user.uid;
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(firestoreCart));
      } else {
        // Check localStorage and merge if needed
        const localCart = localStorage.getItem(CART_STORAGE_KEY);
        if (localCart) {
          const parsed = JSON.parse(localCart);
          if (parsed && parsed.length > 0) {
            console.log('🔄 Initial load: Merging localStorage cart to Firestore:', parsed.length, 'items');
            cartItems.value = parsed;
            await firebaseService.saveUserCart(user.uid, parsed);
            currentUserId = user.uid;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in initial cart load:', error);
    }
  }
};

// Check initial auth state after a short delay to ensure auth is initialized
setTimeout(checkInitialAuthState, 500);

// Set up real-time listener for cart changes
const setupCartListener = (userId) => {
  // Clean up existing listener
  if (cartListenerUnsubscribe) {
    cartListenerUnsubscribe();
    cartListenerUnsubscribe = null;
  }

  if (!userId) return;

  console.log('👂 Setting up real-time cart listener for user:', userId);
  const cartDocRef = doc(db, 'user_carts', userId);
  
  cartListenerUnsubscribe = onSnapshot(
    cartDocRef,
    (snapshot) => {
      // Don't update if we're currently syncing (prevents infinite loops)
      if (isSyncingToFirestore) {
        console.log('⏭️ Skipping listener update - sync in progress');
        return;
      }
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        const items = data.items || [];
        console.log('🔄 Real-time cart update received:', items.length, 'items');
        
        // Only update if different to avoid unnecessary updates
        const currentItemsStr = JSON.stringify(cartItems.value);
        const newItemsStr = JSON.stringify(items);
        if (currentItemsStr !== newItemsStr) {
          console.log('✅ Updating cart from real-time listener');
          // Temporarily set flag to prevent watch from triggering save
          isSyncingToFirestore = true;
          cartItems.value = items;
          // Update localStorage to keep in sync
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
          // Reset flag after a short delay
          setTimeout(() => {
            isSyncingToFirestore = false;
          }, 100);
        }
      } else {
        console.log('ℹ️ Cart document does not exist in Firestore');
      }
    },
    (error) => {
      console.error('❌ Error in real-time cart listener:', error);
    }
  );
};

// Listen for auth state changes to load/sync cart
onAuthStateChanged(auth, async (user) => {
  console.log('🔄 Auth state changed in cart composable:', user ? (user.isAnonymous ? 'anonymous' : user.email) : 'logged out');
  
  // Clean up listener when user changes
  if (cartListenerUnsubscribe) {
    cartListenerUnsubscribe();
    cartListenerUnsubscribe = null;
  }
  
  if (user && !user.isAnonymous) {
    // User logged in - load cart from Firestore and set up real-time listener
    console.log('👤 User logged in, loading cart from Firestore for:', user.uid);
    try {
      const firestoreCart = await firebaseService.loadUserCart(user.uid);
      console.log('📦 Firestore cart loaded:', firestoreCart?.length || 0, 'items');
      
      if (firestoreCart && firestoreCart.length > 0) {
        console.log('✅ Loaded cart from Firestore for user:', user.uid, firestoreCart.length, 'items');
        cartItems.value = firestoreCart;
        currentUserId = user.uid;
        // Also update localStorage to keep in sync
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(firestoreCart));
      } else {
        // No Firestore cart, but check localStorage for items added while anonymous
        const localCart = localStorage.getItem(CART_STORAGE_KEY);
        if (localCart) {
          const parsed = JSON.parse(localCart);
          if (parsed && parsed.length > 0) {
            // Merge local cart to Firestore (user was anonymous, now logged in)
            console.log('🔄 Merging localStorage cart to Firestore for logged-in user:', parsed.length, 'items');
            cartItems.value = parsed;
            await firebaseService.saveUserCart(user.uid, parsed);
            currentUserId = user.uid;
          } else {
            console.log('ℹ️ No items in localStorage cart');
            currentUserId = user.uid;
          }
        } else {
          console.log('ℹ️ No Firestore cart and no localStorage cart');
          currentUserId = user.uid;
        }
      }
      
      // Set up real-time listener for immediate updates across devices
      setupCartListener(user.uid);
    } catch (error) {
      console.error('❌ Error loading cart from Firestore:', error);
      // Fallback to localStorage
      console.log('📦 Falling back to localStorage cart');
      loadCartFromStorage();
      currentUserId = user.uid;
      // Still try to set up listener
      setupCartListener(user.uid);
    }
  } else if (user && user.isAnonymous) {
    // User is anonymous - keep using localStorage, don't sync to Firestore
    // Don't clear cart - anonymous users can have items in cart
    console.log('👤 User is anonymous - using localStorage for cart');
    loadCartFromStorage();
    currentUserId = null; // Don't track anonymous user ID
  } else {
    // User explicitly logged out - clear cart from both localStorage and Firestore
    console.log('👋 User logged out - clearing cart from session and Firestore');
    const previousUserId = currentUserId;
    cartItems.value = [];
    localStorage.removeItem(CART_STORAGE_KEY);
    currentUserId = null;
    
    // Clear cart from Firestore for the logged-out user
    if (previousUserId) {
      try {
        await firebaseService.clearUserCart(previousUserId);
        console.log('✅ Cart cleared from Firestore for logged out user');
      } catch (error) {
        console.error('❌ Error clearing cart from Firestore:', error);
      }
    }
  }
});

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
      (item) => item.productId === product.id && !item.isCustomUpload
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
    // Explicitly trigger save to ensure immediate sync
    saveCart(cartItems.value);
  };

  const addCustomUploadToCart = (uploadData) => {
    // Add custom upload item with photos
    cartItems.value.push({
      isCustomUpload: true,
      productId: `custom-upload-${Date.now()}`, // Unique ID for custom uploads
      productName: uploadData.productName || 'Custom Photo Magnets',
      photos: uploadData.photos,
      photoQuantities: uploadData.quantities,
      specialInstructions: uploadData.specialInstructions,
      quantity: uploadData.totalMagnets,
      totalCost: uploadData.totalCost,
      costBreakdown: uploadData.costBreakdown,
      pricing: uploadData.pricing,
    });
    // Explicitly trigger save to ensure immediate sync
    saveCart(cartItems.value);
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
      // Explicitly trigger save to ensure immediate sync
      saveCart(cartItems.value);
    }
  };

  const removeFromCart = (productId) => {
    const index = cartItems.value.findIndex(
      (item) => item.productId === productId
    );
    if (index >= 0) {
      cartItems.value.splice(index, 1);
      // Explicitly trigger save to ensure immediate sync
      saveCart(cartItems.value);
    }
  };

  const clearCart = async () => {
    cartItems.value = [];
    // Clear from localStorage
    localStorage.removeItem(CART_STORAGE_KEY);
    // Clear from Firestore if user is logged in (not anonymous)
    const user = auth.currentUser;
    if (user && !user.isAnonymous && user.uid) {
      try {
        await firebaseService.clearUserCart(user.uid);
        currentUserId = null;
      } catch (error) {
        console.error('Error clearing cart from Firestore:', error);
      }
    }
  };

  const cartItemCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0);
  });

  const cartSubtotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      // Handle both regular products and custom uploads
      if (item.isCustomUpload) {
        return total + (item.totalCost?.total || 0);
      }
      return total + (item.totalPrice || 0);
    }, 0);
  });

  const getCartItem = (productId) => {
    return cartItems.value.find((item) => item.productId === productId);
  };

  return {
    cartItems,
    cartItemCount,
    cartSubtotal,
    addToCart,
    addCustomUploadToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItem,
  };
}
