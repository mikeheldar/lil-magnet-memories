// Service to sync user preferences across devices via Firestore
import { auth } from '../firebase/config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';

class UserPreferencesService {
  constructor() {
    this.preferencesCache = null;
    this.listenerUnsubscribe = null;
    this.listeners = new Set();
    this.currentUserId = null;

    // Listen for auth state changes to set up/tear down listeners
    onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        // User logged in - load preferences immediately, then set up Firestore listener
        this.currentUserId = user.uid;
        console.log('👤 User logged in, loading preferences for:', user.uid);
        // Load preferences first to populate cache
        await this.loadPreferences(user.uid);
        // Then set up real-time listener
        this.setupRealtimeListener(user.uid);
      } else {
        // User logged out or anonymous - clean up listener
        this.cleanup();
        this.currentUserId = null;
        this.preferencesCache = null;
      }
    });
  }

  // Set up real-time Firestore listener for user preferences
  setupRealtimeListener(userId) {
    // Clean up existing listener
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }

    try {
      const userPrefsRef = doc(db, 'user_preferences', userId);
      console.log('👂 Setting up user preferences real-time listener for:', userId);

      // Set up real-time listener
      this.listenerUnsubscribe = onSnapshot(
        userPrefsRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log('🔄 User preferences updated in real-time:', data);
            const oldCache = this.preferencesCache;
            this.preferencesCache = data;
            
            // Only notify if something actually changed
            if (JSON.stringify(oldCache) !== JSON.stringify(data)) {
              console.log('📢 Preferences changed, notifying listeners');
              this.notifyListeners();
            }
          } else {
            // Document doesn't exist yet - initialize with defaults
            console.log('ℹ️ User preferences document does not exist, using defaults');
            const defaults = this.getDefaultPreferences();
            const oldCache = this.preferencesCache;
            this.preferencesCache = defaults;
            
            // Only notify if cache was null (first load)
            if (oldCache === null) {
              console.log('📢 Initial preferences loaded, notifying listeners');
              this.notifyListeners();
            }
          }
        },
        (error) => {
          console.error('❌ Error in user preferences real-time listener:', error);
          // Fallback to loading from cache
          this.loadPreferences(userId).catch(err => {
            console.error('Error loading preferences after listener error:', err);
          });
        }
      );
      console.log('✅ User preferences listener set up successfully');
    } catch (error) {
      console.error('❌ Error setting up user preferences real-time listener:', error);
    }
  }

  // Get default preferences
  getDefaultPreferences() {
    return {
      isCustomerAtEvent: false,
      updatedAt: new Date().toISOString(),
    };
  }

  // Load preferences from Firestore (async)
  async loadPreferences(userId) {
    try {
      const userPrefsRef = doc(db, 'user_preferences', userId);
      const docSnapshot = await getDoc(userPrefsRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        this.preferencesCache = data;
        return data;
      } else {
        // Document doesn't exist - return defaults
        const defaults = this.getDefaultPreferences();
        this.preferencesCache = defaults;
        return defaults;
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Return defaults on error
      const defaults = this.getDefaultPreferences();
      this.preferencesCache = defaults;
      return defaults;
    }
  }

  // Save preferences to Firestore
  async savePreferences(userId, preferences) {
    try {
      const userPrefsRef = doc(db, 'user_preferences', userId);
      await setDoc(
        userPrefsRef,
        {
          ...preferences,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('✅ User preferences saved to Firestore');
      // Cache will be updated by the real-time listener
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  // Get preference value (sync - uses cache)
  getPreference(key, defaultValue = null) {
    const user = auth.currentUser;
    
    // For logged-in users, use Firestore cache
    if (user && !user.isAnonymous && this.preferencesCache) {
      return this.preferencesCache[key] !== undefined
        ? this.preferencesCache[key]
        : defaultValue;
    }
    
    // For anonymous users or if cache not loaded, use localStorage
    try {
      const stored = localStorage.getItem(`user_preference_${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error reading preference ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  // Set preference value
  async setPreference(key, value) {
    const user = auth.currentUser;
    
    // For logged-in users, save to Firestore
    if (user && !user.isAnonymous) {
      const currentPrefs = this.preferencesCache || this.getDefaultPreferences();
      await this.savePreferences(user.uid, {
        ...currentPrefs,
        [key]: value,
      });
    } else {
      // For anonymous users, save to localStorage
      try {
        localStorage.setItem(`user_preference_${key}`, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving preference ${key} to localStorage:`, error);
      }
    }
  }

  // Get isCustomerAtEvent status (sync)
  isCustomerAtEvent() {
    return this.getPreference('isCustomerAtEvent', false);
  }

  // Set isCustomerAtEvent status
  async setIsCustomerAtEvent(value) {
    await this.setPreference('isCustomerAtEvent', value);
  }

  // Add a listener callback that will be called when preferences change
  addListener(callback) {
    this.listeners.add(callback);
    // Immediately call with current state
    if (this.preferencesCache) {
      callback();
    }
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners that preferences have changed
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in user preferences listener callback:', error);
      }
    });
  }

  // Cleanup method to unsubscribe from listener
  cleanup() {
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }
    this.listeners.clear();
  }
}

export const userPreferencesService = new UserPreferencesService();

