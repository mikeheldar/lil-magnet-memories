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

// User roles configuration
export const USERS_CONFIG = {
  // Firebase collection reference
  usersCollection: 'user_roles',
  
  // Load user roles from Firebase
  async loadUserRoles() {
    try {
      console.log('Loading user roles from Firebase...');
      const usersRef = doc(db, USERS_CONFIG.usersCollection, 'roles_config');
      const usersSnap = await getDoc(usersRef);

      if (usersSnap.exists()) {
        const data = usersSnap.data();
        console.log('User roles loaded from Firebase:', data);
        return data;
      } else {
        console.log('No user roles config found in Firebase, creating initial config...');
        // Create initial config
        await USERS_CONFIG.saveUserRoles({});
        return {};
      }
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
    const rolesConfig = await USERS_CONFIG.loadUserRoles();
    return rolesConfig[normalizedEmail] || USER_ROLES.CUSTOMER;
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

