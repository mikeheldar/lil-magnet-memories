import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ADMIN_CONFIG } from '../config/admin';

class AuthService {
  constructor() {
    this.provider = new GoogleAuthProvider();
    // Add additional scopes if needed
    this.provider.addScope('email');
    this.provider.addScope('profile');
    this.user = null;
    this.listeners = [];
    this.adminListenerUnsubscribe = null;

    // Initialize admin configuration
    this.initializeAdminConfig()
      .then(() => {
        console.log('Admin config initialized successfully');
      })
      .catch((error) => {
        console.error('Failed to initialize admin config:', error);
      });
  }

  // Initialize admin configuration with real-time updates
  async initializeAdminConfig() {
    try {
      // Load initial admin emails
      await ADMIN_CONFIG.loadAdminEmails();

      // Set up real-time listener for admin email changes
      this.adminListenerUnsubscribe = ADMIN_CONFIG.setupRealtimeListener(() => {
        // Notify all listeners that admin status might have changed
        this.notifyListeners();
      });

      console.log('Admin configuration initialized with real-time updates');
    } catch (error) {
      console.error('Error initializing admin configuration:', error);
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      console.log('Attempting Google sign-in...');
      console.log('Firebase Auth object:', auth);
      console.log('Google Provider object:', this.provider);
      console.log('Current domain:', window.location.origin);

      // Add timeout to prevent hanging
      const signInPromise = signInWithPopup(auth, this.provider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign-in timeout')), 20000)
      );

      const result = await Promise.race([signInPromise, timeoutPromise]);
      console.log('Google sign-in successful:', result.user);
      this.user = result.user;
      this.notifyListeners();
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google sign-in');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled for this project');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase configuration issue');
      }

      throw new Error(
        `Authentication failed: ${
          error.message || error.code || 'Unknown error'
        }`
      );
    }
  }

  // Sign out
  async signOut() {
    try {
      console.log('AuthService: Starting sign out...');
      await signOut(auth);
      console.log('AuthService: Sign out successful');
      this.user = null;
      this.notifyListeners();
      console.log('AuthService: Notified listeners of sign out');
    } catch (error) {
      console.error('AuthService: Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user;
  }

  // Check if current user is an admin
  isAdmin() {
    if (!this.user || !this.user.email) {
      console.log('isAdmin: No user or email');
      return false;
    }
    // Always check the current admin list (not cached)
    const isAdmin = ADMIN_CONFIG.isAdminEmail(this.user.email);
    console.log('isAdmin check:', {
      userEmail: this.user.email,
      adminEmails: ADMIN_CONFIG.adminEmails,
      isAdmin: isAdmin,
    });
    return isAdmin;
  }

  // Refresh admin status and notify listeners
  refreshAdminStatus() {
    // Notify all listeners that admin status might have changed
    this.notifyListeners();
  }

  // Cleanup method to unsubscribe from listeners
  cleanup() {
    if (this.adminListenerUnsubscribe) {
      this.adminListenerUnsubscribe();
      this.adminListenerUnsubscribe = null;
    }
  }

  // Check if a specific email is an admin
  isAdminEmail(email) {
    return ADMIN_CONFIG.isAdminEmail(email);
  }

  // Get current user with admin status
  getCurrentUserWithAdminStatus() {
    if (!this.user) {
      return null;
    }

    return {
      ...this.user,
      isAdmin: this.isAdmin(),
    };
  }

  // Add auth state listener
  onAuthStateChanged(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Initialize auth state listener
  init() {
    console.log('Initializing Firebase Auth...');
    onAuthStateChanged(auth, (user) => {
      console.log(
        'Auth state changed:',
        user ? `User: ${user.email}` : 'No user'
      );
      this.user = user;
      this.notifyListeners();
    });
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }
}

export const authService = new AuthService();
