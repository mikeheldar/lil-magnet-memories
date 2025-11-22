import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { config } from './environment.js';

// Admin Configuration
// Initial admin emails (fallback if Firebase is not available)
// Note: Admins are now managed in Firebase via user_roles collection
// This is only used as a fallback if Firebase is unavailable
export const INITIAL_ADMIN_EMAILS = [];

// Admin configuration
export const ADMIN_CONFIG = {
  // List of admin email addresses (will be loaded from Firebase)
  adminEmails: [...INITIAL_ADMIN_EMAILS],

  // Firebase collection reference
  adminCollection: 'admin_config',
  adminDocId: 'admin_emails',

  // Check if an email address is an admin
  isAdminEmail: (email) => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check loaded admin emails first
    if (ADMIN_CONFIG.adminEmails.includes(normalizedEmail)) {
      return true;
    }
    
    // Fallback to initial admin emails (hardcoded fallback)
    const INITIAL_ADMIN_EMAILS = [
      'michael.helmandarley@gmail.com',
      'amy.helmandarley@gmail.com',
      'lilmagnetmemories@gmail.com',
    ];
    return INITIAL_ADMIN_EMAILS.includes(normalizedEmail);
  },

  // Load admin emails from Firebase
  async loadAdminEmails() {
    try {
      console.log('Loading admin emails from Firebase...');
      
      // Ensure network is ready before making request
      try {
        const { ensureNetworkReady } = await import('../firebase/config.js');
        await ensureNetworkReady();
        console.log('Network ready for admin emails');
      } catch (networkError) {
        console.warn('Could not ensure network ready:', networkError);
        // Try direct enable as fallback
        try {
          const { enableNetwork } = await import('firebase/firestore');
          await enableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (fallbackError) {
          console.warn('Fallback network enable also failed:', fallbackError);
        }
      }
      
      const adminRef = doc(
        db,
        ADMIN_CONFIG.adminCollection,
        ADMIN_CONFIG.adminDocId
      );
      
      // Log the operation (Step 1: Track when errors occur)
      const { logOperation, completeOperation } = await import('../utils/firestoreLogger.js');
      const logId = logOperation('loadAdminEmails', {
        collection: ADMIN_CONFIG.adminCollection,
        document: ADMIN_CONFIG.adminDocId,
      });
      
      // Use retry mechanism for offline errors
      const { retryOnOffline } = await import('../firebase/config.js');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('loadAdminEmails timeout after 10 seconds')), 10000);
      });
      
      let adminSnap;
      try {
        adminSnap = await retryOnOffline(async () => {
          return await Promise.race([
            getDoc(adminRef),
            timeoutPromise,
          ]);
        });
        completeOperation(logId, { data: { exists: adminSnap.exists() } });
      } catch (error) {
        completeOperation(logId, { error });
        throw error;
      }

      if (adminSnap.exists()) {
        const data = adminSnap.data();
        ADMIN_CONFIG.adminEmails = data.emails || INITIAL_ADMIN_EMAILS;
        console.log(
          'Admin emails loaded from Firebase:',
          ADMIN_CONFIG.adminEmails
        );
      } else {
        console.log(
          'No admin config found in Firebase, creating initial config...'
        );
        // Create initial admin config in Firebase
        await ADMIN_CONFIG.saveAdminEmails(INITIAL_ADMIN_EMAILS);
        console.log('Created initial admin config in Firebase');
      }
    } catch (error) {
      console.error('Error loading admin emails:', error);
      // Fallback to initial emails
      ADMIN_CONFIG.adminEmails = [...INITIAL_ADMIN_EMAILS];
    }
  },

  // Save admin emails to Firebase
  async saveAdminEmails(emails) {
    try {
      // Ensure network is ready before saving
      try {
        const { ensureNetworkReady } = await import('../firebase/config.js');
        await ensureNetworkReady();
        console.log('Network ready for saving admin emails');
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (networkError) {
        console.warn('Could not ensure network ready:', networkError);
        // Try direct enable as fallback
        try {
          const { enableNetwork } = await import('firebase/firestore');
          await enableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (fallbackError) {
          console.warn('Fallback network enable also failed:', fallbackError);
        }
      }
      
      const adminRef = doc(
        db,
        ADMIN_CONFIG.adminCollection,
        ADMIN_CONFIG.adminDocId
      );
      
      // Use retry mechanism for offline errors
      const { retryOnOffline } = await import('../firebase/config.js');
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('saveAdminEmails timeout after 10 seconds')), 10000);
      });
      
      await retryOnOffline(async () => {
        return await Promise.race([
          setDoc(adminRef, {
            emails: emails,
            updatedAt: new Date(),
          }),
          timeoutPromise,
        ]);
      });
      ADMIN_CONFIG.adminEmails = [...emails];
      console.log('Admin emails saved to Firebase:', ADMIN_CONFIG.adminEmails);
    } catch (error) {
      console.error('Error saving admin emails:', error);
      throw error;
    }
  },

  // Get all admin emails (for display purposes)
  getAdminEmails: () => [...ADMIN_CONFIG.adminEmails],

  // Add a new admin email (runtime addition)
  async addAdminEmail(email) {
    console.log('Adding admin email:', email);
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);
    console.log('Current admin emails:', ADMIN_CONFIG.adminEmails);

    if (!ADMIN_CONFIG.adminEmails.includes(normalizedEmail)) {
      const updatedEmails = [...ADMIN_CONFIG.adminEmails, normalizedEmail];
      console.log('Updated emails list:', updatedEmails);
      await ADMIN_CONFIG.saveAdminEmails(updatedEmails);
      console.log('Admin email added successfully');
    } else {
      console.log('Email already in admin list');
    }
  },

  // Remove an admin email
  async removeAdminEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const updatedEmails = ADMIN_CONFIG.adminEmails.filter(
      (e) => e !== normalizedEmail
    );
    await ADMIN_CONFIG.saveAdminEmails(updatedEmails);
  },

  // Set up real-time listener for admin email changes
  setupRealtimeListener(onUpdate) {
    const adminRef = doc(
      db,
      ADMIN_CONFIG.adminCollection,
      ADMIN_CONFIG.adminDocId
    );
    return onSnapshot(
      adminRef,
      (doc) => {
        console.log('Real-time admin listener triggered');
        if (doc.exists()) {
          const data = doc.data();
          const newEmails = data.emails || INITIAL_ADMIN_EMAILS;
          console.log('Previous admin emails:', ADMIN_CONFIG.adminEmails);
          console.log('New admin emails from Firebase:', newEmails);
          ADMIN_CONFIG.adminEmails = [...newEmails];
          console.log(
            'Admin emails updated in real-time:',
            ADMIN_CONFIG.adminEmails
          );
          if (onUpdate) {
            console.log('Calling onUpdate callback');
            onUpdate(newEmails);
          }
        } else {
          console.log(
            'Admin config document does not exist in real-time listener'
          );
        }
      },
      (error) => {
        console.error('Error in admin emails real-time listener:', error);
      }
    );
  },
};

export default ADMIN_CONFIG;
