// Notification service that respects admin settings
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

class NotificationService {
  constructor() {
    this.notificationsEnabled = true; // Default to enabled
    this.settingsListener = null;
    this.settingsCache = null;
    this.$q = null; // Will be set by components
    
    // Load settings from Firestore
    this.loadSettings();
  }

  // Set Quasar instance (called by components)
  setQuasar($q) {
    this.$q = $q;
  }

  async loadSettings() {
    try {
      const settingsRef = doc(db, 'admin_settings', 'notifications');
      const docSnapshot = await getDoc(settingsRef);
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        this.notificationsEnabled = data.enabled !== false; // Default to true if not set
        this.settingsCache = data;
      } else {
        // Default settings - create document
        this.notificationsEnabled = true;
        await setDoc(settingsRef, { enabled: true }, { merge: true });
      }
      
      // Set up real-time listener for settings changes
      this.setupSettingsListener();
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Default to enabled on error
      this.notificationsEnabled = true;
    }
  }

  setupSettingsListener() {
    // Clean up existing listener
    if (this.settingsListener) {
      this.settingsListener();
      this.settingsListener = null;
    }

    try {
      const settingsRef = doc(db, 'admin_settings', 'notifications');
      this.settingsListener = onSnapshot(
        settingsRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            this.notificationsEnabled = data.enabled !== false;
            this.settingsCache = data;
            console.log('📢 Notification settings updated:', this.notificationsEnabled);
          }
        },
        (error) => {
          console.error('Error in notification settings listener:', error);
        }
      );
    } catch (error) {
      console.error('Error setting up notification settings listener:', error);
    }
  }

  async setNotificationsEnabled(enabled) {
    try {
      const settingsRef = doc(db, 'admin_settings', 'notifications');
      await setDoc(settingsRef, { enabled }, { merge: true });
      this.notificationsEnabled = enabled;
      console.log('✅ Notification settings updated:', enabled);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  isEnabled() {
    return this.notificationsEnabled;
  }

  // Safe notify that checks settings
  notify(options) {
    if (!this.notificationsEnabled) {
      console.log('🔇 Notifications disabled, skipping:', options.message);
      return;
    }

    try {
      if (this.$q && typeof this.$q.notify === 'function') {
        this.$q.notify(options);
      } else {
        console.warn('Notify plugin unavailable', options);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  cleanup() {
    if (this.settingsListener) {
      this.settingsListener();
      this.settingsListener = null;
    }
  }
}

export const notificationService = new NotificationService();

