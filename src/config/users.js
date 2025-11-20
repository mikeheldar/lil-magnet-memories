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
  'amy.helmandarley@gmail.com',
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
      const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
      const usersSnap = await getDoc(usersRef);

      let rolesData = {};
      if (usersSnap.exists()) {
        rolesData = usersSnap.data();
        // Remove timestamp field if it exists
        delete rolesData.updatedAt;
      }

      // Always ensure initial admins are in the data
      for (const email of INITIAL_ADMIN_EMAILS) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!rolesData[normalizedEmail] || rolesData[normalizedEmail] !== USER_ROLES.ADMIN) {
          rolesData[normalizedEmail] = USER_ROLES.ADMIN;
        }
      }

      // Try to save if we updated anything (non-blocking)
      const needsUpdate = INITIAL_ADMIN_EMAILS.some(email => {
        const normalizedEmail = email.toLowerCase().trim();
        return !rolesData[normalizedEmail] || rolesData[normalizedEmail] !== USER_ROLES.ADMIN;
      });

      if (needsUpdate) {
        USERS_CONFIG.saveUserRoles(rolesData).catch(() => {
          // Silently fail - initial admins work via hardcoded list anyway
        });
      }

      return rolesData;
    } catch (error) {
      // If offline or error, return empty - initial admins handled in getUserRole()
      console.log('Firebase offline or error, using hardcoded admin list');
      return {};
    }
  },

  // Save user roles to Firebase
  async saveUserRoles(rolesConfig) {
    try {
      const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
      await setDoc(usersRef, {
        ...rolesConfig,
        updatedAt: new Date(),
      });
      console.log('User roles saved to Firebase');
    } catch (error) {
      console.error('Error saving user roles:', error);
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
    const rolesConfig = await USERS_CONFIG.loadUserRoles();
    rolesConfig[normalizedEmail] = role;
    await USERS_CONFIG.saveUserRoles(rolesConfig);
    console.log(`Set role ${role} for ${normalizedEmail}`);
  },

  // Remove user role (downgrades to customer)
  async removeUserRole(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const rolesConfig = await USERS_CONFIG.loadUserRoles();
    delete rolesConfig[normalizedEmail];
    await USERS_CONFIG.saveUserRoles(rolesConfig);
  },

  // Get all users with their roles
  async getAllUsersWithRoles() {
    const rolesConfig = await USERS_CONFIG.loadUserRoles();
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

