import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ADMIN_CONFIG } from '../config/admin';
import { USERS_CONFIG, USER_ROLES } from '../config/users';

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

  // Sign out (and sign in anonymously to maintain auth context)
  async signOut() {
    try {
      console.log('AuthService: Starting sign out...');
      await signOut(auth);
      console.log('AuthService: Sign out successful, signing in anonymously...');
      
      // Sign in anonymously after sign out to maintain auth context for Storage rules
      // This is silent - user won't see any indication they're anonymous
      try {
        await signInAnonymously(auth);
        console.log('AuthService: Anonymous sign-in after sign-out successful');
      } catch (anonError) {
        console.error('AuthService: Anonymous sign-in failed (non-blocking):', anonError);
        // Non-blocking - continue even if anonymous sign-in fails
      }
      
      this.user = null;
      this.notifyListeners();
      console.log('AuthService: Notified listeners of sign out');
    } catch (error) {
      console.error('AuthService: Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  // Also check auth.currentUser directly for immediate availability on page refresh
  getCurrentUser() {
    // Check cached user first (synchronously available on page load)
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      // If we have a cached authenticated user but this.user is null, restore it
      if (!this.user) {
        console.log('Restoring user from auth.currentUser in getCurrentUser:', currentUser.email);
        this.user = currentUser;
        this.notifyListeners();
      }
      return this.user;
    }
    // Fallback to this.user (set by auth state listener)
    return this.user;
  }

  // Check if user is authenticated
  // Also check auth.currentUser directly for immediate availability on page refresh
  isAuthenticated() {
    // Check cached user first (synchronously available on page load)
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      // If we have a cached authenticated user but this.user is null, restore it
      if (!this.user) {
        console.log('Restoring user from auth.currentUser:', currentUser.email);
        this.user = currentUser;
        this.notifyListeners();
      }
      return true;
    }
    // Fallback to this.user (set by auth state listener)
    return !!this.user;
  }

  // Check if current user is an admin
  // This is synchronous and checks hardcoded admin list first for immediate response
  isAdmin() {
    const user = this.getCurrentUser(); // Use getCurrentUser to ensure user is restored from cache
    if (!user || !user.email) {
      return false;
    }
    
    const userEmail = user.email.toLowerCase().trim();
    
    // First check initial admin emails (hardcoded, always available)
    const INITIAL_ADMIN_EMAILS = [
      'michael.helmandarley@gmail.com',
      'amy.helmandarley@gmail.com',
      'lilmagnetmemories@gmail.com',
    ];
    if (INITIAL_ADMIN_EMAILS.includes(userEmail)) {
      return true;
    }
    
    // Then check legacy admin config (may be loaded from Firebase)
    if (ADMIN_CONFIG.isAdminEmail(userEmail)) {
      return true;
    }
    
    // Note: For Firebase role-based admins added via UI, use isAdminAsync()
    // This sync method prioritizes speed and works offline
    return false;
  }

  // Async version that checks Firebase user roles (for admins added via UI)
  // Note: Initial admins are checked synchronously in isAdmin() for immediate response
  async isAdminAsync() {
    const user = this.getCurrentUser(); // Use getCurrentUser to ensure user is restored from cache
    if (!user || !user.email) {
      return false;
    }
    
    const userEmail = user.email.toLowerCase().trim();
    
    // First check sync methods (fast, works offline)
    if (this.isAdmin()) {
      return true;
    }
    
    // Then check Firebase for admins added via UI
    try {
      const role = await USERS_CONFIG.getUserRole(userEmail);
      return role === USER_ROLES.ADMIN;
    } catch (error) {
      // If Firebase fails, we already checked sync methods above
      return false;
    }
  }
  
  // Check if current user is an operator (includes admins)
  async isOperator() {
    const user = this.getCurrentUser(); // Use getCurrentUser to ensure user is restored from cache
    if (!user || !user.email) {
      return false;
    }
    const isAdminUser = this.isAdmin();
    if (isAdminUser) {
      return true; // Admins are also operators
    }
    const userRole = await USERS_CONFIG.getUserRole(user.email);
    return userRole === USER_ROLES.OPERATOR;
  }
  
  // Get current user's role
  async getUserRole() {
    const user = this.getCurrentUser(); // Use getCurrentUser to ensure user is restored from cache
    if (!user || !user.email) {
      return null;
    }
    // Check if admin first
    if (this.isAdmin()) {
      return USER_ROLES.ADMIN;
    }
    return await USERS_CONFIG.getUserRole(user.email);
  }
  
  // Check if a specific email is admin
  async isAdminEmailAsync(email) {
    const isAdminEmail = ADMIN_CONFIG.isAdminEmail(email);
    if (isAdminEmail) return true;
    const userRole = await USERS_CONFIG.getUserRole(email);
    return userRole === USER_ROLES.ADMIN;
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
    const user = this.getCurrentUser(); // Use getCurrentUser to ensure user is restored from cache
    if (!user) {
      return null;
    }

    return {
      ...user,
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
    
    // Immediately check for cached user (available synchronously on page load)
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      console.log('Restoring authenticated user from cache:', currentUser.email);
      this.user = currentUser;
      this.notifyListeners();
    }
    
    // Set up listener for future auth state changes
    onAuthStateChanged(auth, (user) => {
      // Ignore anonymous users - they're only used for Storage rules, not for UI
      if (user && user.isAnonymous) {
        console.log('Auth state changed: Anonymous user (ignored for UI)');
        // Don't set this.user for anonymous users - keep previous user if exists
        // This allows real users to stay logged in on refresh
        return;
      }
      
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
