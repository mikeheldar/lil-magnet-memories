/**
 * SSR-Safe Storage Utilities
 * Provides localStorage and sessionStorage wrappers that work in both SSR and client contexts
 */

/**
 * Safe localStorage wrapper
 * Returns null and logs warnings on server-side
 */
export const safeLocalStorage = {
  getItem(key) {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem error:', error);
      return null;
    }
  },

  setItem(key, value) {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage.setItem error:', error);
    }
  },

  removeItem(key) {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage.removeItem error:', error);
    }
  },

  clear() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage.clear error:', error);
    }
  },

  key(index) {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.key(index);
    } catch (error) {
      console.warn('localStorage.key error:', error);
      return null;
    }
  },

  get length() {
    if (typeof window === 'undefined') {
      return 0;
    }
    try {
      return localStorage.length;
    } catch (error) {
      console.warn('localStorage.length error:', error);
      return 0;
    }
  }
};

/**
 * Safe sessionStorage wrapper
 */
export const safeSessionStorage = {
  getItem(key) {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('sessionStorage.getItem error:', error);
      return null;
    }
  },

  setItem(key, value) {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('sessionStorage.setItem error:', error);
    }
  },

  removeItem(key) {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('sessionStorage.removeItem error:', error);
    }
  },

  clear() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('sessionStorage.clear error:', error);
    }
  },

  key(index) {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return sessionStorage.key(index);
    } catch (error) {
      console.warn('sessionStorage.key error:', error);
      return null;
    }
  },

  get length() {
    if (typeof window === 'undefined') {
      return 0;
    }
    try {
      return sessionStorage.length;
    } catch (error) {
      console.warn('sessionStorage.length error:', error);
      return 0;
    }
  }
};

/**
 * Check if we're running on the server (SSR context)
 */
export const isServer = () => typeof window === 'undefined';

/**
 * Check if we're running on the client
 */
export const isClient = () => typeof window !== 'undefined';
