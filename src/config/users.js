import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

// User role constants
export const USER_ROLES = {
  CUSTOMER: 'customer',
  OPERATOR: 'operator',
  ADMIN: 'admin',
};

// Initial admin emails to seed on first load
const INITIAL_ADMIN_EMAILS = [
  'michael.helmandarley@gmail.com',
  'lilmagnetmemories@gmail.com',
];

// User roles configuration
export const USERS_CONFIG = {
  // Firebase collection reference
  usersCollection: 'user_roles',
  
  // Load user roles from Firebase and seed initial admins if needed
  // Returns empty object if offline/error - initial admins handled separately
  async loadUserRoles() {
    try {
      console.log('Loading user roles from Firebase...');
      console.log('Network status:', typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'unknown');
      
      // Try to ensure network is enabled before making request
      try {
        // Import and use the ensureNetworkReady function from firebase config
        const { ensureNetworkReady } = await import('../firebase/config.js');
        const networkReady = await ensureNetworkReady();
        if (!networkReady) {
          console.warn('⚠️ Network may not be ready, proceeding anyway...');
        }
        console.log('Firestore network explicitly enabled and ready');
        // Wait a bit more to ensure it's fully connected
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (networkError) {
        console.warn('Could not explicitly enable network (may already be enabled):', networkError);
        // Try direct enable as fallback
        try {
          const { enableNetwork } = await import('firebase/firestore');
          await enableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (fallbackError) {
          console.warn('Fallback network enable also failed:', fallbackError);
        }
      }
      
      const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
      
      // Use retry mechanism for offline errors
      const { retryOnOffline } = await import('../firebase/config.js');
      
      // Add timeout to prevent hanging (increased to 60 seconds to allow for retries)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('loadUserRoles timeout after 60 seconds')), 60000);
      });
      
      const usersSnap = await retryOnOffline(async () => {
        return await Promise.race([
          getDoc(usersRef),
          timeoutPromise,
        ]);
      });

      let rolesData = {};
      if (usersSnap.exists()) {
        rolesData = usersSnap.data();
        // Remove timestamp field if it exists
        delete rolesData.updatedAt;
        console.log('Loaded user roles from Firebase:', Object.keys(rolesData).length, 'users');
      } else {
        console.log('No user roles document found in Firebase');
      }

      // Always ensure initial admins are in the data
      for (const email of INITIAL_ADMIN_EMAILS) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!rolesData[normalizedEmail] || rolesData[normalizedEmail] !== USER_ROLES.ADMIN) {
          rolesData[normalizedEmail] = USER_ROLES.ADMIN;
        }
      }

      // Try to save if we updated anything (non-blocking, don't wait for it)
      // This should not block the UI - initial admins work via hardcoded list
      const needsUpdate = INITIAL_ADMIN_EMAILS.some(email => {
        const normalizedEmail = email.toLowerCase().trim();
        return !rolesData[normalizedEmail] || rolesData[normalizedEmail] !== USER_ROLES.ADMIN;
      });

      if (needsUpdate) {
        // Fire and forget - don't block on this
        setTimeout(() => {
          USERS_CONFIG.saveUserRoles(rolesData).catch(() => {
            // Silently fail - initial admins work via hardcoded list anyway
            console.log('Background save of initial admins failed (non-critical)');
          });
        }, 0);
      }

      return rolesData;
    } catch (error) {
      // If offline or error, return empty - initial admins handled in getUserRole()
      console.error('Firebase offline or error loading user roles:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      
      // If we get an "unavailable" or "offline" error, try to force network enable
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.log('Attempting to force Firestore online...');
        try {
          const { enableNetwork } = await import('firebase/firestore');
          await enableNetwork(db);
          console.log('Network force-enabled, but returning empty for this request');
        } catch (networkError) {
          console.warn('Could not force enable network:', networkError);
        }
      }
      
      return {};
    }
  },

  // Save user roles to Firebase
  async saveUserRoles(rolesConfig) {
    if (!rolesConfig || typeof rolesConfig !== 'object') {
      throw new Error('Invalid rolesConfig: must be an object');
    }
    
    try {
      console.log('Saving user roles to Firebase...', Object.keys(rolesConfig).length, 'users');
      
      // Ensure network is enabled before saving
      try {
        // Import and use the ensureNetworkReady function from firebase config
        const { ensureNetworkReady } = await import('../firebase/config.js');
        const networkReady = await ensureNetworkReady();
        if (!networkReady) {
          console.warn('⚠️ Network may not be ready, proceeding anyway...');
        }
        console.log('Network enabled and ready before save');
        // Small delay to ensure connection is established
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (networkError) {
        console.warn('Could not enable network before save:', networkError);
        // Try direct enable as fallback
        try {
          const { enableNetwork } = await import('firebase/firestore');
          await enableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (fallbackError) {
          console.warn('Fallback network enable also failed:', fallbackError);
        }
      }
      
      const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
      
      // Add timeout to prevent hanging (increased to 20 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('saveUserRoles timeout after 20 seconds')), 20000);
      });
      
      // Use retry mechanism for offline errors
      const { retryOnOffline } = await import('../firebase/config.js');
      
      await retryOnOffline(async () => {
        return await Promise.race([
          setDoc(usersRef, {
            ...rolesConfig,
            updatedAt: new Date(),
          }, { merge: false }), // Use setDoc with merge:false to replace entire document
          timeoutPromise,
        ]);
      });
      
      console.log('User roles saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving user roles:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
      });
      // Provide more helpful error message
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      } else if (error.code === 'unavailable' || error.message?.includes('offline')) {
        throw new Error('Firebase is offline. Changes will be saved when connection is restored. Please check your internet connection.');
      } else if (error.code === 'failed-precondition') {
        throw new Error('Firebase is not available. Please check your connection and try again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  },

  // Get role for a specific user
  // Always checks initial admin list first for immediate response
  async getUserRole(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // ALWAYS check initial admins first - this is the fast path
    if (INITIAL_ADMIN_EMAILS.includes(normalizedEmail)) {
      console.log(`getUserRole: ${normalizedEmail} is in initial admin list, returning admin immediately`);
      // Try to sync with Firebase in background (non-blocking)
      USERS_CONFIG.loadUserRoles().catch(() => {
        // Silently fail - we already have the answer
      });
      return USER_ROLES.ADMIN;
    }
    
    // For other users, try Firebase (but don't block if offline)
    try {
      const rolesConfig = await USERS_CONFIG.loadUserRoles();
      const role = rolesConfig[normalizedEmail] || USER_ROLES.CUSTOMER;
      return role;
    } catch (error) {
      // If Firebase fails (offline, etc), default to customer
      // Initial admins already handled above
      return USER_ROLES.CUSTOMER;
    }
  },

  // Set role for a specific user
  async setUserRole(email, role) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Load existing roles, but if it fails, start with empty object
    let rolesConfig = {};
    try {
      rolesConfig = await USERS_CONFIG.loadUserRoles();
    } catch (error) {
      console.warn('Failed to load existing roles, starting fresh:', error);
      // Continue with empty object - we'll still save the new role
    }
    
    // Ensure we have an object (not null/undefined)
    if (!rolesConfig || typeof rolesConfig !== 'object') {
      rolesConfig = {};
    }
    
    // Add the new role
    rolesConfig[normalizedEmail] = role;
    
    // Always ensure initial admins are preserved
    for (const initialEmail of INITIAL_ADMIN_EMAILS) {
      const normalizedInitialEmail = initialEmail.toLowerCase().trim();
      if (!rolesConfig[normalizedInitialEmail] || rolesConfig[normalizedInitialEmail] !== USER_ROLES.ADMIN) {
        rolesConfig[normalizedInitialEmail] = USER_ROLES.ADMIN;
      }
    }
    
    // Save to Firebase
    await USERS_CONFIG.saveUserRoles(rolesConfig);
    console.log(`Set role ${role} for ${normalizedEmail}`);
  },

  // Remove user role (downgrades to customer)
  async removeUserRole(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Load existing roles, but if it fails, start with empty object
    let rolesConfig = {};
    try {
      rolesConfig = await USERS_CONFIG.loadUserRoles();
    } catch (error) {
      console.warn('Failed to load existing roles:', error);
      // If we can't load, there's nothing to remove
      return;
    }
    
    // Ensure we have an object
    if (!rolesConfig || typeof rolesConfig !== 'object') {
      rolesConfig = {};
    }
    
    // Don't allow removing initial admin roles
    const INITIAL_ADMIN_EMAILS = [
      'michael.helmandarley@gmail.com',
      'lilmagnetmemories@gmail.com',
    ];
    if (INITIAL_ADMIN_EMAILS.includes(normalizedEmail)) {
      throw new Error(`${email} is an initial admin and cannot be removed. Initial admins are hardcoded for security.`);
    }
    
    delete rolesConfig[normalizedEmail];
    await USERS_CONFIG.saveUserRoles(rolesConfig);
  },

  // Get all users with their roles
  // Always includes initial admins even when offline
  async getAllUsersWithRoles() {
    // Start with initial admins immediately (fast path)
    const rolesConfig = {};
    for (const email of INITIAL_ADMIN_EMAILS) {
      const normalizedEmail = email.toLowerCase().trim();
      rolesConfig[normalizedEmail] = USER_ROLES.ADMIN;
    }
    
    // Try to load from Firebase, but don't block if it's slow
    try {
      const firebaseRoles = await USERS_CONFIG.loadUserRoles();
      // Merge Firebase roles into our config (Firebase takes precedence)
      if (firebaseRoles && typeof firebaseRoles === 'object') {
        Object.assign(rolesConfig, firebaseRoles);
      }
    } catch (error) {
      console.warn('Failed to load all users from Firebase (using initial admins only):', error);
      // Continue with initial admins - they're already in rolesConfig
    }
    
    // Ensure initial admins are always present (in case Firebase overwrote them)
    for (const email of INITIAL_ADMIN_EMAILS) {
      const normalizedEmail = email.toLowerCase().trim();
      rolesConfig[normalizedEmail] = USER_ROLES.ADMIN;
    }
    
    return rolesConfig;
  },

  // Check if user is admin
  async isAdmin(email) {
    const role = await USERS_CONFIG.getUserRole(email);
    return role === USER_ROLES.ADMIN;
  },

  // Check if user is operator (includes admins)
  async isOperator(email) {
    const role = await USERS_CONFIG.getUserRole(email);
    return role === USER_ROLES.OPERATOR || role === USER_ROLES.ADMIN;
  },

  // Set up real-time listener for user role changes
  setupRealtimeListener(onUpdate) {
    const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
    return onSnapshot(
      usersRef,
      (doc) => {
        console.log('Real-time user roles listener triggered');
        if (doc.exists()) {
          const data = doc.data();
          console.log('User roles updated in real-time:', data);
          if (onUpdate) {
            onUpdate(data);
          }
        }
      },
      (error) => {
        console.error('Error in user roles real-time listener:', error);
      }
    );
  },
};

export default USERS_CONFIG;

