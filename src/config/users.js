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
  async loadUserRoles() {
    try {
      console.log('Loading user roles from Firebase...');
      const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
      const usersSnap = await getDoc(usersRef);

      let rolesData = {};
      if (usersSnap.exists()) {
        rolesData = usersSnap.data();
        // Remove timestamp field if it exists
        delete rolesData.updatedAt;
        console.log('User roles loaded from Firebase:', rolesData);
      } else {
        console.log('No user roles config found in Firebase, creating initial config...');
      }

      // Seed initial admin emails if they don't exist
      let needsUpdate = false;
      for (const email of INITIAL_ADMIN_EMAILS) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!rolesData[normalizedEmail] || rolesData[normalizedEmail] !== USER_ROLES.ADMIN) {
          rolesData[normalizedEmail] = USER_ROLES.ADMIN;
          needsUpdate = true;
          console.log(`Seeding admin: ${normalizedEmail}`);
        }
      }

      // Save if we added any admins
      if (needsUpdate) {
        try {
          await USERS_CONFIG.saveUserRoles(rolesData);
          console.log('Initial admins seeded successfully');
        } catch (saveError) {
          console.error('Error saving seeded admins:', saveError);
          // If save fails (e.g., database doesn't exist), still return the data
          // so the app can function with in-memory admin list
          console.log('Continuing with in-memory admin list - admins will still work via fallback');
        }
      }
      
      // Always ensure initial admins are in the returned data, even if save failed
      for (const email of INITIAL_ADMIN_EMAILS) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!rolesData[normalizedEmail] || rolesData[normalizedEmail] !== USER_ROLES.ADMIN) {
          rolesData[normalizedEmail] = USER_ROLES.ADMIN;
        }
      }

      return rolesData;
    } catch (error) {
      console.error('Error loading user roles:', error);
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
  async getUserRole(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // First check if it's one of the initial admins (fast path)
    if (INITIAL_ADMIN_EMAILS.includes(normalizedEmail)) {
      console.log(`getUserRole: ${normalizedEmail} is in initial admin list, returning admin`);
      // Still try to load from Firebase to sync, but return admin immediately
      USERS_CONFIG.loadUserRoles().catch(err => {
        console.error('Error loading user roles (non-blocking):', err);
      });
      return USER_ROLES.ADMIN;
    }
    
    try {
      const rolesConfig = await USERS_CONFIG.loadUserRoles();
      const role = rolesConfig[normalizedEmail] || USER_ROLES.CUSTOMER;
      console.log(`getUserRole: ${normalizedEmail} has role ${role} from Firebase`);
      return role;
    } catch (error) {
      console.error('Error getting user role:', error);
      // Final fallback: check if it's one of the initial admins
      if (INITIAL_ADMIN_EMAILS.includes(normalizedEmail)) {
        console.log(`getUserRole: ${normalizedEmail} is in initial admin list (fallback)`);
        return USER_ROLES.ADMIN;
      }
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

